import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { container } from "../di/container";
import { TYPES } from "../di/types";
import {
  FileSearchService,
  SearchOptions,
} from "../../core/domain/services/file-search-service";
import path from "path";

export class ElectronMainProcess {
  private mainWindow!: BrowserWindow; // Definite assignment assertion
  private fileSearchService: FileSearchService;

  constructor() {
    this.fileSearchService = container.get<FileSearchService>(
      TYPES.FileSearchService
    );
    this.setupIPC();
  }

  private setupIPC(): void {
    ipcMain.handle("open-directory-dialog", async () => {
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

    ipcMain.handle("search-files", async (event, options: SearchOptions) => {
      try {
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

    await this.mainWindow.loadFile(
      path.join(__dirname, "../../presentation/electron-ui/index.html")
    );

    if (process.env.NODE_ENV === "development") {
      this.mainWindow.webContents.openDevTools();
    }
  }
}

// Application entry point
const mainProcess = new ElectronMainProcess();
mainProcess.initialize();
