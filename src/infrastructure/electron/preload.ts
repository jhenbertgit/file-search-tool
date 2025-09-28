import { contextBridge, ipcRenderer } from "electron";
import { SearchOptions } from "../../core/domain/services/file-search-service";
import { SearchResult } from "../../core/domain/entities/search-results";

contextBridge.exposeInMainWorld("electronAPI", {
  openDirectoryDialog: () => ipcRenderer.invoke("open-directory-dialog"),

  searchFiles: (options: SearchOptions) =>
    ipcRenderer.invoke("search-files", options),

  stopSearch: () => ipcRenderer.send("stop-search"),

  getSearchHistory: () => ipcRenderer.invoke("get-search-history"),

  addToSearchHistory: (search: SearchOptions) =>
    ipcRenderer.invoke("add-to-search-history", search),

  onSearchProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on("search-progress", (event, progress) => callback(progress));
  },

  onSearchResults: (callback: (results: SearchResult[]) => void) => {
    ipcRenderer.on("search-results", (event, results) => callback(results));
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
