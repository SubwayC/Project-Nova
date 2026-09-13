import { contextBridge, ipcRenderer } from 'electron';

// ─── Type-safe IPC API exposed to renderer ────────────────────────────────────

const novaAPI = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
    onStateChanged: (cb: (state: { maximized: boolean }) => void) => {
      const handler = (_: unknown, state: { maximized: boolean }) => cb(state);
      ipcRenderer.on('window:state-changed', handler);
      return () => ipcRenderer.removeListener('window:state-changed', handler);
    },
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<string>,
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name) as Promise<string>,
  },

  // Project management
  project: {
    create: (name: string, directory: string) =>
      ipcRenderer.invoke('project:create', name, directory) as Promise<{ success: boolean; path?: string; error?: string }>,
    open: (projectPath: string) =>
      ipcRenderer.invoke('project:open', projectPath) as Promise<{ success: boolean; data?: unknown; error?: string }>,
    save: (projectPath: string, data: unknown) =>
      ipcRenderer.invoke('project:save', projectPath, data) as Promise<{ success: boolean; error?: string }>,
    saveAs: (data: unknown) =>
      ipcRenderer.invoke('project:saveAs', data) as Promise<{ success: boolean; path?: string; error?: string }>,
  },

  // Dialog
  dialog: {
    openFile: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:openFile', options) as Promise<Electron.OpenDialogReturnValue>,
    saveFile: (options: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke('dialog:saveFile', options) as Promise<Electron.SaveDialogReturnValue>,
    openDirectory: () =>
      ipcRenderer.invoke('dialog:openDirectory') as Promise<string | null>,
    showMessage: (options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke('dialog:showMessage', options) as Promise<Electron.MessageBoxReturnValue>,
  },

  // Assets
  assets: {
    import: (sourcePaths: string[], projectAssetsDir: string) =>
      ipcRenderer.invoke('assets:import', sourcePaths, projectAssetsDir) as Promise<
        Array<{ success: boolean; relativePath?: string; name?: string; error?: string }>
      >,
    readFile: (absolutePath: string) =>
      ipcRenderer.invoke('assets:readFile', absolutePath) as Promise<string>, // returns data URL
  },

  // File system (controlled access)
  fs: {
    readDirectory: (directoryPath: string) =>
      ipcRenderer.invoke('fs:readDirectory', directoryPath) as Promise<Array<{ name: string; path: string; isDirectory: boolean }>>,
    readFile: (filePath: string) =>
      ipcRenderer.invoke('fs:readFile', filePath) as Promise<string>,
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:writeFile', filePath, content) as Promise<{ success: boolean; error?: string }>,
    exists: (filePath: string) =>
      ipcRenderer.invoke('fs:exists', filePath) as Promise<boolean>,
    mkdir: (dirPath: string) =>
      ipcRenderer.invoke('fs:mkdir', dirPath) as Promise<{ success: boolean }>,
  },

  // Database (recent projects, settings)
  db: {
    getRecentProjects: () =>
      ipcRenderer.invoke('db:getRecentProjects') as Promise<Array<{
        id: number;
        name: string;
        path: string;
        lastOpenedAt: string;
      }>>,
    addRecentProject: (name: string, projectPath: string) =>
      ipcRenderer.invoke('db:addRecentProject', name, projectPath) as Promise<void>,
    removeRecentProject: (projectPath: string) =>
      ipcRenderer.invoke('db:removeRecentProject', projectPath) as Promise<void>,
    getSetting: (key: string) =>
      ipcRenderer.invoke('db:getSetting', key) as Promise<string | null>,
    setSetting: (key: string, value: string) =>
      ipcRenderer.invoke('db:setSetting', key, value) as Promise<void>,
  },
};

contextBridge.exposeInMainWorld('nova', novaAPI);

// TypeScript declaration helper (used by renderer's global.d.ts)
export type NovaAPI = typeof novaAPI;
