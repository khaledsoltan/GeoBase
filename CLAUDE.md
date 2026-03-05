# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GeoApp** is a Next.js application with a **Catex extension system** for injecting interactive UI components into external geospatial applications (like maps). The project uses React 19, TypeScript, and Tailwind CSS.

### Key Architecture

The project has two main components:

1. **Next.js App** (`app/` directory): The main application using Next.js App Router with TypeScript
2. **Catex Bundle System**: A bundled extension that runs as an IIFE global on external pages
   - Built with esbuild (`build-catex.js`)
   - Served via Express CDN server (`server-catex.js`)
   - Contains handlers for map interactions, DOM manipulation, language/localization, visibility controls, and more
   - Auto-mounts React components on external pages

### Directory Structure

- `app/` - Next.js pages and layouts
- `core/lib/catex/` - Catex entry point (`entry.tsx`), registry, and event handlers
  - `handlers/` - Map, DOM, visibility, action, language, cart, and proxy handlers
  - `language/` - Localization support (English and Arabic)
- `core/components/features/catex/` - React components for the extension
  - `UI/layout/` - Navbar and Sidebar components
  - `UI/events/` - Event handler components (e.g., map click handling)
  - `types/` - TypeScript type definitions
- `core/lib/config/` - JSON configuration files for element manipulation and actions
- `dist/` - Compiled catex bundle output (created by `build-catex.js`)
- `public/` - Static assets

## Commands

### Development

- `npm run dev` - Start Next.js dev server (http://localhost:3000)
- `npm run build:catex` - Build catex bundle once (outputs to `dist/`)
- `npm run watch:catex` - Watch catex source files and rebuild on changes
- `npm run serve:catex` - Start Express CDN server for catex bundle (http://localhost:4000)
- `npm run dev:catex` - Watch and serve catex together (runs watch:catex + serve:catex concurrently)

### Production

- `npm run build` - Build Next.js app for production
- `npm run start` - Start production Next.js server
- `npm run lint` - Run ESLint on the codebase

## Development Workflow

### For Next.js App Changes
```bash
npm run dev
# Edit files in app/ or other Next.js-related code
# Changes auto-reload
```

### For Catex Extension Changes
```bash
npm run dev:catex
# Edit files in core/lib/catex/ or core/components/features/catex/
# build-catex watches and rebuilds
# server-catex provides live reload via SSE
# Access http://localhost:4000/entry.js and http://localhost:4000/entry.css for the bundle
```

## Key Technical Details

### Catex Bundle Building

- **Entry point**: `core/lib/catex/entry.tsx`
- **Build tool**: esbuild (configured in `build-catex.js`)
- **Output format**: IIFE (Immediately Invoked Function Expression) with global `CatexExtensions`
- **Bundler aliases**: `@/*` resolves to project root
- **Asset handling**: Font files and SVGs are inlined as data URLs

### Catex Injection Model

The catex bundle is designed to be injected into external pages:
1. Creates root DOM elements (navbar, sidebar, main container)
2. Mounts React components into those elements
3. Registers event handlers (e.g., map clicks)
4. Manipulates external page DOM (removes/hides elements based on config)
5. Dispatches custom events for external page integration

### Configuration Files

Located in `core/lib/config/`:
- `actions.json` - Action definitions
- `navProxy.json` - Navigation proxy configuration
- `removeElements.json` - Elements to remove from host page
- `hideElements.json` - Elements to hide when they appear
- `sidebar.json` - Sidebar configuration
- `dict/en.json`, `dict/ar.json` - Localization strings

### Component Pattern

Components are auto-mounted from exports in `core/components/features/catex/index.tsx`. New components should:
1. Export as named exports from the index
2. Be React functional components (exported via default from their file)
3. Work in the catex IIFE context (window-based global communication)

### Event Handling

The catex registry pattern allows registering handlers:
```typescript
catexRegistry.on("namespace", "eventName", (event, callback) => {
  // handle event and call callback with data
});
```

Custom events are dispatched via `window.dispatchEvent(new CustomEvent("catex:namespace:event", { detail: data }))`

## TypeScript Configuration

- **Target**: ES2017
- **Strict mode**: Enabled
- **Module resolution**: Bundler
- **Path alias**: `@/*` maps to project root
- **JSX**: React automatic runtime (no need for React import)

## Linting

- Uses ESLint with Next.js presets (core-web-vitals and TypeScript)
- Configure with `eslint.config.mjs`

## Important Notes

- The catex bundle runs in a global IIFE context on external pages, so be careful with global scope pollution
- All assets (fonts, SVGs) are bundled inline with esbuild loaders to avoid external file dependencies
- TypeScript strict mode is enabled—maintain type safety throughout
- Main branch is `main`, development branch is `master`
