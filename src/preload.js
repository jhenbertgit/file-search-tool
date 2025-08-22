const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openDirectoryDialog: () => ipcRenderer.invoke("open-directory-dialog"),
  searchFiles: (params) => ipcRenderer.send("search-files", params),
  stopSearch: () => ipcRenderer.send("stop-search"),
  openFile: (filePath) => ipcRenderer.send("open-file", filePath),
  openFileLocation: (filePath) =>
    ipcRenderer.send("open-file-location", filePath),
  onSearchResults: (callback) =>
    ipcRenderer.on("search-results", (_event, results) => {
      callback(results);
    }),
  onSearchError: (callback) =>
    ipcRenderer.on("search-error", (_event, error) => {
      callback(error);
    }),
  onSearchProgress: (callback) =>
    ipcRenderer.on("search-progress", (_event, progress) => {
      callback(progress);
    }),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
