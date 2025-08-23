const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const is = require("electron-is");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");

// Handle Squirrel events for Windows installer
if (require("electron-squirrel-startup")) {
  app.quit();
}

function handleSquirrelEvent() {
  if (process.argv.length === 1 || !is.windows()) {
    return false;
  }

  const appFolder = path.resolve(process.execPath, "..");
  const rootAtomFolder = path.resolve(appFolder, "..");
  const updateExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));
  const exeName = path.basename(process.execPath);
  const spawnUpdate = function (args) {
    try {
      const spawnedProcess = spawn(updateExe, args, { detached: true });
      spawnedProcess.on("close", () => app.quit());
      return true;
    } catch (error) {
      console.error("Squirrel event error:", error);
      return false;
    }
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case "--squirrel-install":
    case "--squirrel-updated":
      // Install desktop and start menu shortcuts
      spawnUpdate(["--createShortcut", exeName]);
      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-uninstall":
      // Remove desktop and start menu shortcuts
      spawnUpdate(["--removeShortcut", exeName]);
      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-obsolete":
      app.quit();
      return true;
  }

  return false;
}

if (handleSquirrelEvent()) {
  // Squirrel handled the event, quit the app
  process.exit(0);
}

let mainWindow;
let watcher;
let isSearching = false;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("open-directory-dialog", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Directory to Search",
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

ipcMain.on(
  "search-files",
  async (event, { directory, searchTerm, searchType, fileType }) => {
    if (isSearching) {
      return;
    }

    try {
      isSearching = true;

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
        try {
          const items = await fs.readdir(dir);
          for (const item of items) {
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
              console.log(`Cannot stat: ${itemPath}`);
            }
          }
        } catch (readdirErr) {
          // Ignore directories that can't be read
          console.log(`Cannot read directory: ${dir}`);
        }
      };

      await countFiles(directory);

      const searchDirectory = async (dir, term, type, exts) => {
        let results = [];
        try {
          const items = await fs.readdir(dir);
          for (const item of items) {
            if (!isSearching) break;

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

                // Update progress
                if (scannedFiles % 10 === 0 || scannedFiles === totalFiles) {
                  mainWindow.webContents.send("search-progress", {
                    scanned: scannedFiles,
                    total: totalFiles,
                    matched: matchedFiles,
                    percentage: Math.round((scannedFiles / totalFiles) * 100),
                  });
                }

                // Check if file matches extension filter
                const fileExt = path.extname(item).toLowerCase().substring(1);
                const matchesExtension =
                  !exts ||
                  exts.length === 0 ||
                  exts.some((ext) => fileExt === ext);

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
                    const content = await fs.readFile(itemPath, "utf-8");
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
                    // Ignore files that can't be read
                    console.log(`Cannot read file: ${itemPath}`);
                  }
                }
              }
            } catch (statErr) {
              // Ignore files that can't be stat'd
              console.log(`Cannot stat: ${itemPath}`);
            }
          }
        } catch (readdirErr) {
          // Ignore directories that can't be read
          console.log(`Cannot read directory: ${dir}`);
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

      if (isSearching) {
        mainWindow.webContents.send("search-results", initialResults);
      }

      // Set up watcher for real-time updates if search is still active
      if (isSearching) {
        watcher = chokidar.watch(directory, {
          ignored: /(^|[\/\\])\../, // ignore dotfiles
          persistent: true,
          ignoreInitial: true,
          depth: 99, // Watch subdirectories recursively
          ignorePermissionErrors: true,
          atomic: true, // Avoid triggering events for temporary files
        });

        watcher.on("all", async (event, filePath) => {
          // Only re-search if it's a relevant event and search is still active
          if (isSearching && ["add", "unlink", "change"].includes(event)) {
            const updatedResults = await searchDirectory(
              directory,
              searchTerm,
              searchType,
              extensions
            );
            mainWindow.webContents.send("search-results", updatedResults);
          }
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      mainWindow.webContents.send("search-error", { message: error.message });
    } finally {
      isSearching = false;
    }
  }
);

// Open a file with the default application
ipcMain.on("open-file", (event, filePath) => {
  shell.openPath(filePath).catch((err) => {
    console.error("Failed to open file:", err);
  });
});

// Open the file location in file explorer
ipcMain.on("open-file-location", (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.on("stop-search", () => {
  isSearching = false;
  if (watcher) {
    watcher.close();
    watcher = null;
  }
});

// Handle app closing
app.on("before-quit", () => {
  if (watcher) {
    watcher.close();
  }
});
