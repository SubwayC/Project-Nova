import { create } from 'zustand';

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | undefined;
  redoDescription: string | undefined;

  // Actions (called by engine event handlers in EditorBridge)
  setHistoryState: (canUndo: boolean, canRedo: boolean, description?: string) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  canUndo: false,
  canRedo: false,
  undoDescription: undefined,
  redoDescription: undefined,

  setHistoryState: (canUndo, canRedo, description) =>
    set({ canUndo, canRedo, undoDescription: description }),
}));
