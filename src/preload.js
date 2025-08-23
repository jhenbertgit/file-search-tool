const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Existing functions
  openDirectoryDialog: () => ipcRenderer.invoke("open-directory-dialog"),
  searchFiles: (params) => ipcRenderer.send("search-files", params),
  stopSearch: () => ipcRenderer.send("stop-search"),
  openFile: (filePath) => ipcRenderer.send("open-file", filePath),
  openFileLocation: (filePath) =>
    ipcRenderer.send("open-file-location", filePath),

  // New handlers for menu actions
  onNewSearch: (callback) => ipcRenderer.on("new-search", callback),
  onDirectorySelected: (callback) =>
    ipcRenderer.on("directory-selected", callback),
  onSearchStopped: (callback) => ipcRenderer.on("search-stopped", callback),

  // Existing listeners
  onSearchResults: (callback) => ipcRenderer.on("search-results", callback),
  onSearchError: (callback) => ipcRenderer.on("search-error", callback),
  onSearchProgress: (callback) => ipcRenderer.on("search-progress", callback),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
