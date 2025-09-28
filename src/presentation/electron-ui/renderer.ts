// Type definitions (copied from domain entities to avoid imports)
interface SearchResult {
  name: string;
  path: string;
  size: number;
  modified: Date;
  extension: string;
  contentPreview?: string;
}

interface SearchProgress {
  scanned: number;
  total?: number;
  matched: number;
  percentage?: number;
  currentFile?: string;
  isComplete: boolean;
}

interface SearchOptions {
  directory: string;
  searchTerm: string;
  searchType: "file-name" | "file-content";
  fileTypes?: string[];
  maxFileSize?: number;
}

// Extend Window interface for getElectronAPI()
interface ElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  searchFiles: (
    options: SearchOptions
  ) => Promise<{ success: boolean; data?: SearchResult[]; error?: string }>;
  stopSearch: () => void;
  getSearchHistory: () => Promise<SearchOptions[]>;
  addToSearchHistory: (search: SearchOptions) => Promise<void>;
  onSearchProgress: (callback: (progress: SearchProgress) => void) => void;
  removeAllListeners: (channel: string) => void;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  revealFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

// Helper function to access electronAPI with proper typing
function getElectronAPI(): ElectronAPI {
  return (window as any).electronAPI as ElectronAPI;
}

interface UIElements {
  searchButton: HTMLButtonElement;
  stopButton: HTMLButtonElement;
  directoryButton: HTMLButtonElement;
  resultsList: HTMLUListElement;
  directoryInput: HTMLInputElement;
  searchTermInput: HTMLInputElement;
  searchTypeSelect: HTMLSelectElement;
  fileTypesInput: HTMLInputElement;
  progressElement: HTMLElement;
  searchHistoryList: HTMLDataListElement;
  progressContainer: HTMLElement;
  progressFill: HTMLElement;
  resultsCount: HTMLElement;
  clearResultsButton: HTMLElement;
  loadingOverlay: HTMLElement;
  loadingText: HTMLElement;
}

class SearchApp {
  private ui!: UIElements;
  private isSearching: boolean = false;
  private searchAbortController: AbortController | null = null;
  private resultItems: SearchResult[] = [];

  constructor() {
    this.initializeUI();
    this.setupEventListeners();
    this.setupIpcListeners();
    this.loadSearchHistory();
  }

