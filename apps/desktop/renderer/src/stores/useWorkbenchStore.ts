import { create } from 'zustand';
import type { ID } from '@nova/shared';

export type ActivePanel =
  'explorer' | 'layers' | 'assets' | 'templates' | 'components' | 'settings';
export type BottomPanelTab = 'layers' | 'assets' | 'timeline' | 'output';

interface WorkbenchState {
  // Activity bar
  activityBarOpen: boolean;
  // Sidebar
  activePanel: ActivePanel;
  sidebarOpen: boolean;
  sidebarWidth: number;
  // Properties panel
  propertiesOpen: boolean;
  propertiesWidth: number;
  // Bottom panel
  bottomPanelOpen: boolean;
  bottomPanelHeight: number;
  bottomPanelTab: BottomPanelTab;
  // Status bar
  statusBarOpen: boolean;
  // Window state
  isMaximized: boolean;
  // File preview
  openFilePath: string | null;
  openFileContent: string | null;
  // Modals
  aboutModalOpen: boolean;
  shortcutsModalOpen: boolean;

  // Actions
  setActivePanel: (panel: ActivePanel) => void;
  toggleActivityBar: () => void;
  setActivityBarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  resetSidebarWidth: () => void;
  toggleProperties: () => void;
  setPropertiesOpen: (open: boolean) => void;
  setPropertiesWidth: (width: number) => void;
  resetPropertiesWidth: () => void;
  toggleBottomPanel: () => void;
  setBottomPanelOpen: (open: boolean) => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  setBottomPanelHeight: (height: number) => void;
  resetBottomPanelHeight: () => void;
  toggleStatusBar: () => void;
  setStatusBarOpen: (open: boolean) => void;
  setMaximized: (maximized: boolean) => void;
  setOpenFile: (path: string, content: string) => void;
  closeOpenFile: () => void;
  setAboutModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  activityBarOpen: true,
  activePanel: 'explorer',
  sidebarOpen: true,
  sidebarWidth: 260,
  propertiesOpen: true,
  propertiesWidth: 260,
  bottomPanelOpen: true,
  bottomPanelHeight: 200,
  bottomPanelTab: 'layers',
  statusBarOpen: true,
  isMaximized: false,
  openFilePath: null,
  openFileContent: null,
  aboutModalOpen: false,
  shortcutsModalOpen: false,

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleActivityBar: () => set((s) => ({ activityBarOpen: !s.activityBarOpen })),
  setActivityBarOpen: (open) => set({ activityBarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  resetSidebarWidth: () => set({ sidebarWidth: 260 }),
  toggleProperties: () => set((s) => ({ propertiesOpen: !s.propertiesOpen })),
  setPropertiesOpen: (open) => set({ propertiesOpen: open }),
  setPropertiesWidth: (width) => set({ propertiesWidth: width }),
  resetPropertiesWidth: () => set({ propertiesWidth: 260 }),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
  resetBottomPanelHeight: () => set({ bottomPanelHeight: 200 }),
  toggleStatusBar: () => set((s) => ({ statusBarOpen: !s.statusBarOpen })),
  setStatusBarOpen: (open) => set({ statusBarOpen: open }),
  setMaximized: (maximized) => set({ isMaximized: maximized }),
  setOpenFile: (openFilePath, openFileContent) => set({ openFilePath, openFileContent }),
  closeOpenFile: () => set({ openFilePath: null, openFileContent: null }),
  setAboutModalOpen: (open) => set({ aboutModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
}));
