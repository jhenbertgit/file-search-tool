const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Menu,
} = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");

// Office document text extraction libraries
const mammoth = require("mammoth");
const pdf = require("pdf-parse");
const xlsx = require("node-xlsx");

// Set version as global for access in renderer
process.env.APP_VERSION = require("../package.json").version;

// Environment detection
const isDev =
  process.env.NODE_ENV === "development" ||
  process.argv.includes("--dev") ||
  process.defaultApp;

// Suppress noisy error messages
const SUPPRESSED_ERRORS = [
  "Could not find the body element",
  "Could not find main document part",
  "is this a zip file",
  "end of central directory",
  "docx file",
  "zip file",
];

// Safe message sending function
function safeSend(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    try {
      mainWindow.webContents.send(channel, data);
    } catch (error) {
      console.error(`Failed to send ${channel}:`, error);
    }
  }
}

// Handle Squirrel events for Windows installer
function handleSquirrelEvents() {
  if (process.platform !== "win32" || process.argv.length <= 1) {
    return false;
  }

  const squirrelEvent = process.argv[1];
  const supportedEvents = [
    "--squirrel-install",
    "--squirrel-updated",
    "--squirrel-uninstall",
    "--squirrel-obsolete",
  ];

  if (!supportedEvents.includes(squirrelEvent)) {
    return false;
  }

  try {
    // Try to use electron-squirrel-startup if available
    try {
      const squirrelStartup = require("electron-squirrel-startup");
      if (squirrelStartup) {
        app.quit();
        return true;
      }
    } catch (e) {
      // Fall back to manual handling if module not available
      if (isDev) {
        console.log(
          "electron-squirrel-startup not available, using manual handling"
        );
      }
    }

    // Manual squirrel event handling
    const appFolder = path.resolve(process.execPath, "..");
    const rootAtomFolder = path.resolve(appFolder, "..");
    const updateExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));

    // Check if Update.exe exists
    if (!fs.existsSync(updateExe)) {
      return false;
    }

    const exeName = path.basename(process.execPath);

    const spawnUpdate = function (args) {
      try {
        const spawnedProcess = spawn(updateExe, args, {
          detached: true,
          stdio: "ignore", // Prevents hanging processes
        });
        spawnedProcess.unref(); // Important: allow parent to exit independently
        return true;
      } catch (error) {
        console.error("Squirrel event error:", error);
        return false;
      }
    };

    switch (squirrelEvent) {
      case "--squirrel-install":
      case "--squirrel-updated":
        spawnUpdate(["--createShortcut", exeName]);
        break;
      case "--squirrel-uninstall":
        spawnUpdate(["--removeShortcut", exeName]);
        break;
    }

    // Always quit for squirrel events
    setTimeout(() => app.quit(), 1000);
    return true;
  } catch (error) {
    console.error("Squirrel event handling failed:", error);
    return false;
  }
}

// Handle squirrel events
if (handleSquirrelEvents()) {
  // Don't continue if it's a squirrel event
  process.exit(0);
}

