"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const projectHandlers_1 = require("./ipc/projectHandlers");
const assetHandlers_1 = require("./ipc/assetHandlers");
const dialogHandlers_1 = require("./ipc/dialogHandlers");
const dbHandlers_1 = require("./ipc/dbHandlers");
const isDev = process.env.NODE_ENV === 'development';
const RENDERER_URL = process.env.RENDERER_URL || 'http://127.0.0.1:5173';
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        title: 'Project Nova',
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 640,
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#0F172A',
        show: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            // Security
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // needed for preload file access
            webSecurity: true,
        },
        icon: fs_1.default.existsSync(path_1.default.join(__dirname, '../../public/icons/icon.png'))
            ? path_1.default.join(__dirname, '../../public/icons/icon.png')
            : undefined,
    });
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('Electron did-fail-load:', errorCode, errorDescription, validatedURL);
    });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Project Nova window loaded successfully');
    });
    // ── Window events ──────────────────────────────────────────────────────────
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Forward window state events to renderer
    mainWindow.on('maximize', () => {
        mainWindow?.webContents.send('window:state-changed', { maximized: true });
    });
    mainWindow.on('unmaximize', () => {
        mainWindow?.webContents.send('window:state-changed', { maximized: false });
    });
    mainWindow.on('focus', () => {
        mainWindow?.webContents.send('window:focus-changed', { focused: true });
    });
    mainWindow.on('blur', () => {
        mainWindow?.webContents.send('window:focus-changed', { focused: false });
    });
    mainWindow.webContents.on('before-input-event', (_event, input) => {
        if (input.key === 'F12' && input.type === 'keyDown') {
            mainWindow?.webContents.toggleDevTools();
        }
    });
    // ── Load content ───────────────────────────────────────────────────────────
    if (isDev) {
        mainWindow.loadURL(RENDERER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // ── Window control IPC ─────────────────────────────────────────────────────
    electron_1.ipcMain.on('window:minimize', () => mainWindow?.minimize());
    electron_1.ipcMain.on('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.on('window:close', () => mainWindow?.close());
    electron_1.ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
}
// ── App Lifecycle ────────────────────────────────────────────────────────────
electron_1.app.whenReady().then(async () => {
    // Initialize SQLite database
    await (0, dbHandlers_1.initDatabase)(electron_1.app.getPath('userData'));
    // Register IPC handlers
    (0, projectHandlers_1.registerProjectHandlers)(electron_1.ipcMain);
    (0, assetHandlers_1.registerAssetHandlers)(electron_1.ipcMain);
    (0, dialogHandlers_1.registerDialogHandlers)(electron_1.ipcMain, mainWindow);
    (0, dbHandlers_1.registerDbHandlers)(electron_1.ipcMain, electron_1.app.getPath('userData'));
    createWindow();
    // Provide app info
    electron_1.ipcMain.handle('app:getVersion', () => electron_1.app.getVersion());
    electron_1.ipcMain.handle('app:getPath', (_event, name) => electron_1.app.getPath(name));
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// Security: prevent navigation to external URLs
electron_1.app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
        if (!url.startsWith(RENDERER_URL) && !url.startsWith('http://127.0.0.1:5173') && !url.startsWith('file://')) {
            event.preventDefault();
        }
    });
    contents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) {
            electron_1.shell.openExternal(url);
        }
        return { action: 'deny' };
    });
});
//# sourceMappingURL=main.js.map