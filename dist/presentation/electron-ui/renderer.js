"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("../../infrastructure/di/container");
const types_1 = require("../../infrastructure/di/types");
class SearchApp {
    constructor() {
        this.fileSearchService = container_1.container.get(types_1.TYPES.FileSearchService);
        this.initializeUI();
        this.setupEventListeners();
        this.setupIpcListeners();
    }
    setupIpcListeners() {
        if (window.electronAPI) {
            try {
                window.electronAPI.onSearchProgress((progress) => {
                    this.updateProgress(progress);
                });
                window.electronAPI.onSearchResults((results) => {
                    this.displayResults(results);
                    this.resetSearchButton();
                });
            }
            catch (error) {
                console.error("IPC listener setup failed:", error);
                this.handleError(error);
            }
        }
        else {
            console.warn("electronAPI not available");
        }
    }
    initializeUI() {
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Element with id "${id}" not found`);
            }
            return element;
        };
        this.searchButton = getElement("search-button");
        this.resultsList = getElement("results-list");
        this.directoryInput = getElement("directory");
        this.searchTermInput = getElement("search-term");
        this.searchTypeSelect = getElement("search-type");
        this.fileTypesInput = getElement("file-types");
        this.progressElement = getElement("progress-text");
    }
    setupEventListeners() {
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        this.searchButton.addEventListener("click", () => this.handleSearch(), {
            signal,
        });
        this.fileSearchService.onProgress((progress) => {
            this.updateProgress(progress);
        });
    }
    async handleSearch() {
        if (this.searchButton.disabled)
            return;
        this.setSearchButtonLoading(true);
        this.resultsList.innerHTML = "";
        const options = {
            directory: this.directoryInput.value.trim(),
            searchTerm: this.searchTermInput.value.trim(),
            searchType: this.searchTypeSelect.value,
            fileTypes: this.fileTypesInput.value
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0),
        };
        // Validate inputs
        if (!options.directory) {
            this.handleError(new Error("Please select a directory"));
            this.setSearchButtonLoading(false);
            return;
        }
        if (!options.searchTerm) {
            this.handleError(new Error("Please enter a search term"));
            this.setSearchButtonLoading(false);
            return;
        }
        try {
            const results = await this.fileSearchService.searchFiles(options);
            this.displayResults(results);
        }
        catch (error) {
            this.handleError(error);
        }
        finally {
            this.setSearchButtonLoading(false);
        }
    }
    displayResults(results) {
        this.resultsList.innerHTML = "";
        if (results.length === 0) {
            const li = document.createElement("li");
            li.className = "no-results";
            const icon = document.createElement("i");
            icon.className = "fas fa-exclamation-circle";
            const message = document.createElement("p");
            message.textContent = "No results found";
            li.appendChild(icon);
            li.appendChild(message);
            this.resultsList.appendChild(li);
            return;
        }
        results.forEach((result) => {
            const li = document.createElement("li");
            const icon = document.createElement("i");
            icon.className = "fas fa-file";
            const fileInfo = document.createElement("div");
            fileInfo.className = "file-info";
            const fileName = document.createElement("div");
            fileName.className = "file-name";
            fileName.textContent = result.name;
            const filePath = document.createElement("div");
            filePath.className = "file-path";
            filePath.textContent = result.path;
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(filePath);
            li.appendChild(icon);
            li.appendChild(fileInfo);
            this.resultsList.appendChild(li);
        });
    }
    handleError(error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        this.resultsList.innerHTML = "";
        const li = document.createElement("li");
        li.className = "no-results";
        const icon = document.createElement("i");
        icon.className = "fas fa-exclamation-triangle";
        const message = document.createElement("p");
        message.textContent = `Error: ${errorMessage}`;
        li.appendChild(icon);
        li.appendChild(message);
        this.resultsList.appendChild(li);
        console.error("Search error:", error);
        this.setSearchButtonLoading(false);
    }
    updateProgress(progress) {
        this.progressElement.textContent = `Scanned ${progress.scanned} files, ${progress.matched} matches${progress.total ? ` of ${progress.total}` : ""}`;
    }
    setSearchButtonLoading(loading) {
        this.searchButton.disabled = loading;
        this.searchButton.textContent = loading ? "Searching..." : "Search";
    }
    resetSearchButton() {
        this.setSearchButtonLoading(false);
    }
    destroy() {
        this.abortController?.abort();
        // Add any other cleanup logic here
    }
}
// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new SearchApp();
});
