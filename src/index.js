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

// Environment detection
const isDev =
  process.env.NODE_ENV === "development" ||
  process.argv.includes("--dev") ||
  process.defaultApp;

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
                // This should send ONLY the directory string
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

// Add this function to create the menu
function createApplicationMenu() {
  if (process.platform === "win32") {
    createWindowsMenu();
  }
  // You can add other platform menus here if needed
}

app.whenReady().then(() => {
  createWindow();
  createApplicationMenu();
});

app.on("window-all-closed", () => {
  // Clean up resources
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

// Handle app closing more gracefully
app.on("before-quit", (event) => {
  if (isSearching) {
    event.preventDefault(); // Prevent immediate quit

    // Stop search operations first
    if (currentSearchAbortController) {
      currentSearchAbortController.abort();
    }

    if (watcher) {
      watcher.close();
      watcher = null;
    }

    // Wait a moment for cleanup, then quit
    setTimeout(() => {
      app.quit();
    }, 500);
  }
});

// Directory dialog handler
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

// Main search function
ipcMain.on("search-files", async (event, searchParams) => {
  const { directory, searchTerm, searchType, fileType } = searchParams;

  console.log("Search directory:", directory); // Debug log
  console.log("Type of directory:", typeof directory); // Debug log

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
            // Ignore files that can't be stat'd
            if (isDev) console.log(`Cannot stat: ${itemPath}`);
          }
        }
      } catch (readdirErr) {
        // Ignore directories that can't be read
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
              // Recursively search subdirectories
              const subResults = await searchDirectory(
                itemPath,
                term,
                type,
                exts
              );
              results = results.concat(subResults);
            } else if (stat.isFile()) {
              scannedFiles++;

              // In your searchDirectory function, find the progress update section:
              if (scannedFiles % 25 === 0 || scannedFiles === totalFiles) {
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
                try {
                  // Read only first 64KB for content search to improve performance
                  const content = await fs.readFile(itemPath, "utf-8", {
                    encoding: "utf-8",
                    flag: "r",
                    signal,
                  });
                  if (content.toLowerCase().includes(term.toLowerCase())) {
                    results.push({
                      name: item,
                      path: itemPath,
                      size: stat.size,
                      modified: stat.mtime,
                    });
                    matchedFiles++;
                  }
                } catch (readErr) {
                  // Ignore files that can't be read (binary files, etc.)
                  if (isDev) console.log(`Cannot read file: ${itemPath}`);
                }
              }
            }
          } catch (statErr) {
            // Ignore files that can't be stat'd
            if (isDev) console.log(`Cannot stat: ${itemPath}`);
          }
        }
      } catch (readdirErr) {
        // Ignore directories that can't be read
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

    // Set up watcher for real-time updates if search is still active
    if (!signal.aborted) {
      watcher = chokidar.watch(directory, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 99, // Watch subdirectories recursively
        ignorePermissionErrors: true,
        atomic: true, // Avoid triggering events for temporary files
      });

      watcher.on("all", async (event, filePath) => {
        if (signal.aborted) return;

        // Only re-search if it's a relevant event
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

// Open a file with the default application
ipcMain.on("open-file", (event, filePath) => {
  shell.openPath(filePath).catch((err) => {
    console.error("Failed to open file:", err);
    safeSend("open-file-error", { message: err.message });
  });
});

// Open the file location in file explorer
ipcMain.on("open-file-location", (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// Stop search handler
ipcMain.on("stop-search", () => {
  isSearching = false;

  // Abort ongoing search operations
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

// Health check handler
ipcMain.handle("health-check", () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});
