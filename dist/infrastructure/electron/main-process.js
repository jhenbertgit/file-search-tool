"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronMainProcess = void 0;
// src/infrastructure/electron/main-process.ts
const electron_1 = require("electron");
const container_1 = require("../di/container");
const types_1 = require("../di/types");
const path_1 = __importDefault(require("path"));
class ElectronMainProcess {
    constructor() {
        this.fileSearchService = container_1.container.get(types_1.TYPES.FileSearchService);
        this.setupIPC();
    }
    setupIPC() {
        electron_1.ipcMain.handle("open-directory-dialog", async () => {
            const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(this.mainWindow, {
                properties: ["openDirectory"],
                title: "Select Directory to Search",
            });
            if (canceled || filePaths.length === 0) {
                return null;
            }
            return filePaths[0];
        });
        electron_1.ipcMain.handle("search-files", async (event, options) => {
            try {
                const results = await this.fileSearchService.searchFiles(options);
                return { success: true, data: results };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        });
        electron_1.ipcMain.on("stop-search", () => {
            this.fileSearchService.stopSearch();
        });
        // Progress updates
        this.fileSearchService.onProgress((progress) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send("search-progress", progress);
            }
        });
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    initialize() {
        electron_1.app.whenReady().then(() => this.createWindow());
        electron_1.app.on("window-all-closed", () => {
            if (process.platform !== "darwin")
                electron_1.app.quit();
        });
        electron_1.app.on("activate", () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0)
                this.createWindow();
        });
    }
    async createWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
            width: 900,
            height: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path_1.default.join(__dirname, "preload.js"),
            },
        });
        await this.mainWindow.loadFile(path_1.default.join(__dirname, "../../presentation/electron-ui/index.html"));
        if (process.env.NODE_ENV === "development") {
            this.mainWindow.webContents.openDevTools();
        }
    }
}
exports.ElectronMainProcess = ElectronMainProcess;
// Application entry point
const mainProcess = new ElectronMainProcess();
mainProcess.initialize();
