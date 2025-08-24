"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/electron/preload.ts
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    openDirectoryDialog: () => electron_1.ipcRenderer.invoke("open-directory-dialog"),
    searchFiles: (options) => electron_1.ipcRenderer.invoke("search-files", options),
    stopSearch: () => electron_1.ipcRenderer.send("stop-search"),
    onSearchProgress: (callback) => {
        electron_1.ipcRenderer.on("search-progress", (event, progress) => callback(progress));
    },
    onSearchResults: (callback) => {
        electron_1.ipcRenderer.on("search-results", (event, results) => callback(results));
    },
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    },
});
