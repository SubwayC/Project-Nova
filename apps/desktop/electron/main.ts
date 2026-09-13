import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerProjectHandlers } from './ipc/projectHandlers';
import { registerAssetHandlers } from './ipc/assetHandlers';
import { registerDialogHandlers } from './ipc/dialogHandlers';
import { registerDbHandlers, initDatabase } from './ipc/dbHandlers';

const isDev = process.env.NODE_ENV === 'development';
const RENDERER_URL = process.env.RENDERER_URL || 'http://127.0.0.1:5173';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload.js'),
      // Security
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload file access
      webSecurity: true,
    },
    icon: fs.existsSync(path.join(__dirname, '../../public/icons/icon.png'))
      ? path.join(__dirname, '../../public/icons/icon.png')
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ── Window control IPC ─────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
}

// ── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Initialize SQLite database
  await initDatabase(app.getPath('userData'));

  // Register IPC handlers
  registerProjectHandlers(ipcMain);
  registerAssetHandlers(ipcMain);
  registerDialogHandlers(ipcMain, mainWindow);
  registerDbHandlers(ipcMain, app.getPath('userData'));

  createWindow();

  // Provide app info
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPath', (_event, name: string) =>
    app.getPath(name as Parameters<typeof app.getPath>[0])
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Security: prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith(RENDERER_URL) && !url.startsWith('http://127.0.0.1:5173') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});
