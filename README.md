# Project Nova

A professional offline-first visual creation and editor desktop application.

> Inspired by VS Code's architecture, Figma's canvas, and Canva's accessibility — but running 100% locally.

---

## Architecture

```
project-nova/
├── apps/
│   └── desktop/
│       ├── electron/        ← Main process (IPC, SQLite, file system)
│       └── renderer/        ← React UI
│
├── packages/
│   ├── shared/              ← Types, utils, constants (no deps)
│   ├── document/            ← Document model + DocumentEngine
│   ├── history/             ← Command pattern undo/redo
│   ├── interaction/         ← Selection, hit-test, transform, snapping
│   ├── renderer/            ← RendererAPI abstraction + PixiJS impl
│   ├── core/                ← NovaEngine orchestrator
│   ├── assets/              ← Asset manager
│   ├── components/          ← Reusable components (future)
│   └── animation/           ← Animation engine (future)
```

### Core Architecture Principle

**The Core Engine is independent of Electron and React.**

```
┌──────────────────────────────────────────────────────┐
│  React UI (Zustand stores, React components)         │
├──────────────────────────────────────────────────────┤
│  NovaEngine (@nova/core)                             │
│    ├── DocumentEngine  (@nova/document)              │
│    ├── HistoryEngine   (@nova/history)               │
│    ├── SelectionSystem (@nova/interaction)           │
│    ├── HitTestSystem   (@nova/interaction)           │
│    ├── TransformSystem (@nova/interaction)           │
│    ├── SnappingSystem  (@nova/interaction)           │
│    └── RendererAPI     (@nova/renderer)              │
│          └── PixiJSRenderer (PixiJS v8)              │
├──────────────────────────────────────────────────────┤
│  Electron (IPC, SQLite, file system)                 │
└──────────────────────────────────────────────────────┘
```

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| Electron 32 | Desktop shell |
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Vite 5 | Build tool / Dev server |
| Tailwind CSS 3 | Styling |
| Zustand 5 | UI state management |
| PixiJS 8 | Canvas rendering |
| better-sqlite3 | Local database |
| npm workspaces | Monorepo |

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Document Model

Every project follows this structure on disk:

```
MyProject.nova/
  project.json          ← Project metadata, page refs, settings
  pages/
    page-001.json       ← Page object tree
  assets/
    image.png           ← Copied asset files
  components/
  exports/
```

## Rendering Architecture

PixiJS is NOT the Core Engine — it's one possible rendering backend.

```
Core Engine
    │
    └── RendererAPI (interface)
          ├── PixiJSRenderer  ← current
          ├── SVGRenderer     ← future
          └── WebGPURenderer  ← future
```


## Future Architecture

The Core Engine is designed to be portable:

```
         Shared Core
             │
  ┌──────────┴──────────┐
  │                     │
Desktop                Mobile
Electron          React Native
```

## Development Guidelines

1. **Never put business logic in React components.** All editing logic goes in the core packages.
2. **The document model is the source of truth.** Zustand stores mirror it, they don't own it.
3. **Commands are the only way to mutate the document.** This ensures undo/redo always works.
4. **PixiJS objects are not document objects.** The renderer maps between them.
5. **No Electron APIs in core packages.** Use abstract interfaces.
