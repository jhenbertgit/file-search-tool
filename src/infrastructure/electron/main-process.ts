import { app, BrowserWindow, ipcMain, dialog } from "electron";
import Store from "electron-store";
import { container } from "../di/container";
import { TYPES } from "../di/types";
import {
  FileSearchService,
  SearchOptions,
} from "../../core/domain/services/file-search-service";
import path from "path";

// Define the schema for the store
interface StoreSchema {
  searchHistory: SearchOptions[];
}

// Create a new instance of electron-store
const store = new Store<StoreSchema>({
  defaults: {
    searchHistory: [],
  },
});

export class ElectronMainProcess {
  private mainWindow!: BrowserWindow; // Definite assignment assertion
  private fileSearchService: FileSearchService;

  constructor() {
    this.fileSearchService = container.get<FileSearchService>(
      TYPES.FileSearchService
    );
    // IPC setup will be called after window creation
  }

  private setupIPC(): void {
    ipcMain.handle("open-directory-dialog", async () => {
      // Ensure we have a main window before showing dialog
      if (!this.mainWindow) {
        console.error("Main window not available for directory dialog");
        return null;
      }

      const { canceled, filePaths } = await dialog.showOpenDialog(
        this.mainWindow,
        {
          properties: ["openDirectory"],
          title: "Select Directory to Search",
        }
      );

      if (canceled || filePaths.length === 0) {
        return null;
      }

      return filePaths[0];
    });

    ipcMain.handle("get-search-history", () => {
      return (store as any).get("searchHistory");
    });

    ipcMain.handle("add-to-search-history", (event, search: SearchOptions) => {
      const history = (store as any).get("searchHistory") as SearchOptions[];

      // Avoid duplicates
      const existingIndex = history.findIndex(
        (item: SearchOptions) =>
          item.directory === search.directory &&
          item.searchTerm === search.searchTerm &&
          item.searchType === search.searchType
      );

      if (existingIndex > -1) {
        history.splice(existingIndex, 1);
      }

      // Add new search to the top
      history.unshift(search);

      // Limit to 10 entries
      if (history.length > 10) {
        history.pop();
      }

      (store as any).set("searchHistory", history);
    });

    ipcMain.handle("search-files", async (event, options: SearchOptions) => {
      try {
        // Add to history
        ipcMain.emit("add-to-search-history", event, options);

        const results = await this.fileSearchService.searchFiles(options);
        return { success: true, data: results };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    ipcMain.on("stop-search", () => {
      this.fileSearchService.stopSearch();
    });

    // Progress updates
    this.fileSearchService.onProgress((progress) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("search-progress", progress);
      }
    });
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  public initialize(): void {
    app.whenReady().then(() => this.createWindow());

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
    });
  }

  private async createWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    // In development, load from src directory; in production, load from dist
    const htmlPath = process.env.NODE_ENV === "development"
      ? path.join(__dirname, "../../../src/index.html")
      : path.join(__dirname, "../../presentation/electron-ui/index.html");

    await this.mainWindow.loadFile(htmlPath);

    // Setup IPC handlers after window is created
    this.setupIPC();

    if (process.env.NODE_ENV === "development") {
      this.mainWindow.webContents.openDevTools();
    }
  }
}

// Application entry point
const mainProcess = new ElectronMainProcess();
mainProcess.initialize();
