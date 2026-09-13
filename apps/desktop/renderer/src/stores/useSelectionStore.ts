import { create } from 'zustand';
import type { ID } from '@nova/shared';
import type { NovaObject, Page } from '@nova/document';

interface SelectionState {
  selectedIds: ID[];
  selectionBounds: { x: number; y: number; width: number; height: number; rotation: number } | null;
  // The objects themselves (for the properties panel)
  selectedObjects: NovaObject[];

  // Actions
  setSelection: (ids: ID[], objects: NovaObject[]) => void;
  clearSelection: () => void;
  setSelectionBounds: (
    bounds: { x: number; y: number; width: number; height: number; rotation: number } | null
  ) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  selectionBounds: null,
  selectedObjects: [],

  setSelection: (selectedIds, selectedObjects) =>
    set({ selectedIds, selectedObjects }),
  clearSelection: () =>
    set({ selectedIds: [], selectionBounds: null, selectedObjects: [] }),
  setSelectionBounds: (selectionBounds) => set({ selectionBounds }),
}));
