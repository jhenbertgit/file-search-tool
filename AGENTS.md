# Project Documentation for AI Agents

This document provides a comprehensive overview of the File Search Tool project for AI agents to understand its structure, functionality, and how to contribute to its development.

## Project Overview

The File Search Tool is a desktop application built with Electron that allows users to search for files and folders on their local machine.

## Project Structure

```
.
├── .eslintrc.js
├── .gitignore
├── forge.config.js
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── screenshot.png
├── .github
│   └── workflows
│       └── publish.yml
├── assets
│   ├── icon.ico
│   └── installer.gif
├── config
├── src
│   ├── index.css
│   ├── index.html
│   ├── index.js
│   ├── preload.js
│   └── renderer.js
```

### Key Files and Directories

- **`package.json`**: Defines project metadata, dependencies, and scripts.
- **`forge.config.js`**: Configuration for Electron Forge, used for building and packaging the application.
- **`src/`**: Contains the application's source code.
  - **`index.js`**: The main entry point for the Electron application (main process).
  - **`index.html`**: The main HTML file for the user interface.
  - **`renderer.js`**: The JavaScript code for the user interface (renderer process).
  - **`preload.js`**: A script that runs before the renderer process, used to expose Node.js APIs to the UI in a secure manner.
  - **`index.css`**: The stylesheet for the user interface.
- **`.github/workflows/publish.yml`**: GitHub Actions workflow for publishing the application.

## File-by-File Breakdown

### `package.json`

- **Name**: `file-search-tool`
- **Version**: `1.0.0`
- **Description**: A simple file search tool.
- **Main Process**: `src/index.js`
- **Scripts**:
  - `start`: Starts the application in development mode.
  - `package`: Packages the application for the current platform.
  - `make`: Creates an installer for the application.
  - `publish`: Publishes the application to GitHub Releases.
  - `lint`: Lints the code using ESLint.
- **Dependencies**: None
- **Dev Dependencies**:
  - `@electron-forge/cli`: Command line interface for Electron Forge.
  - `@electron-forge/maker-deb`: Creates Debian packages.
  - `@electron-forge/maker-rpm`: Creates RPM packages.
  - `@electron-forge/maker-squirrel`: Creates Squirrel.Windows installers.
  - `@electron-forge/maker-zip`: Creates ZIP archives.
  - `electron`: The Electron framework.
  - `eslint`: A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
  - `eslint-plugin-import`: ESLint plugin with rules that help validate proper imports.

### `forge.config.js`

This file configures Electron Forge.

- **`packagerConfig`**:
  - `icon`: `assets/icon` (the application icon)
  - `asar`: `true` (packages the app into an asar archive)
- **`makers`**: Configures the installers to be created for different platforms (Windows, macOS, Linux).
- **`publishers`**: Configures publishing to GitHub Releases.

### `.eslintrc.js`

This file configures ESLint.

- **`env`**:
  - `browser`: `true`
  - `commonjs`: `true`
  - `es2021`: `true`
  - `node`: `true`
- **`extends`**: `eslint:recommended`
- **`parserOptions`**:
  - `ecmaVersion`: `12`
- **`rules`**: No custom rules are defined.

### `.github/workflows/publish.yml`

This workflow publishes the application to GitHub Releases when a new release is created.

- **`on`**: `release` (triggered when a new release is created)
- **`jobs`**:
  - **`publish`**:
    - **`runs-on`**: `windows-latest`
    - **`steps`**:
      - Checks out the code.
      - Sets up Node.js.
      - Installs dependencies.
      - Publishes the application using `npm run publish`.

### `src/index.html`

This is the main HTML file for the user interface.

- It has a simple structure with a search input field, a search button, and a results area.
- It includes `renderer.js` and `index.css`.

### `src/index.css`

This file contains the styles for the user interface.

- It provides basic styling for the body, search container, input field, button, and results area.

### `src/index.js`

This is the main process file for the Electron application.

- It creates a main browser window with a specified width and height.
- It loads `index.html` into the main window.
- It handles the application's lifecycle events (`ready`, `window-all-closed`, `activate`).
- It uses an IPC (Inter-Process Communication) channel (`search`) to receive search queries from the renderer process and send back the results.
- It uses the `fs` and `path` modules to search for files and folders.

### `src/preload.js`

This script exposes the `ipcRenderer` module to the renderer process in a secure way.

- It uses `contextBridge.exposeInMainWorld` to expose the `send` and `on` methods of `ipcRenderer` to the `window.api` object.

### `src/renderer.js`

This is the main script for the renderer process.

- It adds event listeners to the search input field and search button.
- When the user performs a search, it sends the search query to the main process using `window.api.send('search', ...)`.
- It listens for search results from the main process using `window.api.on('search-results', ...)`.
- It displays the search results in the results area.

## How to Contribute

1.  **Fork the repository.**
2.  **Create a new branch.**
3.  **Make your changes.**
4.  **Lint the code (`npm run lint`).**
5.  **Test your changes (`npm start`).**
6.  **Commit your changes and push to your branch.**
7.  **Create a pull request.**
