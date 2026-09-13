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

