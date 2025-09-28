# Development Guide

## Quick Start

### Fast Development Mode (Recommended)

```bash
npm run dev
```

This runs CSS watch mode and Electron in parallel for the fastest development experience.

### Regular Start

```bash
npm start
```

Optimized startup that only rebuilds CSS if needed.

## Development Scripts

| Script                   | Purpose                                    | Performance   |
| ------------------------ | ------------------------------------------ | ------------- |
| `npm run dev`            | Development with hot CSS reload            | ⚡ Fastest    |
| `npm start`              | Quick start (rebuilds CSS only if missing) | 🚀 Fast       |
| `npm run dev:css`        | CSS watch mode only                        | 🔄 Continuous |
| `npm run build:css:dev`  | One-time CSS build for development         | ⏱️ ~600ms     |
| `npm run build:css:prod` | Minified CSS for production                | 📦 Optimized  |

## Performance Optimizations

### CSS Build Optimizations

- **Disabled unused Tailwind features** for faster builds
- **Development CSS builds** without minification (~600ms)
- **Smart CSS rebuilding** only when necessary
- **Watch mode** for real-time CSS updates during development

### Startup Optimizations

- **CSS file existence check** prevents unnecessary rebuilds
- **Parallel execution** with concurrently for watch modes
- **Separate dev and production builds** for optimal performance

## Recommended Workflow

1. **Daily Development**: Use `npm run dev` for the best experience
   - Automatic CSS rebuilding on file changes
   - Electron restarts automatically on main process changes
   - Fastest iteration cycle

2. **Quick Testing**: Use `npm start` for one-off testing
   - Fast startup without watch overhead
   - Good for testing builds or quick checks

3. **Production Building**: Use production scripts for final builds
   - `npm run make` for distribution packages
   - `npm run package` for platform-specific builds

## Build Times

- **First-time setup**: ~3 seconds (includes CSS generation)
- **Subsequent starts**: ~1 second (CSS exists, skips rebuild)
- **Development mode**: Instant CSS updates with watch mode
- **Production build**: ~800ms (includes minification)

## Troubleshooting

### Slow Startup

If startup is still slow:

1. Check if `src/styles/output.css` exists
2. Run `npm run build:css:dev` manually if needed
3. Use `npm run dev` for development instead

### CSS Not Updating

If CSS changes aren't reflected:

1. Use `npm run dev` to enable watch mode
2. Or manually run `npm run build:css:dev` after changes
3. Check Tailwind config for content path issues

### Build Errors

If builds fail:

1. Run `npm run lint` to check for code issues
2. Run `npm run build` to check TypeScript compilation
3. Check that all dependencies are installed with `npm install`