  private setupIpcListeners(): void {
    console.log("setupIpcListeners called");
    console.log("window object:", window);
    console.log("window.electronAPI:", (window as any).electronAPI);
    console.log("getElectronAPI():", getElectronAPI());

    if (getElectronAPI()) {
      getElectronAPI().onSearchProgress((progress: SearchProgress) => {
        this.updateProgress(progress);
        if (progress.isComplete) {
          this.setSearchButtonLoading(false);
        }
      });
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

    this.ui = {
      searchButton: getElement<HTMLButtonElement>("search-button"),
      stopButton: getElement<HTMLButtonElement>("stop-button"),
      directoryButton: getElement<HTMLButtonElement>("directory-button"),
      resultsList: getElement<HTMLUListElement>("results-list"),
      directoryInput: getElement<HTMLInputElement>("directory"),
      searchTermInput: getElement<HTMLInputElement>("search-term"),
      searchTypeSelect: getElement<HTMLSelectElement>("search-type"),
      fileTypesInput: getElement<HTMLInputElement>("file-types"),
      progressElement: getElement<HTMLElement>("progress-text"),
      searchHistoryList: getElement<HTMLDataListElement>("search-history"),
      progressContainer: getElement<HTMLElement>("progress-container"),
      progressFill: getElement<HTMLElement>("progress-fill"),
      resultsCount: getElement<HTMLElement>("results-count"),
      clearResultsButton: getElement<HTMLElement>("clear-results"),
      loadingOverlay: getElement<HTMLElement>("loading-overlay"),
      loadingText: getElement<HTMLElement>("loading-text"),
    };

    // Add performance classes to interactive elements
    this.ui.searchButton.classList.add("perf-button");
    this.ui.stopButton.classList.add("perf-button");
    this.ui.directoryButton.classList.add("perf-button");
    this.ui.directoryInput.classList.add("perf-input");
    this.ui.searchTermInput.classList.add("perf-input");
    this.ui.resultsList.classList.add("virtual-scroll");
  }

  private setupEventListeners(): void {
    // Search controls
    this.ui.searchButton.addEventListener("click", () => this.handleSearch());
    this.ui.stopButton.addEventListener("click", () => this.handleStopSearch());
    this.ui.directoryButton.addEventListener("click", () =>
      this.handleDirectoryDialog()
    );

    // Input interactions
    this.ui.searchTermInput.addEventListener("change", (event) =>
      this.handleHistorySelection(event)
    );
    this.ui.searchTermInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !this.isSearching) {
        this.handleSearch();
      }
    });

    // Results management
    this.ui.clearResultsButton.addEventListener("click", () =>
      this.clearResults()
    );

    // Loading overlay click-to-cancel
    this.ui.loadingOverlay.addEventListener("click", (event) => {
      if (event.target === this.ui.loadingOverlay) {
        this.handleStopSearch();
      }
    });

    // Form validation
    this.ui.directoryInput.addEventListener("input", () => this.validateForm());
    this.ui.searchTermInput.addEventListener("input", () =>
      this.validateForm()
    );
  }

  private async handleDirectoryDialog(): Promise<void> {
    console.log("handleDirectoryDialog called");
    console.log("window.electronAPI available:", !!(window as any).electronAPI);
    console.log("getElectronAPI() available:", !!getElectronAPI());

    try {
      const electronAPI = getElectronAPI();
      if (!electronAPI) {
        console.error("electronAPI is not available");
        return;
      }

      console.log("Calling openDirectoryDialog...");
      const path = await electronAPI.openDirectoryDialog();
      console.log("Directory path received:", path);
      if (path) {
        this.ui.directoryInput.value = path;
        this.validateForm();
      }
    } catch (error) {
      console.error("Error in handleDirectoryDialog:", error);
    }
  }

  private validateForm(): void {
    const hasDirectory = this.ui.directoryInput.value.trim().length > 0;
    const hasSearchTerm = this.ui.searchTermInput.value.trim().length > 0;
    const isValid = hasDirectory && hasSearchTerm && !this.isSearching;

    this.ui.searchButton.disabled = !isValid;

    // Update visual state
    if (isValid) {
      this.ui.searchButton.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      this.ui.searchButton.classList.add("opacity-50", "cursor-not-allowed");
    }
  }

  private clearResults(): void {
    this.resultItems = [];
    this.updateResultsDisplay();
    this.ui.clearResultsButton.classList.add("hidden");
    this.ui.resultsCount.textContent = "";
  }

  private async handleSearch(): Promise<void> {
    if (this.ui.searchButton.disabled || this.isSearching) return;

    this.isSearching = true;
    this.searchAbortController = new AbortController();

    // Show loading overlay
    this.ui.loadingOverlay.classList.remove("hidden");
    this.ui.loadingText.textContent = "Initializing search...";

    // Update UI state
    this.setSearchButtonLoading(true);
    this.clearResults();
    this.ui.progressContainer.classList.remove("hidden");
    this.ui.progressElement.textContent = "Starting search...";

    const options: SearchOptions = {
      directory: this.ui.directoryInput.value.trim(),
      searchTerm: this.ui.searchTermInput.value.trim(),
      searchType: this.ui.searchTypeSelect.value as
        | "file-content"
        | "file-name",
      fileTypes: this.ui.fileTypesInput.value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };

    try {
      await getElectronAPI().addToSearchHistory(options);
      this.loadSearchHistory();

      const result = await getElectronAPI().searchFiles(options);
      if (result.success && result.data) {
        this.resultItems = result.data;
        this.displayResults(result.data);
        this.ui.loadingText.textContent = `Found ${result.data.length} results`;
      } else {
        this.handleError(new Error(result.error ?? "Unknown search error"));
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setSearchButtonLoading(false);
      this.isSearching = false;
      this.searchAbortController = null;

      // Hide loading overlay after a brief delay
      setTimeout(() => {
        this.ui.loadingOverlay.classList.add("hidden");
      }, 500);
    }
  }

  private handleStopSearch(): void {
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    getElectronAPI().stopSearch();
    this.setSearchButtonLoading(false);
    this.ui.progressElement.textContent = "Search stopped.";
    this.ui.loadingOverlay.classList.add("hidden");
    this.isSearching = false;
  }

  private async loadSearchHistory(): Promise<void> {
    try {
      const history = await getElectronAPI().getSearchHistory();
      this.ui.searchHistoryList.innerHTML = "";
      history.forEach((search) => {
        const option = document.createElement("option");
        option.value = search.searchTerm;
        option.dataset.directory = search.directory;
        option.dataset.searchType = search.searchType;
        this.ui.searchHistoryList.appendChild(option);
      });
    } catch (error) {
      console.warn("Failed to load search history:", error);
      // Continue without history - not critical for functionality
    }
  }

  private handleHistorySelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedOption = Array.from(this.ui.searchHistoryList.options).find(
      (o) => o.value === input.value
    );

    if (selectedOption && selectedOption.dataset.directory) {
      this.ui.directoryInput.value = selectedOption.dataset.directory;
      this.ui.searchTypeSelect.value =
        selectedOption.dataset.searchType || "file-content";
      this.validateForm();
    }
  }

  private displayResults(_results: SearchResult[]): void {
    this.updateResultsDisplay();
  }

  private updateResultsDisplay(): void {
    this.ui.resultsList.innerHTML = "";

    if (this.resultItems.length === 0) {
      this.showEmptyState();
      return;
    }

    // Update results counter
    this.ui.resultsCount.textContent = `${this.resultItems.length} result${this.resultItems.length !== 1 ? "s" : ""}`;
    this.ui.clearResultsButton.classList.remove("hidden");

    // Use virtual scrolling for performance with large result sets
    this.renderResultItems(this.resultItems);
  }

  private showEmptyState(): void {
    const li = document.createElement("li");
    li.className =
      "flex flex-col items-center justify-center h-full text-center py-16 px-8";

    const iconContainer = document.createElement("div");
    iconContainer.className = "bg-gray-100 rounded-full p-6 mb-4";

    const icon = document.createElement("i");
    icon.className = "fas fa-exclamation-circle text-3xl text-gray-400";
    iconContainer.appendChild(icon);

    const title = document.createElement("h3");
    title.className = "text-lg font-medium text-gray-600 mb-2";
    title.textContent = "No Results Found";

    const message = document.createElement("p");
    message.className = "text-gray-500 max-w-md";
    message.textContent =
      "Try adjusting your search term or selecting a different directory.";

    li.appendChild(iconContainer);
    li.appendChild(title);
    li.appendChild(message);
    this.ui.resultsList.appendChild(li);
  }

  private renderResultItems(results: SearchResult[]): void {
    const fragment = document.createDocumentFragment();

    results.forEach((result, index) => {
      const li = document.createElement("li");
      li.className = "result-item result-item-responsive animate-fade-in";
      li.style.animationDelay = `${index * 0.05}s`;

      // File type icon
      const icon = document.createElement("i");
      icon.className = this.getFileIcon(result.name);
      icon.classList.add("text-lg", "text-gray-500", "flex-shrink-0");

      // File info container
      const fileInfo = document.createElement("div");
      fileInfo.className = "flex-1 min-w-0";

      const fileName = document.createElement("div");
      fileName.className = "font-semibold text-gray-800 truncate";
      fileName.textContent = result.name;
      fileName.title = result.name;

      const filePath = document.createElement("div");
      filePath.className = "text-sm text-gray-500 truncate mt-1";
      filePath.textContent = result.path;
      filePath.title = result.path;

      fileInfo.appendChild(fileName);
      fileInfo.appendChild(filePath);

      // Action buttons
      const actions = document.createElement("div");
      actions.className = "flex gap-2 ml-4";

      const openButton = document.createElement("button");
      openButton.className =
        "p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors";
      openButton.title = "Open file";
      openButton.innerHTML = '<i class="fas fa-external-link-alt"></i>';
      openButton.addEventListener("click", () => this.openFile(result.path));

      const revealButton = document.createElement("button");
      revealButton.className =
        "p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors";
      revealButton.title = "Show in folder";
      revealButton.innerHTML = '<i class="fas fa-folder-open"></i>';
      revealButton.addEventListener("click", () =>
        this.revealFile(result.path)
      );

      actions.appendChild(openButton);
      actions.appendChild(revealButton);

      li.appendChild(icon);
      li.appendChild(fileInfo);
      li.appendChild(actions);

      fragment.appendChild(li);
    });

    this.ui.resultsList.appendChild(fragment);
  }

  private getFileIcon(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const iconMap: Record<string, string> = {
      pdf: "fas fa-file-pdf text-red-500",
      doc: "fas fa-file-word text-blue-500",
      docx: "fas fa-file-word text-blue-500",
      xls: "fas fa-file-excel text-green-500",
      xlsx: "fas fa-file-excel text-green-500",
      ppt: "fas fa-file-powerpoint text-orange-500",
      pptx: "fas fa-file-powerpoint text-orange-500",
      txt: "fas fa-file-alt text-gray-500",
      md: "fas fa-file-alt text-gray-600",
      js: "fas fa-file-code text-yellow-500",
      ts: "fas fa-file-code text-blue-600",
      html: "fas fa-file-code text-orange-600",
      css: "fas fa-file-code text-blue-500",
      json: "fas fa-file-code text-green-600",
      png: "fas fa-file-image text-purple-500",
      jpg: "fas fa-file-image text-purple-500",
      jpeg: "fas fa-file-image text-purple-500",
      gif: "fas fa-file-image text-purple-500",
      zip: "fas fa-file-archive text-gray-600",
      rar: "fas fa-file-archive text-gray-600",
    };

    return iconMap[extension || ""] || "fas fa-file text-gray-500";
  }

  private async openFile(filePath: string): Promise<void> {
    try {
      const result = await getElectronAPI().openFile(filePath);
      if (!result.success) {
        console.error("Failed to open file:", result.error);
        // Could show a user-friendly error message here
      }
    } catch (error) {
      console.error("Error opening file:", error);
    }
  }

  private async revealFile(filePath: string): Promise<void> {
    try {
      const result = await getElectronAPI().revealFile(filePath);
      if (!result.success) {
        console.error("Failed to reveal file:", result.error);
        // Could show a user-friendly error message here
      }
    } catch (error) {
      console.error("Error revealing file:", error);
    }
  }

  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    this.ui.resultsList.innerHTML = "";
    const li = document.createElement("li");
    li.className =
      "flex flex-col items-center justify-center h-full text-center py-16 px-8";

    const iconContainer = document.createElement("div");
    iconContainer.className = "bg-red-100 rounded-full p-6 mb-4";

    const icon = document.createElement("i");
    icon.className = "fas fa-exclamation-triangle text-3xl text-red-500";
    iconContainer.appendChild(icon);

    const title = document.createElement("h3");
    title.className = "text-lg font-medium text-gray-800 mb-2";
    title.textContent = "Search Error";

    const message = document.createElement("p");
    message.className = "text-gray-600 max-w-md";
    message.textContent = errorMessage;

    li.appendChild(iconContainer);
    li.appendChild(title);
    li.appendChild(message);
    this.ui.resultsList.appendChild(li);

    console.error("Search error:", error);
    this.setSearchButtonLoading(false);
  }

  private updateProgress(progress: SearchProgress): void {
    let progressText = `Scanned ${progress.scanned} files, ${progress.matched} matches`;
    if (progress.isComplete) {
      progressText += " (Search complete)";
      this.ui.progressContainer.classList.add("hidden");
    }

    this.ui.progressElement.textContent = progressText;
    this.ui.loadingText.textContent = progressText;

    // Update progress bar if we have total files info
    if (progress.scanned > 0) {
      const progressPercent = progress.isComplete
        ? 100
        : Math.min(95, (progress.scanned / (progress.scanned + 100)) * 100);
      this.ui.progressFill.style.width = `${progressPercent}%`;
    }
  }

  private setSearchButtonLoading(loading: boolean): void {
    this.ui.searchButton.disabled = loading;
    this.ui.stopButton.classList.toggle("hidden", !loading);

    if (loading) {
      this.ui.searchButton.innerHTML =
        '<i class="fas fa-spinner animate-spin"></i><span>Searching...</span>';
      this.ui.searchButton.classList.add("opacity-75");
    } else {
      this.ui.searchButton.innerHTML =
        '<i class="fas fa-search"></i><span>Search</span>';
      this.ui.searchButton.classList.remove("opacity-75");
    }

    this.validateForm();
  }

  public destroy(): void {
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    getElectronAPI().removeAllListeners("search-progress");
  }
}

// Wait for both DOM and electronAPI to be ready
function initializeApp() {
  console.log("Initializing app...");
  console.log("DOM ready:", document.readyState);
  console.log("electronAPI available:", !!(window as any).electronAPI);

  if ((window as any).electronAPI) {
    console.log("electronAPI is available, creating SearchApp");
    new SearchApp();
  } else {
    console.log("electronAPI not available yet, waiting...");
    // Wait a bit and try again
    setTimeout(initializeApp, 100);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
