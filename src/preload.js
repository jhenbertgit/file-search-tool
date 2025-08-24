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
    return ipcRenderer.invoke("get-app-version");
  },

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
