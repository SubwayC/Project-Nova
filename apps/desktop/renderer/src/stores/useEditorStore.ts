import { create } from 'zustand';
import type { ID } from '@nova/shared';
import type { ToolMode } from '@nova/core';
import type { Viewport } from '@nova/renderer';

interface EditorState {
  // Viewport
  zoom: number;
  offsetX: number;
  offsetY: number;
  // Tool
  activeTool: ToolMode;
  // Active page
  activePageId: ID | null;
  // Canvas interactions
  isPanning: boolean;
  isDrawing: boolean;
  // Grid & guides
  showGrid: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  // Project path
  projectPath: string | null;
  projectName: string;
  isDirty: boolean;

  // Actions
  setViewport: (viewport: Partial<Viewport>) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: ToolMode) => void;
  setActivePageId: (id: ID) => void;
  setIsPanning: (v: boolean) => void;
  setIsDrawing: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  toggleGrid: () => void;
  setShowGuides: (v: boolean) => void;
  toggleGuides: () => void;
  setSnapToGrid: (v: boolean) => void;
  setProjectPath: (path: string | null) => void;
  setProjectName: (name: string) => void;
  setDirty: (dirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  activeTool: 'select',
  activePageId: null,
  isPanning: false,
  isDrawing: false,
  showGrid: true,
  showGuides: true,
  snapToGrid: true,
  projectPath: null,
  projectName: 'Untitled Project',
  isDirty: false,

  setViewport: (vp) => set((s) => ({ ...s, ...vp })),
  setZoom: (zoom) => set({ zoom }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActivePageId: (activePageId) => set({ activePageId }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setShowGrid: (showGrid) => set({ showGrid }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setShowGuides: (showGuides) => set({ showGuides }),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setProjectPath: (projectPath) => set({ projectPath }),
  setProjectName: (projectName) => set({ projectName }),
  setDirty: (isDirty) => set({ isDirty }),
}));
