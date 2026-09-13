"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAssetHandlers = registerAssetHandlers;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function registerAssetHandlers(ipcMain) {
    // Copy asset files into the project's assets folder
    ipcMain.handle('assets:import', async (_event, sourcePaths, projectAssetsDir) => {
        const results = [];
        for (const sourcePath of sourcePaths) {
            try {
                const fileName = path_1.default.basename(sourcePath);
                const destPath = path_1.default.join(projectAssetsDir, fileName);
                fs_1.default.copyFileSync(sourcePath, destPath);
                results.push({
                    success: true,
                    relativePath: `assets/${fileName}`,
                    name: path_1.default.parse(fileName).name,
                });
            }
            catch (e) {
                results.push({ success: false, error: String(e) });
            }
        }
        return results;
    });
    // Read an asset file as a data URL
    ipcMain.handle('assets:readFile', async (_event, absolutePath) => {
        try {
            const buffer = fs_1.default.readFileSync(absolutePath);
            const ext = path_1.default.extname(absolutePath).toLowerCase().slice(1);
            const mimeTypes = {
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                webp: 'image/webp',
                svg: 'image/svg+xml',
                avif: 'image/avif',
            };
            const mime = mimeTypes[ext] ?? 'application/octet-stream';
            return `data:${mime};base64,${buffer.toString('base64')}`;
        }
        catch (e) {
            return '';
        }
    });
}
//# sourceMappingURL=assetHandlers.js.map