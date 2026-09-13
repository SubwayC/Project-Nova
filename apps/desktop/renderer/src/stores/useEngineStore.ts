import { create } from 'zustand';
import { NovaEngine } from '@nova/core';
import { createProject } from '@nova/document';

interface EngineState {
  engine: NovaEngine | null;
  isReady: boolean;
  initEngine: () => NovaEngine;
  getEngine: () => NovaEngine;
}

/**
 * Singleton engine store.
 * The engine is created once and shared across all React components.
 */
export const useEngineStore = create<EngineState>((set, get) => ({
  engine: null,
  isReady: false,

  initEngine: () => {
    const existing = get().engine;
    if (existing) return existing;
    const engine = new NovaEngine(createProject('Untitled Project'));
    set({ engine, isReady: true });
    return engine;
  },

  getEngine: () => {
    const engine = get().engine;
    if (!engine) throw new Error('Engine not initialized');
    return engine;
  },
}));
