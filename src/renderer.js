document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const directoryInput = document.getElementById("directory");
  const browseButton = document.getElementById("browse-button");
  const searchTermInput = document.getElementById("search-term");
  const searchButton = document.getElementById("search-button");
  const resultsList = document.getElementById("results-list");
  const resultsCount = document.getElementById("results-count");
  const clearResultsButton = document.getElementById("clear-results");
  const optionCards = document.querySelectorAll(".option-card");
  const fileTypeSelect = document.getElementById("file-type");
  const customFileTypeInput = document.getElementById("custom-file-type");
  const tooltip = document.getElementById("tooltip");
  const container = document.querySelector(".container");

  // State
  let searchType = "file-content";
  let isSearching = false;

  // Add a fallback progress indicator
  let lastProgressUpdate = Date.now();
  let progressInterval;

  loadAppVersion();

  function startProgressFallback() {
    let dots = 0;
    progressInterval = setInterval(() => {
      if (!isSearching) {
        clearInterval(progressInterval);
        return;
      }

      dots = (dots + 1) % 4;
      const progressElement = document.querySelector(".progress-text");
      if (progressElement) {
        // If it's been more than 2 seconds since last real progress update, show fallback
        if (Date.now() - lastProgressUpdate > 2000) {
          progressElement.textContent = `Searching${".".repeat(dots)}`;
        }
      }
    }, 500);
  }

  function stopProgressFallback() {
    clearInterval(progressInterval);
  }

  async function loadAppVersion() {
    try {
      const version = await window.api.getAppVersion();
      const versionElement = document.getElementById("app-version");
      if (versionElement) {
        versionElement.textContent = `v${version}`;
      }
    } catch (error) {
      console.log("Version load failed, using default");
      // Keep the default "v1.0" text
    }
  }

  // Add keyboard shortcuts
  document.addEventListener("keydown", (event) => {
    // Ctrl+O - Open directory
    if (event.ctrlKey && event.key === "o") {
      event.preventDefault();
      browseButton.click();
    }

    // Ctrl+N - New search
    if (event.ctrlKey && event.key === "n") {
      event.preventDefault();
      clearResults();
    }

    // F1 - Documentation
    if (event.key === "F1") {
      event.preventDefault();
      window.open(
        "https://github.com/jhenbertgit/file-search-tool/wiki",
        "_blank"
      );
    }

    // Escape - Stop search
    if (event.key === "Escape" && isSearching) {
      event.preventDefault();
      stopSearch();
    }
  });

  // Add this to support the menu actions with visual feedback
  window.api.onNewSearch(() => {
    // Visual feedback for new search
    container.style.opacity = "0.8";
    container.style.transition = "opacity 150ms ease-in-out";
    setTimeout(() => {
      clearResults();
      container.style.opacity = "1";
    }, 150);
  });

  // FINAL FIX: Directory selection handler
  window.api.onDirectorySelected((...args) => {
    console.log("IPC args received:", args);

    // Extract the directory from the event object if needed
    let directory;

    if (args.length === 1 && args[0] && args[0].sender) {
      // We received the event object directly
      console.error(
        "Received event object directly. This is an IPC configuration issue."
      );

      // Try to get directory from a different approach
      browseButton.click().catch(() => {
        showError("Please use the browse button to select a directory");
      });
      return;
    } else if (args.length === 1 && typeof args[0] === "string") {
      directory = args[0];
    } else if (args.length === 2 && typeof args[1] === "string") {
      directory = args[1];
    } else {
      console.error("Unexpected argument format:", args);
      showError("Please use the browse button to select a directory");
      return;
    }

    directoryInput.value = directory;
    directoryInput.style.backgroundColor = "#e8f5e8";
    setTimeout(() => {
      directoryInput.style.backgroundColor = "";
    }, 1000);
  });

  // Browse button handler
  browseButton.addEventListener("click", async () => {
    if (isSearching) return;

    try {
      const directory = await window.api.openDirectoryDialog();
      console.log("Directory from dialog:", directory, typeof directory);

      if (directory && typeof directory === "string") {
        directoryInput.value = directory;
        // Visual feedback
        directoryInput.style.backgroundColor = "#e8f5e8";
        setTimeout(() => {
          directoryInput.style.backgroundColor = "";
        }, 1000);
      }
    } catch (error) {
      console.error("Error opening directory dialog:", error);
      showError("Failed to open directory dialog");
    }
  });

  // Search button handler
  searchButton.addEventListener("click", () => {
    if (isSearching) {
      stopSearch();
      return;
    }

    const directory = directoryInput.value;
    const searchTerm = searchTermInput.value.trim();
    const fileType = getFileTypeFilter();

    if (!directory) {
      showError("Please select a directory first");
      // Visual feedback for error
      directoryInput.style.backgroundColor = "#ffe6e6";
      setTimeout(() => {
        directoryInput.style.backgroundColor = "";
      }, 1000);
      return;
    }

    if (!searchTerm) {
      showError("Please enter a search term");
      // Visual feedback for error
      searchTermInput.style.backgroundColor = "#ffe6e6";
      setTimeout(() => {
        searchTermInput.style.backgroundColor = "";
      }, 1000);
      return;
    }

    performSearch(directory, searchTerm, searchType, fileType);
  });

  clearResultsButton.addEventListener("click", () => {
    if (isSearching) return;
    clearResults();
  });

  optionCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (isSearching) return;

      optionCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      searchType = card.dataset.type;

      // Visual feedback for option selection
      card.style.transform = "scale(0.98)";
      setTimeout(() => {
        card.style.transform = "scale(1)";
      }, 150);
    });
  });

  // Handle file type filter changes
  fileTypeSelect.addEventListener("change", () => {
    if (isSearching) return;

    if (fileTypeSelect.value === "custom") {
      customFileTypeInput.classList.remove("hidden");
      customFileTypeInput.focus();
    } else {
      customFileTypeInput.classList.add("hidden");
    }
  });

  // Handle Enter key in search term input
  searchTermInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter" && !isSearching) {
      searchButton.click();
    }
  });

  // Set up IPC listeners
  window.api.onSearchResults((results) => {
    stopProgressFallback();
    displayResults(results);
    isSearching = false;
    updateUIState();
  });

  window.api.onSearchError((error) => {
    stopProgressFallback();
    showError(error.message);
    isSearching = false;
    updateUIState();
  });

  window.api.onSearchProgress((...args) => {
    console.log("Progress IPC args:", args);

    // Extract progress data from different possible formats
    let progressData;

    if (args.length === 1 && args[0] && typeof args[0] === "object") {
      if (args[0].sender) {
        // We got the event object instead of progress data
        console.error(
          "IPC error: Received event object instead of progress data"
        );
        progressData = null;
      } else {
        // We got the progress data directly
        progressData = args[0];
      }
    } else if (args.length === 2 && args[1] && typeof args[1] === "object") {
      // We got (event, data) format
      progressData = args[1];
    }

    if (progressData && typeof progressData === "object") {
      console.log("Processing progress data:", progressData);
      lastProgressUpdate = Date.now();
      updateProgress(progressData);
    } else {
      console.log("No valid progress data, using fallback");
      // Fallback to generic message
      const progressElement = document.querySelector(".progress-text");
      if (progressElement) {
        progressElement.textContent = "Searching files...";
      }
    }
  });

  // Tooltip functionality
  document.addEventListener("mousemove", (e) => {
    tooltip.style.left = e.pageX + 10 + "px";
    tooltip.style.top = e.pageY + 10 + "px";
  });

  // Functions
  function getFileTypeFilter() {
    if (fileTypeSelect.value === "custom") {
      return customFileTypeInput.value.trim();
    }
    return fileTypeSelect.value;
  }

  function performSearch(directory, searchTerm, searchType, fileType) {
    isSearching = true;
    updateUIState();
    startProgressFallback();

    // Show searching state with initial progress
    resultsList.innerHTML = `
      <li class="searching">
        <div class="spinner"></div>
        <p>Searching for "${searchTerm}"${fileType ? ` in ${fileType} files` : ""}...</p>
        <div class="progress-text">Initializing search...</div>
      </li>
    `;

    // Visual feedback for search start
    searchButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      searchButton.style.transform = "scale(1)";
    }, 150);

    window.api.searchFiles({ directory, searchTerm, searchType, fileType });
  }

  function stopSearch() {
    window.api.stopSearch();
    isSearching = false;
    updateUIState();
    stopProgressFallback();

    resultsList.innerHTML = `
      <li class="no-results">
        <i class="fas fa-stop-circle"></i>
        <p>Search stopped</p>
      </li>
    `;

    // Visual feedback for stop search
    searchButton.style.backgroundColor = "#6c757d";
    setTimeout(() => {
      searchButton.style.backgroundColor = "";
    }, 300);
  }

  // Robust progress update function
  function updateProgress(progressData) {
    const progressElement = document.querySelector(".progress-text");
    if (!progressElement) return;

    // Handle cases where progressData might be malformed
    if (
      !progressData ||
      typeof progressData !== "object" ||
      progressData.sender
    ) {
      progressElement.textContent = "Searching files...";
      return;
    }

    // Extract values with safe defaults
    const scanned =
      typeof progressData.scanned === "number" ? progressData.scanned : 0;
    const matched =
      typeof progressData.matched === "number" ? progressData.matched : 0;
    const total =
      typeof progressData.total === "number" ? progressData.total : 0;

    // Calculate percentage
    let percentage = 0;
    if (typeof progressData.percentage === "number") {
      percentage = progressData.percentage;
    } else if (total > 0) {
      percentage = Math.round((scanned / total) * 100);
    }

    progressElement.textContent = `Scanned ${scanned} files, ${matched} matches${total > 0 ? ` (${percentage}%)` : ""}`;
  }

  function displayResults(results) {
    if (results.length === 0) {
      resultsList.innerHTML = `
        <li class="no-results">
          <i class="fas fa-exclamation-circle"></i>
          <p>No results found for "${searchTermInput.value}"</p>
        </li>
      `;
      resultsCount.textContent = "(0 found)";
      return;
    }

    resultsCount.textContent = `(${results.length} found)`;

    resultsList.innerHTML = "";
    results.forEach((result, index) => {
      const li = document.createElement("li");

      // Format file size
      const size = formatFileSize(result.size);

      // Format modified date
      const modified = new Date(result.modified).toLocaleString();

      // Get file icon based on extension
      const fileIcon = getFileIcon(result.name);

      li.innerHTML = `
        <i class="${fileIcon}"></i>
        <div class="file-info">
          <div class="file-name">${result.name}</div>
          <div class="file-path">${result.path}</div>
          <div class="file-details">
            <span class="file-size">${size}</span> • 
            <span class="file-modified">Modified: ${modified}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="file-action-btn open-location" title="Open file location" data-index="${index}">
            <i class="fas fa-folder-open"></i>
          </button>
        </div>
      `;

      // Add double click to open file
      li.addEventListener("dblclick", () => {
        window.api.openFile(result.path);
      });

      // Add hover tooltip
      li.addEventListener("mouseenter", (e) => {
        tooltip.textContent = "Double click to open file";
        tooltip.style.opacity = "1";
      });

      li.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
      });

      // Add click handler for open location button
      const openLocationBtn = li.querySelector(".open-location");
      openLocationBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the double click
        window.api.openFileLocation(result.path);
      });

      resultsList.appendChild(li);
    });
  }

  function showError(message) {
    resultsList.innerHTML = `
      <li class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
      </li>
    `;
    resultsCount.textContent = "(Error)";

    // Visual feedback for error
    container.style.backgroundColor = "#fff5f5";
    setTimeout(() => {
      container.style.backgroundColor = "";
    }, 1000);
  }

  function clearResults() {
    resultsList.innerHTML = `
      <li class="no-results">
        <i class="fas fa-search"></i>
        <p>Your search results will appear here</p>
      </li>
    `;
    resultsCount.textContent = "(0 found)";
    searchTermInput.value = "";
    directoryInput.value = "";

    if (isSearching) {
      stopSearch();
    }

    // Visual feedback for clear
    clearResultsButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      clearResultsButton.style.transform = "scale(1)";
    }, 150);
  }

  function updateUIState() {
    // Update search button
    if (isSearching) {
      searchButton.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Search';
      searchButton.classList.add("searching");
    } else {
      searchButton.innerHTML = '<i class="fas fa-search"></i> Search';
      searchButton.classList.remove("searching");
    }

    // Disable/enable controls
    const controls = [
      browseButton,
      searchTermInput,
      fileTypeSelect,
      customFileTypeInput,
      clearResultsButton,
    ];

    controls.forEach((control) => {
      control.disabled = isSearching;
    });

    optionCards.forEach((card) => {
      if (isSearching) {
        card.style.pointerEvents = "none";
        card.style.opacity = "0.7";
      } else {
        card.style.pointerEvents = "auto";
        card.style.opacity = "1";
      }
    });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileIcon(filename) {
    const extension = filename.split(".").pop().toLowerCase();
    const iconMap = {
      pdf: "fas fa-file-pdf",
      doc: "fas fa-file-word",
      docx: "fas fa-file-word",
      xls: "fas fa-file-excel",
      xlsx: "fas fa-file-excel",
      ppt: "fas fa-file-powerpoint",
      pptx: "fas fa-file-powerpoint",
      txt: "fas fa-file-alt",
      zip: "fas fa-file-archive",
      rar: "fas fa-file-archive",
      jpg: "fas fa-file-image",
      jpeg: "fas fa-file-image",
      png: "fas fa-file-image",
      gif: "fas fa-file-image",
      mp3: "fas fa-file-audio",
      wav: "fas fa-file-audio",
      mp4: "fas fa-file-video",
      avi: "fas fa-file-video",
      mov: "fas fa-file-video",
      js: "fas fa-file-code",
      html: "fas fa-file-code",
      css: "fas fa-file-code",
      py: "fas fa-file-code",
      json: "fas fa-file-code",
    };

    return iconMap[extension] || "fas fa-file";
  }

  // Clean up listeners when page is unloaded
  window.addEventListener("beforeunload", () => {
    window.api.removeAllListeners("search-results");
    window.api.removeAllListeners("search-error");
    window.api.removeAllListeners("search-progress");
    window.api.removeAllListeners("new-search");
    window.api.removeAllListeners("directory-selected");

    if (isSearching) {
      window.api.stopSearch();
    }
  });

  // Initialize UI state
  updateUIState();
});