let mainWindow;
let watcher;
let isSearching = false;
let currentSearchAbortController = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// Complete Windows menu configuration
function createWindowsMenu() {
  const template = [
    {
      label: "&File",
      submenu: [
        {
          label: "&Open Directory",
          accelerator: "Ctrl+O",
          click: async () => {
            try {
              const { canceled, filePaths } = await dialog.showOpenDialog(
                mainWindow,
                {
                  properties: ["openDirectory"],
                  title: "Select Directory to Search",
                }
              );

              if (!canceled && filePaths.length > 0) {
                mainWindow.webContents.send("directory-selected", filePaths[0]);
              }
            } catch (error) {
              console.error("Error opening directory dialog:", error);
            }
          },
        },
        { type: "separator" },
        {
          label: "E&xit",
          accelerator: "Alt+F4",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "&Help",
      submenu: [
        {
          label: "&Documentation",
          accelerator: "F1",
          click: async () => {
            await shell.openExternal(
              "https://github.com/jhenbertgit/file-search-tool/wiki"
            );
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createApplicationMenu() {
  if (process.platform === "win32") {
    createWindowsMenu();
  }
}

// Office document support functions
function isSupportedOfficeDocument(filename) {
  const officeExtensions = new Set([
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "csv",
    "txt",
    "rtf",
    "odt",
    "ods",
    "odp",
    "html",
    "htm",
    "xml",
    "json",
  ]);

  const extension = filename.split(".").pop().toLowerCase();
  return officeExtensions.has(extension);
}

// Improved file type detection
async function detectActualFileType(filePath) {
  try {
    const buffer = Buffer.alloc(4100);
    const fd = await fs.open(filePath, "r");
    const { bytesRead } = await fd.read(buffer, 0, 4100, 0);
    await fd.close();

    // Use subarray instead of deprecated slice
    const header = buffer.subarray(0, Math.min(bytesRead, 4100));

    // Check for PDF
    if (header.subarray(0, 4).toString() === "%PDF") {
      return "pdf";
    }

    // Check for ZIP-based formats
    if (header.subarray(0, 2).toString("hex") === "504b") {
      const headerStr = header.toString("utf8");

      if (headerStr.includes("word/")) return "docx";
      if (headerStr.includes("ppt/") || headerStr.includes("slides/"))
        return "pptx";
      if (headerStr.includes("xl/") || headerStr.includes("worksheets/"))
        return "xlsx";

      const ext = path.extname(filePath).toLowerCase().slice(1);
      if (["docx", "pptx", "xlsx"].includes(ext)) return ext;

      return "zip";
    }

    // Check for older Office formats
    if (header.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1") {
      return path.extname(filePath).toLowerCase().slice(1);
    }

    return path.extname(filePath).toLowerCase().slice(1);
  } catch (error) {
    return path.extname(filePath).toLowerCase().slice(1);
  }
}

async function searchPDFContent(filePath, searchTermLower) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text.toLowerCase().includes(searchTermLower);
  } catch (error) {
    if (
      isDev &&
      !SUPPRESSED_ERRORS.some((pattern) => error.message.includes(pattern))
    ) {
      console.error("PDF processing error:", error.message);
    }
    return false;
  }
}

async function searchWordContent(filePath, searchTermLower) {
  const filename = path.basename(filePath);

  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.toLowerCase().includes(searchTermLower);
  } catch (error) {
    // Fallback for problematic Word files
    try {
      const buffer = await fs.readFile(filePath);
      const text = buffer.toString("utf8", 0, Math.min(buffer.length, 1000000));

      const cleanText = text
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase();

      return cleanText.includes(searchTermLower);
    } catch (fallbackError) {
      return false;
    }
  }
}

async function searchExcelContent(filePath, searchTermLower) {
  try {
    const workSheets = xlsx.parse(filePath);
    for (const sheet of workSheets) {
      for (const row of sheet.data) {
        for (const cell of row) {
          if (cell && cell.toString().toLowerCase().includes(searchTermLower)) {
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    if (
      isDev &&
      !SUPPRESSED_ERRORS.some((pattern) => error.message.includes(pattern))
    ) {
      console.error("Excel processing error:", error.message);
    }
    return false;
  }
}

async function searchPowerPointContent(filePath, searchTermLower) {
  const filename = path.basename(filePath);

  try {
    const result = await mammoth.extractRawText({ path: filePath });
    if (result.value.toLowerCase().includes(searchTermLower)) {
      return true;
    }
  } catch (mammothError) {
    // Continue to fallback
  }

  // Alternative approach
  try {
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 500000));

    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .toLowerCase();

    return cleanText.includes(searchTermLower);
  } catch (zipError) {
    // Final fallback - this is reachable now
    try {
      return await searchTextContent(filePath, searchTermLower);
    } catch (finalError) {
      return false;
    }
  }
}

async function searchLegacyOfficeContent(filePath, searchTermLower, fileType) {
  try {
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 1000000));

    const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").toLowerCase();
    return cleanText.includes(searchTermLower);
  } catch (error) {
    return false;
  }
}

async function searchTextContent(filePath, searchTermLower) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content.toLowerCase().includes(searchTermLower);
  } catch (error) {
    return false;
  }
}

// Improved Office file content search
async function searchOfficeFileContent(filePath, searchTerm, signal) {
  if (signal.aborted) return false;

  const searchTermLower = searchTerm.toLowerCase();
  const filename = path.basename(filePath);

  try {
    const actualFileType = await detectActualFileType(filePath);

    switch (actualFileType) {
      case "pdf":
        return await searchPDFContent(filePath, searchTermLower);

      case "docx":
        return await searchWordContent(filePath, searchTermLower);

      case "doc":
        return await searchLegacyOfficeContent(
          filePath,
          searchTermLower,
          "doc"
        );

      case "xlsx":
        return await searchExcelContent(filePath, searchTermLower);

      case "xls":
        return await searchLegacyOfficeContent(
          filePath,
          searchTermLower,
          "xls"
        );

      case "pptx":
        return await searchPowerPointContent(filePath, searchTermLower);

      case "ppt":
        return await searchLegacyOfficeContent(
          filePath,
          searchTermLower,
          "ppt"
        );

      case "csv":
      case "txt":
      case "rtf":
      case "html":
      case "htm":
      case "xml":
      case "json":
      case "odt":
      case "ods":
      case "odp":
        return await searchTextContent(filePath, searchTermLower);

      default:
        return await searchTextContent(filePath, searchTermLower);
    }
  } catch (error) {
    if (
      isDev &&
      !SUPPRESSED_ERRORS.some((pattern) => error.message.includes(pattern))
    ) {
      console.error(`Error processing ${filename}:`, error.message);
    }

    try {
      return await searchTextContent(filePath, searchTermLower);
    } catch (fallbackError) {
      return false;
    }
  }
}

async function searchFileContent(filePath, searchTerm, signal) {
  const filename = path.basename(filePath);

  if (!isSupportedOfficeDocument(filename)) {
    return false;
  }

  try {
    const result = await searchOfficeFileContent(filePath, searchTerm, signal);
    return result;
  } catch (error) {
    if (
      isDev &&
      !SUPPRESSED_ERRORS.some((pattern) => error.message.includes(pattern))
    ) {
      console.error(`Error searching ${filename}:`, error.message);
    }
    return false;
  }
}

app.whenReady().then(() => {
  createWindow();
  createApplicationMenu();
});

app.on("window-all-closed", () => {
  if (watcher) {
    watcher.close();
    watcher = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", (event) => {
  if (isSearching) {
    event.preventDefault();

    if (currentSearchAbortController) {
      currentSearchAbortController.abort();
    }

    if (watcher) {
      watcher.close();
      watcher = null;
    }

    setTimeout(() => {
      app.quit();
    }, 500);
  }
});

ipcMain.handle("open-directory-dialog", async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Directory to Search",
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    return filePaths[0];
  } catch (error) {
    console.error("Directory dialog error:", error);
    return null;
  }
});

ipcMain.on("search-files", async (event, searchParams) => {
  const {
    directory,
    searchTerm,
    searchType,
    fileType,
    maxFileSize = 100 * 1024 * 1024,
  } = searchParams;

  if (typeof directory !== "string") {
    console.error("Invalid directory parameter:", directory);
    mainWindow.webContents.send("search-error", {
      message: "Invalid directory selected",
    });
    return;
  }

  if (isSearching) {
    safeSend("search-error", { message: "Search already in progress" });
    return;
  }

  try {
    isSearching = true;
    currentSearchAbortController = new AbortController();
    const signal = currentSearchAbortController.signal;

    if (watcher) {
      watcher.close();
    }

    // Parse file extensions
    let extensions = [];
    if (fileType) {
      extensions = fileType.split(",").map((ext) => ext.trim().toLowerCase());
    }

    // Count total files first for progress reporting
    let totalFiles = 0;
    let scannedFiles = 0;
    let matchedFiles = 0;

    const countFiles = async (dir) => {
      if (signal.aborted) return;

      try {
        const items = await fs.readdir(dir);
        for (const item of items) {
          if (signal.aborted) break;

          const itemPath = path.join(dir, item);
          try {
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
              await countFiles(itemPath);
            } else if (stat.isFile()) {
              totalFiles++;
            }
          } catch (statErr) {
            if (isDev) console.log(`Cannot stat: ${itemPath}`);
          }
        }
      } catch (readdirErr) {
        if (isDev) console.log(`Cannot read directory: ${dir}`);
      }
    };

    await countFiles(directory);

    const searchDirectory = async (dir, term, type, exts) => {
      if (signal.aborted) return [];

      let results = [];
      try {
        const items = await fs.readdir(dir);
        for (const item of items) {
          if (signal.aborted) break;

          const itemPath = path.join(dir, item);
          try {
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
              const subResults = await searchDirectory(
                itemPath,
                term,
                type,
                exts
              );
              results = results.concat(subResults);
            } else if (stat.isFile()) {
              scannedFiles++;

              // Update progress
              if (scannedFiles % 10 === 0 || scannedFiles === totalFiles) {
                safeSend("search-progress", {
                  scanned: scannedFiles,
                  total: totalFiles,
                  matched: matchedFiles,
                  percentage:
                    totalFiles > 0
                      ? Math.round((scannedFiles / totalFiles) * 100)
                      : 0,
                });
              }

              // Check if file matches extension filter
              const fileExt = path.extname(item).toLowerCase().substring(1);
              const matchesExtension =
                exts.length === 0 || exts.some((ext) => fileExt === ext);

              if (!matchesExtension) {
                continue;
              }

              if (type === "file-name") {
                if (item.toLowerCase().includes(term.toLowerCase())) {
                  results.push({
                    name: item,
                    path: itemPath,
                    size: stat.size,
                    modified: stat.mtime,
                  });
                  matchedFiles++;
                }
              } else {
                // Skip very large files for performance
                if (stat.size > maxFileSize) {
                  continue;
                }

                // Use optimized content search for Office documents
                const contentMatch = await searchFileContent(
                  itemPath,
                  term,
                  signal
                );
                if (contentMatch) {
                  results.push({
                    name: item,
                    path: itemPath,
                    size: stat.size,
                    modified: stat.mtime,
                  });
                  matchedFiles++;
                }
              }
            }
          } catch (statErr) {
            if (isDev) console.log(`Cannot stat: ${itemPath}`);
          }
        }
      } catch (readdirErr) {
        if (isDev) console.log(`Cannot read directory: ${dir}`);
      }
      return results;
    };

    // Perform initial search
    const initialResults = await searchDirectory(
      directory,
      searchTerm,
      searchType,
      extensions
    );

    if (!signal.aborted) {
      safeSend("search-results", initialResults);
    }

    // Set up watcher for real-time updates
    if (!signal.aborted) {
      watcher = chokidar.watch(directory, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        depth: 99,
        ignorePermissionErrors: true,
        atomic: true,
      });

      watcher.on("all", async (event, filePath) => {
        if (signal.aborted) return;

        if (["add", "unlink", "change"].includes(event)) {
          const updatedResults = await searchDirectory(
            directory,
            searchTerm,
            searchType,
            extensions
          );
          if (!signal.aborted) {
            safeSend("search-results", updatedResults);
          }
        }
      });
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Search error:", error);
      safeSend("search-error", { message: error.message });
    }
  } finally {
    isSearching = false;
    currentSearchAbortController = null;
  }
});

ipcMain.on("open-file", (event, filePath) => {
  shell.openPath(filePath).catch((err) => {
    console.error("Failed to open file:", err);
    safeSend("open-file-error", { message: err.message });
  });
});

ipcMain.on("open-file-location", (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.on("stop-search", () => {
  isSearching = false;

  if (currentSearchAbortController) {
    currentSearchAbortController.abort();
    currentSearchAbortController = null;
  }

  if (watcher) {
    watcher.close();
    watcher = null;
  }

  safeSend("search-stopped");
});

ipcMain.handle("health-check", () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});
