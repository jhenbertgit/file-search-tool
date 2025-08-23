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

  // State
  let searchType = "file-content";
  let isSearching = false;

  // Event Listeners
  browseButton.addEventListener("click", async () => {
    if (isSearching) return;

    const directory = await window.api.openDirectoryDialog();
    if (directory) {
      directoryInput.value = directory;
    }
  });

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
      return;
    }

    if (!searchTerm) {
      showError("Please enter a search term");
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
    displayResults(results);
    isSearching = false;
    updateUIState();
  });

  window.api.onSearchError((error) => {
    showError(error.message);
    isSearching = false;
    updateUIState();
  });

  window.api.onSearchProgress((progress) => {
    updateProgress(progress);
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

    // Show searching state
    resultsList.innerHTML = `
          <li class="searching">
              <div class="spinner"></div>
              <p>Searching for "${searchTerm}"${fileType ? ` in ${fileType} files` : ""}...</p>
              <div class="progress-text">Preparing search...</div>
          </li>
      `;

    window.api.searchFiles({ directory, searchTerm, searchType, fileType });
  }

  function stopSearch() {
    window.api.stopSearch();
    isSearching = false;
    updateUIState();

    resultsList.innerHTML = `
          <li class="no-results">
              <i class="fas fa-stop-circle"></i>
              <p>Search stopped</p>
          </li>
      `;
  }

  function updateProgress(progress) {
    const progressElement = document.querySelector(".progress-text");
    if (progressElement) {
      progressElement.textContent = `Scanned ${progress.scanned} files, ${progress.matched} matches`;
    }
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
  }

  function clearResults() {
    resultsList.innerHTML = `
          <li class="no-results">
              <i class="fas fa-search"></i>
              <p>Your search results will appear here</p>
          </li>
      `;
    resultsCount.textContent = "(0 found)";
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

    if (isSearching) {
      window.api.stopSearch();
    }
  });

  // Initialize UI state
  updateUIState();
});
