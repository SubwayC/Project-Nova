// Global type augmentations for the Electron renderer
// The full type is defined in electron/preload.ts via contextBridge

declare global {
  interface Window {
    nova: {
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        isMaximized: () => Promise<boolean>;
        onStateChanged: (cb: (state: { maximized: boolean }) => void) => () => void;
      };
      app: {
        getVersion: () => Promise<string>;
        getPath: (name: string) => Promise<string>;
      };
      project: {
        create: (name: string, directory: string) => Promise<{ success: boolean; path?: string; error?: string }>;
        open: (projectPath: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
        save: (projectPath: string, data: unknown) => Promise<{ success: boolean; error?: string }>;
        saveAs: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
      };
      dialog: {
        openFile: (options: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>;
        saveFile: (options: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
        openDirectory: () => Promise<string | null>;
        showMessage: (options: unknown) => Promise<{ response: number }>;
      };
      assets: {
        import: (sourcePaths: string[], projectAssetsDir: string) => Promise<Array<{ success: boolean; relativePath?: string; name?: string; error?: string }>>;
        readFile: (absolutePath: string) => Promise<string>;
      };
      fs: {
        readDirectory: (directoryPath: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean }>>;
        readFile: (filePath: string) => Promise<string>;
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        exists: (filePath: string) => Promise<boolean>;
        mkdir: (dirPath: string) => Promise<{ success: boolean }>;
      };
      db: {
        getRecentProjects: () => Promise<Array<{ id: number; name: string; path: string; lastOpenedAt: string }>>;
        addRecentProject: (name: string, projectPath: string) => Promise<void>;
        removeRecentProject: (projectPath: string) => Promise<void>;
        getSetting: (key: string) => Promise<string | null>;
        setSetting: (key: string, value: string) => Promise<void>;
      };
    };
  }
}

export {};

