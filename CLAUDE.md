## FEATURE:

File Search - A modern, cross-platform desktop application built with Electron for searching files by name or content. Features a clean architecture using Clean Architecture principles with dependency injection (InversifyJS), TypeScript, and real-time file system monitoring.

**Key Features:**
- Dual search modes: file name and file content search
- Real-time file system monitoring with progress tracking
- File type filtering with custom extensions support
- Modern Electron UI with secure IPC communication
- Cross-platform support (Windows, macOS, Linux)
- Search history persistence using electron-store
- File operations: open files and reveal in file explorer

**Architecture:**
- Clean Architecture with domain/infrastructure separation
- Dependency injection using InversifyJS with reflect-metadata
- TypeScript for type safety
- Electron with secure preload scripts and context isolation
- Real-time progress updates via IPC

## EXAMPLES:

No examples folder exists in this project. The application is a standalone desktop file search tool.

**Usage Examples:**
1. **Basic File Name Search:** Select directory ’ Enter search term ’ Choose "file-name" mode ’ Click search
2. **Content Search with Filtering:** Select directory ’ Enter content term ’ Choose "file-content" mode ’ Select file types (e.g., PDF, DOCX) ’ Search
3. **Custom Extension Search:** Use "Custom Extension" option and enter comma-separated extensions like `pdf,docx,txt`

## DOCUMENTATION:

**Core Documentation References:**
- [Electron Documentation](https://www.electronjs.org/docs) - Main framework documentation
- [Electron Forge](https://www.electronforge.io/) - Build and packaging toolchain
- [InversifyJS](https://inversify.io/) - Dependency injection framework
- [TypeScript](https://www.typescriptlang.org/docs/) - Language and type system
- [Node.js fs-extra](https://github.com/jprichardson/node-fs-extra) - Enhanced file system operations
- [chokidar](https://github.com/paulmillr/chokidar) - File system watching

**Project-Specific Documentation:**
- `README.md` - Comprehensive user and developer guide
- `package.json` - Dependencies and npm scripts
- Source code architecture documented in src/ directory structure

## OTHER CONSIDERATIONS:

**Development Workflow:**
- **Testing:** Use `npm test` (Jest configured with ts-jest)
- **Linting:** Use `npm run lint` (ESLint with TypeScript rules)
- **Building:** Use `npm run build` (TypeScript compilation)
- **Development:** Use `npm start` (Electron Forge development mode)

**Architecture Patterns:**
- Clean Architecture: Domain entities and services are separated from infrastructure
- Dependency Injection: All services are injected via InversifyJS container
- Repository Pattern: File system operations abstracted through repository interface
- Service Layer: Business logic encapsulated in FileSearchService

**Security Considerations:**
- Context isolation enabled in Electron
- Preload script provides secure API bridge
- No direct Node.js access from renderer process
- File system operations restricted to main process

**Performance Notes:**
- Large directory searches use batch processing to prevent UI freezing
- File type filtering significantly improves search performance
- Real-time file system monitoring uses efficient chokidar watchers
- Content search processes files in chunks to maintain responsiveness

**Common Gotchas:**
1. **File Permissions:** Ensure adequate permissions for target search directories
2. **Large Files:** Content search may be slow on very large files - consider maxFileSize option
3. **Binary Files:** Content search on binary files will produce garbled results - use file type filtering
4. **Path Separators:** Windows/Unix path differences are handled by Node.js path module
5. **IPC Communication:** Always handle async IPC operations with proper error handling
6. **Electron Security:** Never disable context isolation or enable node integration in production

**TypeScript Configuration:**
- Strict mode enabled for better type safety
- Reflect metadata required for InversifyJS decorators
- ES2020 target for modern JavaScript features

**Build and Distribution:**
- Electron Forge handles packaging for all platforms
- Platform-specific makers configured for Windows (Squirrel), macOS (ZIP/DMG), and Linux (DEB/RPM)
- GitHub publisher configured for automated releases