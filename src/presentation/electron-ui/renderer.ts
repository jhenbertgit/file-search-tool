import { container } from "../../infrastructure/di/container";
import { TYPES } from "../../infrastructure/di/types";
import {
  FileSearchService,
  SearchOptions,
} from "../../core/domain/services/file-search-service";
import { SearchResult } from "../../core/domain/entities/search-results";

declare global {
  interface Window {
    electronAPI: {
      onSearchProgress: (callback: (progress: SearchProgress) => void) => void;
      onSearchResults: (callback: (results: SearchResult[]) => void) => void;
    };
  }
}

interface SearchProgress {
  scanned: number;
  matched: number;
  total?: number;
}

class SearchApp {
  private fileSearchService: FileSearchService;
  private searchButton!: HTMLButtonElement;
  private resultsList!: HTMLUListElement;
  private directoryInput!: HTMLInputElement;
  private searchTermInput!: HTMLInputElement;
  private searchTypeSelect!: HTMLSelectElement;
  private fileTypesInput!: HTMLInputElement;
  private progressElement!: HTMLElement;
  private abortController?: AbortController;

  constructor() {
    this.fileSearchService = container.get<FileSearchService>(
      TYPES.FileSearchService
    );
    this.initializeUI();
    this.setupEventListeners();
    this.setupIpcListeners();
  }

  private setupIpcListeners(): void {
    if (window.electronAPI) {
      try {
        window.electronAPI.onSearchProgress((progress: SearchProgress) => {
          this.updateProgress(progress);
        });

        window.electronAPI.onSearchResults((results: SearchResult[]) => {
          this.displayResults(results);
          this.resetSearchButton();
        });
      } catch (error) {
        console.error("IPC listener setup failed:", error);
        this.handleError(error);
      }
    } else {
      console.warn("electronAPI not available");
    }
  }

  private initializeUI(): void {
    const getElement = <T extends HTMLElement>(id: string): T => {
      const element = document.getElementById(id);
      if (!element) {
        throw new Error(`Element with id "${id}" not found`);
      }
      return element as T;
    };

    this.searchButton = getElement<HTMLButtonElement>("search-button");
    this.resultsList = getElement<HTMLUListElement>("results-list");
    this.directoryInput = getElement<HTMLInputElement>("directory");
    this.searchTermInput = getElement<HTMLInputElement>("search-term");
    this.searchTypeSelect = getElement<HTMLSelectElement>("search-type");
    this.fileTypesInput = getElement<HTMLInputElement>("file-types");
    this.progressElement = getElement<HTMLElement>("progress-text");
  }

  private setupEventListeners(): void {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.searchButton.addEventListener("click", () => this.handleSearch(), {
      signal,
    });

    this.fileSearchService.onProgress((progress: SearchProgress) => {
      this.updateProgress(progress);
    });
  }

  private async handleSearch(): Promise<void> {
    if (this.searchButton.disabled) return;

    this.setSearchButtonLoading(true);
    this.resultsList.innerHTML = "";

    const options: SearchOptions = {
      directory: this.directoryInput.value.trim(),
      searchTerm: this.searchTermInput.value.trim(),
      searchType: this.searchTypeSelect.value as "file-content" | "file-name",
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
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setSearchButtonLoading(false);
    }
  }

  private displayResults(results: SearchResult[]): void {
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

  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

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

  private updateProgress(progress: SearchProgress): void {
    this.progressElement.textContent = `Scanned ${progress.scanned} files, ${progress.matched} matches${
      progress.total ? ` of ${progress.total}` : ""
    }`;
  }

  private setSearchButtonLoading(loading: boolean): void {
    this.searchButton.disabled = loading;
    this.searchButton.textContent = loading ? "Searching..." : "Search";
  }

  private resetSearchButton(): void {
    this.setSearchButtonLoading(false);
  }

  public destroy(): void {
    this.abortController?.abort();
    // Add any other cleanup logic here
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SearchApp();
});
