"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDialogHandlers = registerDialogHandlers;
const electron_1 = require("electron");
function registerDialogHandlers(ipcMain, _mainWindow) {
    ipcMain.handle('dialog:openFile', async (_event, options) => {
        return electron_1.dialog.showOpenDialog(options);
    });
    ipcMain.handle('dialog:saveFile', async (_event, options) => {
        return electron_1.dialog.showSaveDialog(options);
    });
    ipcMain.handle('dialog:openDirectory', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
        });
        return result.canceled ? null : (result.filePaths[0] ?? null);
    });
    ipcMain.handle('dialog:showMessage', async (_event, options) => {
        return electron_1.dialog.showMessageBox(options);
    });
}
//# sourceMappingURL=dialogHandlers.js.map