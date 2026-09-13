import { create } from 'zustand';
import type { Page, Project } from '@nova/document';

interface ProjectState {
  project: Project | null;
  pages: Page[];
  activePageId: string | null;

  setProject: (project: Project) => void;
  setPages: (pages: Page[]) => void;
  setActivePageId: (id: string) => void;
  updatePage: (page: Page) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  pages: [],
  activePageId: null,

  setProject: (project) =>
    set({ project, pages: project.pages, activePageId: project.activePageId }),
  setPages: (pages) => set({ pages }),
  setActivePageId: (activePageId) => set({ activePageId }),
  updatePage: (updated) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === updated.id ? updated : p)),
    })),
}));
