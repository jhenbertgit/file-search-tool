# File Search Tool

A modern, cross-platform desktop application for quickly searching files by name or content. Built with Electron, TypeScript, and Clean Architecture principles using dependency injection (InversifyJS) for maintainable and scalable code.

![File Search Tool](https://img.shields.io/badge/Electron-37.3.1-blue?style=flat-square)
![Electron Forge](https://img.shields.io/badge/Electron%20Forge-^7.8.3-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-^5.9.2-blue?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0--beta.7-orange?style=flat-square)

## Screenshot

![File Search Tool](./screenshot.png)

## Features

### For End Users

- **Dual Search Modes**: Search by file name or file content
- **File Type Filtering**: Filter results by specific file types (PDF, Word, Excel, images, etc.)
- **Real-time Search**: Live updates as files are added, modified, or deleted
- **File Operations**: Double-click to open files or use the folder icon to reveal file location
- **Progress Tracking**: See real-time progress with file counts and matches
- **Modern UI**: Clean, intuitive interface with visual feedback
- **Cross-Platform**: Works on Windows, macOS, and Linux

### For Developers

- **Clean Architecture**: Domain-driven design with dependency injection using InversifyJS
- **TypeScript**: Full type safety and modern JavaScript features
- **Electron Forge**: Simplified development workflow and packaging
- **File System Access**: Efficient recursive directory scanning with `fs-extra`
- **Real-time Monitoring**: File system watching with `chokidar`
- **IPC Communication**: Secure inter-process communication with context isolation
- **Dependency Injection**: InversifyJS with reflect-metadata for loose coupling
- **TailwindCSS**: Modern utility-first CSS framework for styling
- **Testing**: Jest with ts-jest for TypeScript testing support

## Installation & Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run the application in development mode**:

   ```bash
   npm start
   ```

   For faster development with hot CSS reload:

   ```bash
   npm run dev
   ```

3. **Build TypeScript** (optional):

   ```bash
   npm run build
   ```

4. **Run tests** (optional):

   ```bash
   npm test
   ```

5. **Lint code** (optional):

   ```bash
   npm run lint
   ```

6. **Package the application** (optional):

   ```bash
   npm run package
   ```

7. **Create distributable installers** (optional):
   ```bash
   npm run make
   ```

## Usage Guide

### Basic Search

1. **Select Directory**: Click the folder icon to choose where to search
2. **Enter Search Term**: Type what you're looking for in the search field
3. **Choose Search Type**: Select whether to search by file name or file content
4. **Filter by File Type** (optional): Use the dropdown to limit results to specific file types
5. **Click Search**: Start the search process

### Advanced Features

- **Custom File Types**: Select "Custom Extension" and enter extensions separated by commas (e.g., `pdf,docx,txt`)
- **Real-time Updates**: The search automatically updates when files are added, modified, or deleted
- **File Operations**:
  - Double-click any result to open the file with its default application
  - Click the folder icon next to any result to reveal the file in Explorer/Finder
- **Progress Tracking**: Watch the progress counter during large searches

### Keyboard Shortcuts

- `Enter` in search field: Start search
- `Escape`: Stop current search (when available)

## For Developers

### Project Structure (Clean Architecture)

```
file-search/
├── src/
│   ├── core/
│   │   └── domain/
│   │       ├── entities/           # Domain entities
│   │       ├── repositories/       # Repository interfaces
│   │       └── services/           # Domain services
│   ├── infrastructure/
│   │   ├── di/                     # Dependency injection container
│   │   ├── electron/               # Electron-specific implementations
│   │   └── file-system/            # File system implementations
│   ├── presentation/
│   │   └── electron-ui/            # UI layer (renderer process)
│   ├── styles/
│   │   ├── input.css               # TailwindCSS source
│   │   └── output.css              # Compiled styles
│   ├── index.html                  # Main UI structure
│   └── index.css                   # Legacy styles (being migrated)
├── dist/                           # Compiled TypeScript output
├── package.json                    # Dependencies and scripts
├── forge.config.js                 # Electron Forge configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # TailwindCSS configuration
├── CLAUDE.md                       # Project instructions
└── README.md                       # This file
```

### Development Commands

#### Fast Development Mode (Recommended)

```bash
npm run dev
```

Runs CSS watch mode and Electron in parallel for the fastest development experience.

#### Regular Start

```bash
npm start
```

Optimized startup that only rebuilds CSS if needed.

#### Development Scripts

| Script                   | Purpose                                    | Performance   |
| ------------------------ | ------------------------------------------ | ------------- |
| `npm run dev`            | Development with hot CSS reload            | ⚡ Fastest    |
| `npm start`              | Quick start (rebuilds CSS only if missing) | 🚀 Fast       |
| `npm run dev:css`        | CSS watch mode only                        | 🔄 Continuous |
| `npm run build:css:dev`  | One-time CSS build for development         | ⏱️ ~600ms     |
| `npm run build:css:prod` | Minified CSS for production                | 📦 Optimized  |
| `npm run build`          | Compile TypeScript                         | 🔨 Build      |
| `npm test`               | Run Jest tests                             | 🧪 Test       |
| `npm run lint`           | ESLint TypeScript code                     | 📝 Lint       |

#### Electron Forge Commands

- `npm start` - Start the application in development mode
- `npm run package` - Package the application without creating installers
- `npm run make` - Create distributable installers for all platforms
- `npm run publish` - Publish the application to GitHub or other providers

### Architecture Overview

#### Clean Architecture Layers

**Domain Layer (`src/core/domain/`)**

- `entities/`: Core business entities (SearchResults)
- `repositories/`: Repository interfaces for data access
- `services/`: Domain services with business logic

**Infrastructure Layer (`src/infrastructure/`)**

- `di/`: Dependency injection container (InversifyJS)
- `electron/`: Electron-specific implementations
  - `main-process.ts`: Main process with IPC handlers
  - `preload.ts`: Secure API bridge
  - `services/`: Electron service implementations
- `file-system/`: File system repository implementations

**Presentation Layer (`src/presentation/`)**

- `electron-ui/renderer.ts`: UI logic and user interactions
- Communicates with main process via preload script
- Handles UI state and user input validation

### Key Dependencies

**Core Framework**

- `electron` (37.3.1): Desktop application framework
- `typescript` (^5.9.2): Type-safe JavaScript superset

**Architecture & DI**

- `inversify` (^7.9.0): Dependency injection container
- `reflect-metadata` (^0.2.2): Metadata reflection for decorators

**File Operations**

- `fs-extra` (^11.2.0): Enhanced file system operations
- `chokidar` (^3.6.0): Efficient file system watching

**Electron Ecosystem**

- `@electron-forge/*` (^7.8.3): Development and packaging tooling
- `electron-store` (^10.1.0): Simple data persistence
- `electron-squirrel-startup` (^1.0.1): Handle Squirrel events

**Styling**

- `tailwindcss` (^3.4.17): Utility-first CSS framework
- `@tailwindcss/forms` (^0.5.10): Form styling utilities

**Development Tools**

- `jest` (^30.0.5) + `ts-jest` (^29.4.1): Testing framework
- `eslint` + `@typescript-eslint/*`: Code linting
- `concurrently` (^9.2.1): Run multiple commands

### Development Guide

1. **Setting up the development environment**:

   ```bash
   git clone https://github.com/jhenbertgit/file-search-tool.git
   cd file-search-tool
   npm install
   ```

2. **Recommended Workflow**:
   - **Daily Development**: Use `npm run dev` for the best experience
     - Automatic CSS rebuilding on file changes
     - Electron restarts automatically on main process changes
     - Fastest iteration cycle

   - **Quick Testing**: Use `npm start` for one-off testing
     - Fast startup without watch overhead
     - Good for testing builds or quick checks

   - **Production Building**: Use production scripts for final builds
     - `npm run make` for distribution packages
     - `npm run package` for platform-specific builds

3. **Development with TypeScript**:

   ```bash
   # Compile TypeScript
   npm run build

   # Run tests
   npm test

   # Lint code
   npm run lint
   ```

4. **Debugging**:
   - The application opens DevTools automatically in development mode
   - Use `console.log()` statements in both main and renderer processes
   - Main process logs appear in the terminal
   - Renderer process logs appear in DevTools
   - TypeScript source maps enabled for debugging

5. **Adding new features (Clean Architecture)**:
   - **Domain**: Add entities/services in `src/core/domain/`
   - **Infrastructure**: Implement repositories in `src/infrastructure/`
   - **DI**: Register services in `src/infrastructure/di/container.ts`
   - **UI**: Update renderer in `src/presentation/electron-ui/`
   - **Styling**: Modify TailwindCSS in `src/styles/input.css`
   - **Main Process**: Update `src/infrastructure/electron/main-process.ts`
   - **API Bridge**: Expose APIs through `src/infrastructure/electron/preload.ts`

### Building for Distribution

1. **Package the application**:

   ```bash
   npm run package
   ```

   Creates platform-specific packages in the `out` directory.

2. **Create installers**:

   ```bash
   npm run make
   ```

   Generates distributable installers for Windows, macOS, and Linux.

3. **Publish** (if configured):
   ```bash
   npm run publish
   ```
   Publishes the application to configured providers like GitHub.

### API Reference

#### Main Process IPC Handlers

- `open-directory-dialog`: Opens native directory picker
- `search-files`: Initiates file search with parameters
- `open-file`: Opens file with default application
- `open-file-location`: Reveals file in file explorer
- `stop-search`: Terminates current search operation

#### Renderer Process Events

- `search-results`: Emitted when search results are available
- `search-error`: Emitted when an error occurs during search
- `search-progress`: Emitted with progress updates during search

## Configuration

### Electron Forge Configuration

The application uses Electron Forge with the following makers configured:

- **Windows**: Squirrel installer (`.exe`)
- **macOS**: ZIP archive and DMG installer
- **Linux**: DEB and RPM packages

### Customizing Build Configuration

Edit `forge.config.js` to modify:

- Application metadata
- Installer options
- Publishing targets
- Build preferences

## Troubleshooting

### Development Issues

1. **Slow Startup**:

   If startup is still slow:
   - Check if `src/styles/output.css` exists
   - Run `npm run build:css:dev` manually if needed
   - Use `npm run dev` for development instead

2. **CSS Not Updating**:

   If CSS changes aren't reflected:
   - Use `npm run dev` to enable watch mode
   - Or manually run `npm run build:css:dev` after changes
   - Check Tailwind config for content path issues

3. **Build Errors**:

   If builds fail:
   - Run `npm run lint` to check for code issues
   - Run `npm run build` to check TypeScript compilation
   - Check that all dependencies are installed with `npm install`

4. **TypeScript Errors**:
   - Ensure `reflect-metadata` is imported in main files
   - Check InversifyJS container bindings
   - Verify interface implementations match

### Runtime Issues

1. **Application won't start**:
   - Ensure Node.js version 18+ is installed
   - Delete `node_modules` folder and run `npm install` again
   - Check if TypeScript compilation succeeded with `npm run build`

2. **Build failures**:
   - On Windows, ensure Windows Build Tools are installed
   - On macOS, ensure Xcode Command Line Tools are installed
   - On Linux, ensure required build dependencies are installed

3. **Search is slow**:
   - Avoid searching very large directories with many small files
   - Use file type filters to narrow search scope

4. **No results found**:
   - Check that the search directory contains relevant files
   - Verify search term spelling
   - Try a less specific search term

### Build Times

- **First-time setup**: ~3 seconds (includes CSS generation)
- **Subsequent starts**: ~1 second (CSS exists, skips rebuild)
- **Development mode**: Instant CSS updates with watch mode
- **Production build**: ~800ms (includes minification)
- **TypeScript compilation**: ~2-3 seconds for full build

### Performance Tips

- Use file type filters to significantly improve search speed
- For content searches, avoid searching binary files by filtering by type
- The application processes files in batches to prevent UI freezing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information about your problem

## Version History

- **v1.0.0-beta.7** (Current)
  - Clean Architecture implementation with dependency injection
  - TypeScript migration for type safety
  - TailwindCSS integration for modern styling
  - InversifyJS dependency injection container
  - Enhanced development workflow with hot CSS reload
  - File name and content search modes
  - File type filtering with custom extensions
  - Real-time file system monitoring
  - File opening and location revealing
  - Search history persistence with electron-store
  - Comprehensive testing setup with Jest and ts-jest
  - ESLint configuration for TypeScript
  - Electron Forge integration for streamlined development

---

**Note**: This application accesses your file system to perform searches. It only reads file contents when performing content searches and does not modify or transmit your files.
