import type { IpcMain, BrowserWindow } from 'electron';
import { dialog } from 'electron';

export function registerDialogHandlers(ipcMain: IpcMain, _mainWindow: BrowserWindow | null): void {
  ipcMain.handle('dialog:openFile', async (_event, options: Electron.OpenDialogOptions) => {
    return dialog.showOpenDialog(options);
  });

  ipcMain.handle('dialog:saveFile', async (_event, options: Electron.SaveDialogOptions) => {
    return dialog.showSaveDialog(options);
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle('dialog:showMessage', async (_event, options: Electron.MessageBoxOptions) => {
    return dialog.showMessageBox(options);
  });
}
