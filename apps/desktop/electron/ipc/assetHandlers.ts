import type { IpcMain } from 'electron';
import fs from 'fs';
import path from 'path';

export function registerAssetHandlers(ipcMain: IpcMain): void {
  // Copy asset files into the project's assets folder
  ipcMain.handle(
    'assets:import',
    async (_event, sourcePaths: string[], projectAssetsDir: string) => {
      const results = [];
      for (const sourcePath of sourcePaths) {
        try {
          const fileName = path.basename(sourcePath);
          const destPath = path.join(projectAssetsDir, fileName);
          fs.copyFileSync(sourcePath, destPath);
          results.push({
            success: true,
            relativePath: `assets/${fileName}`,
            name: path.parse(fileName).name,
          });
        } catch (e) {
          results.push({ success: false, error: String(e) });
        }
      }
      return results;
    }
  );

  // Read an asset file as a data URL
  ipcMain.handle('assets:readFile', async (_event, absolutePath: string) => {
    try {
      const buffer = fs.readFileSync(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase().slice(1);
      const mimeTypes: Record<string, string> = {
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
    } catch (e) {
      return '';
    }
  });
}
