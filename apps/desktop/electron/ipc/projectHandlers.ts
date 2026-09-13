import type { IpcMain } from 'electron';
import fs from 'fs';
import path from 'path';

const PROJECT_MANIFEST = 'project.json';
const PROJECT_DIRS = ['pages', 'assets', 'components', 'exports'];

export function registerProjectHandlers(ipcMain: IpcMain): void {
  // Create a new project directory structure
  ipcMain.handle('project:create', async (_event, name: string, directory: string) => {
    try {
      const projectDir = path.join(directory, `${name.replace(/[^a-z0-9_-]/gi, '_')}.nova`);
      fs.mkdirSync(projectDir, { recursive: true });
      for (const dir of PROJECT_DIRS) {
        fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
      }
      const manifest = {
        name,
        version: '0.1.0',
        createdAt: new Date().toISOString(),
        pages: ['pages/page-001.json'],
        assets: [],
      };
      fs.writeFileSync(
        path.join(projectDir, PROJECT_MANIFEST),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );
      return { success: true, path: projectDir };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  // Open and read a project
  ipcMain.handle('project:open', async (_event, projectPath: string) => {
    try {
      const manifestPath = path.join(projectPath, PROJECT_MANIFEST);
      if (!fs.existsSync(manifestPath)) {
        return { success: false, error: 'Not a valid Nova project (missing project.json)' };
      }
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return { success: true, data };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  // Save project data
  ipcMain.handle('project:save', async (_event, projectPath: string, data: unknown) => {
    try {
      const manifestPath = path.join(projectPath, PROJECT_MANIFEST);
      fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  // Filesystem helpers
  ipcMain.handle('fs:readDirectory', async (_event, directoryPath: string) => {
    return fs.readdirSync(directoryPath, { withFileTypes: true })
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((entry) => ({
        name: entry.name,
        path: path.join(directoryPath, entry.name),
        isDirectory: entry.isDirectory(),
      }));
  });

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('fs:exists', async (_event, filePath: string) => {
    return fs.existsSync(filePath);
  });

  ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  });
}
