name: "Feature: Search History"
description: |
  This PRP outlines the implementation of a search history feature, allowing users to quickly access and re-run their previous searches.

## Purpose

To enhance user experience by providing a persistent search history, saving users time and effort on recurring searches and making the File Search Tool more efficient.

## Core Principles

1.  **Context is King**: All necessary context from AGENTS.md and README.md is considered.
2.  **Validation Loops**: The implementation will be validated through linting and manual end-to-end testing.
3.  **Information Dense**: Uses terminology and patterns from the existing Electron/TypeScript codebase.
4.  **Progressive Success**: The implementation is broken down into clear, sequential tasks.
5.  **Global rules**: Follows the established architecture (Main/Renderer process separation).

---

## Goal

Implement a persistent search history feature that saves the last 10 unique searches. Users should be able to view this history and click an entry to re-run that search.

## Why

-   **Business value**: Increases user retention and satisfaction by making the application more convenient and powerful.
-   **User impact**: Eliminates the need to re-enter common search parameters (directory, term, type), streamlining the user's workflow.
-   **Integration**: Complements the core search functionality naturally.

## What

A new UI element will display a list of recent searches. Clicking an item in this list will populate the search form with the parameters from the selected history item and automatically initiate the search. The history must persist even after the application is closed and reopened.

### Success Criteria

-   [ ] A search is automatically saved to history upon execution.
-   [ ] The history is limited to the 10 most recent unique searches.
-   [ ] The history is displayed in the UI (e.g., a dropdown list near the search bar).
-   [ ] Clicking a history item repopulates the search directory, search term, and search type fields.
-   [ ] Clicking a history item automatically triggers a new search.
-   [ ] The search history is saved to disk and reloaded when the app restarts.

## All Needed Context

### Documentation & References

```yaml
# MUST READ - These files provide the complete context for the existing application architecture and functionality.
- docfile: AGENTS.md
  why: Explains the Clean Architecture, DI container, and the core application flow between the main and renderer processes. Critical for understanding where to add new logic.

- docfile: README.md
  why: Provides a high-level overview of the project, features, and key dependencies. Useful for understanding the user-facing aspects.

- doc: https://www.electronjs.org/docs/latest/api/ipc-main
  why: Essential for understanding how to add new communication channels between the main process (where history will be stored) and the renderer process (the UI).

- doc: https://github.com/sindresorhus/electron-store
  why: This library is recommended for simple, persistent data storage in Electron apps. It handles saving data to a JSON file automatically.
```

### Current Codebase tree

```bash
D:\projects\file-search\
├───.eslintrc.js
├───.gitignore
├───AGENTS.md
├───forge.config.js
├───jest.config.js
├───LICENSE
├───package-lock.json
├───package.json
├───README.md
├───screenshot.png
├───tsconfig.json
├───src\
│   ├───index.css
│   ├───index.html
│   ├───core\
│   │   └───domain\
│   │       └───services\
│   │           └───file-search-service.ts
│   ├───infrastructure\
│   │   ├───electron\
│   │   │   ├───main-process.ts
│   │   │   ├───preload.ts
│   │   │   └───services\
│   │   │       └───electron-file-search-service.ts
│   └───presentation\
│       └───electron-ui\
│           └───renderer.ts
```

### Desired Codebase tree with files to be added and responsibility of file

No new files are required. The logic will be added to existing files to maintain the current structure.

### Known Gotchas of our codebase & Library Quirks

-   **CRITICAL**: The Electron main process and renderer process are isolated. All communication must happen via IPC channels defined in `main-process.ts` and exposed via `preload.ts`.
-   **CRITICAL**: State that needs to persist (like search history) should be managed in the main process. The renderer process should only read and display this state. `electron-store` should be used exclusively in the main process.

## Implementation Blueprint

### Data models and structure

A simple, consistent structure for history entries is required.

```typescript
// To be used implicitly in main-process.ts and renderer.ts
interface SearchHistoryEntry {
  directory: string;
  searchTerm: string;
  searchType: 'name' | 'content';
  timestamp: number;
}
```

### list of tasks to be completed to fullfill the PRP in the order they should be completed

```yaml
Task 1:
INSTALL dependency `electron-store` for data persistence.

Task 2:
MODIFY src/infrastructure/electron/main-process.ts:
  - IMPORT and initialize `electron-store`.
  - CREATE a new IPC handler `ipcMain.handle('get-search-history', ...)` to read and return the stored history.
  - CREATE a new IPC handler `ipcMain.handle('add-to-search-history', ...)` to add a new entry, ensuring no duplicates and capping the list at 10.
  - MODIFY the existing `ipcMain.handle('search-files', ...)` to call the `add-to-search-history` logic each time a search is performed.

Task 3:
MODIFY src/infrastructure/electron/preload.ts:
  - EXPOSE the new IPC channels ('get-search-history', 'add-to-search-history') to the renderer process via the `contextBridge`.

Task 4:
MODIFY src/presentation/electron-ui/index.html:
  - ADD a new UI element, such as a `<datalist>` or a `<div>` that will be populated with history items, positioned near the main search input.

Task 5:
MODIFY src/presentation/electron-ui/renderer.ts:
  - CREATE a function `loadSearchHistory()` that calls `window.electron.getSearchHistory()` and populates the UI element from Task 4.
  - CALL `loadSearchHistory()` when the DOM is fully loaded.
  - ADD event listeners to the history items. When an item is clicked, it should populate the search input fields and trigger the search function.
  - UPDATE the main search function to call `window.electron.addSearchHistory()` after a search is initiated, and then reload the history display.
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run this to check for linting errors.
npm run lint

# Expected: No errors. If errors, read the error and fix.
```

### Level 2: Manual End-to-End Test

Since this feature is heavily reliant on UI interaction and data persistence across app sessions, a manual test is the most effective validation method.

```bash
# 1. Start the application
npm start

# 2. Perform a search
#    - Select a directory (e.g., C:\Users\Test)
#    - Enter a search term (e.g., "report.docx")
#    - Select a search type (e.g., "File Name")
#    - Click "Search"

# 3. Verify history is updated
#    - Check that the search term now appears in the history UI element.

# 4. Perform a second, different search to ensure the list grows.

# 5. Test persistence
#    - Close the application completely.
#    - Re-run `npm start`.
#    - Expected: The search history UI should show the searches from the previous session.

# 6. Test re-running a search
#    - Click on the first search item in the history list.
#    - Expected: The search form fields are automatically filled with "C:\Users\Test", "report.docx", and "File Name", and the search executes immediately.
```

## Final validation Checklist

-   [ ] `npm run lint` passes with no errors.
-   [ ] Manual test: A new search is successfully added to the history UI.
-   [ ] Manual test: The history persists after closing and restarting the application.
-   [ ] Manual test: Clicking a history item correctly populates the form and re-runs the search.
-   [ ] Manual test: The history is correctly limited to 10 unique entries.

---

## Anti-Patterns to Avoid

-   ❌ Don't manage state directly in the renderer process. Use the main process as the source of truth.
-   ❌ Don't use `localStorage` in the renderer. Use `electron-store` in the main process for reliable persistence.
-   ❌ Don't block the main process. All file system and storage operations should be asynchronous.
-   ❌ Don't forget to expose new IPC channels in `preload.ts`. If you don't, the renderer will not be able to communicate with the main process.
