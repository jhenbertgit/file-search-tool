const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openDirectoryDialog: () => ipcRenderer.invoke("open-directory-dialog"),
  searchFiles: (params) => ipcRenderer.send("search-files", params),
  stopSearch: () => ipcRenderer.send("stop-search"),
  openFile: (filePath) => ipcRenderer.send("open-file", filePath),
  openFileLocation: (filePath) =>
    ipcRenderer.send("open-file-location", filePath),

  onNewSearch: (callback) => {
    ipcRenderer.removeAllListeners("new-search");
    ipcRenderer.on("new-search", () => callback());
  },

  onDirectorySelected: (callback) => {
    ipcRenderer.removeAllListeners("directory-selected");
    ipcRenderer.on("directory-selected", (event, directory) => {
      callback(directory);
    });
  },

  onSearchProgress: (callback) => {
    ipcRenderer.removeAllListeners("search-progress");
    ipcRenderer.on("search-progress", (event, progressData) => {
      console.log("IPC progress data received:", progressData);
      callback(progressData);
    });
  },

  onSearchResults: (callback) => {
    ipcRenderer.removeAllListeners("search-results");
    ipcRenderer.on("search-results", (event, results) => callback(results));
  },

  onSearchError: (callback) => {
    ipcRenderer.removeAllListeners("search-error");
    ipcRenderer.on("search-error", (event, error) => callback(error));
  },

  getAppVersion: () => {
    return new Promise((resolve, reject) => {
      try {
        // For development, use npm environment variable
        if (process.env.npm_package_version) {
          resolve(process.env.npm_package_version);
          return;
        }

        // For production, read from package.json
        const fs = require("fs");
        const path = require("path");
        const packageJsonPath = path.join(process.cwd(), "package.json");

        fs.readFile(packageJsonPath, "utf8", (err, data) => {
          if (err) {
            // Fallback to environment variable or default
            resolve(process.env.APP_VERSION || "1.0.0");
            return;
          }

          try {
            const packageData = JSON.parse(data);
            resolve(packageData.version);
          } catch (parseError) {
            resolve("1.0.0");
          }
        });
      } catch (error) {
        resolve("1.0.0");
      }
    });
  },

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
