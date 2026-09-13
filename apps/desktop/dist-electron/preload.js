"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ─── Type-safe IPC API exposed to renderer ────────────────────────────────────
const novaAPI = {
    // Window controls
    window: {
        minimize: () => electron_1.ipcRenderer.send('window:minimize'),
        maximize: () => electron_1.ipcRenderer.send('window:maximize'),
        close: () => electron_1.ipcRenderer.send('window:close'),
        isMaximized: () => electron_1.ipcRenderer.invoke('window:isMaximized'),
        onStateChanged: (cb) => {
            const handler = (_, state) => cb(state);
            electron_1.ipcRenderer.on('window:state-changed', handler);
            return () => electron_1.ipcRenderer.removeListener('window:state-changed', handler);
        },
    },
    // App info
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
        getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
    },
    // Project management
    project: {
        create: (name, directory) => electron_1.ipcRenderer.invoke('project:create', name, directory),
        open: (projectPath) => electron_1.ipcRenderer.invoke('project:open', projectPath),
        save: (projectPath, data) => electron_1.ipcRenderer.invoke('project:save', projectPath, data),
        saveAs: (data) => electron_1.ipcRenderer.invoke('project:saveAs', data),
    },
    // Dialog
    dialog: {
        openFile: (options) => electron_1.ipcRenderer.invoke('dialog:openFile', options),
        saveFile: (options) => electron_1.ipcRenderer.invoke('dialog:saveFile', options),
        openDirectory: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
        showMessage: (options) => electron_1.ipcRenderer.invoke('dialog:showMessage', options),
    },
    // Assets
    assets: {
        import: (sourcePaths, projectAssetsDir) => electron_1.ipcRenderer.invoke('assets:import', sourcePaths, projectAssetsDir),
        readFile: (absolutePath) => electron_1.ipcRenderer.invoke('assets:readFile', absolutePath), // returns data URL
    },
    // File system (controlled access)
    fs: {
        readDirectory: (directoryPath) => electron_1.ipcRenderer.invoke('fs:readDirectory', directoryPath),
        readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readFile', filePath),
        writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('fs:writeFile', filePath, content),
        exists: (filePath) => electron_1.ipcRenderer.invoke('fs:exists', filePath),
        mkdir: (dirPath) => electron_1.ipcRenderer.invoke('fs:mkdir', dirPath),
    },
    // Database (recent projects, settings)
    db: {
        getRecentProjects: () => electron_1.ipcRenderer.invoke('db:getRecentProjects'),
        addRecentProject: (name, projectPath) => electron_1.ipcRenderer.invoke('db:addRecentProject', name, projectPath),
        removeRecentProject: (projectPath) => electron_1.ipcRenderer.invoke('db:removeRecentProject', projectPath),
        getSetting: (key) => electron_1.ipcRenderer.invoke('db:getSetting', key),
        setSetting: (key, value) => electron_1.ipcRenderer.invoke('db:setSetting', key, value),
    },
};
electron_1.contextBridge.exposeInMainWorld('nova', novaAPI);
//# sourceMappingURL=preload.js.map