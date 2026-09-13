import type { IpcMain } from 'electron';
import path from 'path';
import fs from 'fs';

interface RecentProject {
  id: number;
  name: string;
  path: string;
  lastOpenedAt: string;
}

interface NovaDatabaseState {
  recentProjects: RecentProject[];
  settings: Record<string, string>;
  nextId: number;
}

let dbFile: string | null = null;
let state: NovaDatabaseState = {
  recentProjects: [],
  settings: {},
  nextId: 1,
};

function persistDatabase(): void {
  if (!dbFile) return;
  try {
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

export async function initDatabase(userDataPath: string): Promise<void> {
  dbFile = path.join(userDataPath, 'nova-metadata.json');
  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf-8');
      const loaded = JSON.parse(data);
      state = {
        recentProjects: loaded.recentProjects || [],
        settings: loaded.settings || {},
        nextId: loaded.nextId || (loaded.recentProjects?.length ? Math.max(...loaded.recentProjects.map((p: RecentProject) => p.id)) + 1 : 1),
      };
    } else {
      persistDatabase();
    }
  } catch (err) {
    console.warn('Could not read existing database, re-initializing:', err);
    state = { recentProjects: [], settings: {}, nextId: 1 };
    persistDatabase();
  }
}

export function registerDbHandlers(ipcMain: IpcMain, _userDataPath: string): void {
  ipcMain.handle('db:getRecentProjects', () => {
    return [...state.recentProjects]
      .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
      .slice(0, 20);
  });

  ipcMain.handle('db:addRecentProject', (_event, name: string, projectPath: string) => {
    const now = new Date().toISOString();
    const existingIndex = state.recentProjects.findIndex((p) => p.path === projectPath);
    const existing = state.recentProjects[existingIndex];
    if (existing) {
      existing.name = name;
      existing.lastOpenedAt = now;
    } else {
      state.recentProjects.push({
        id: state.nextId++,
        name,
        path: projectPath,
        lastOpenedAt: now,
      });
    }
    persistDatabase();
  });

  ipcMain.handle('db:removeRecentProject', (_event, projectPath: string) => {
    state.recentProjects = state.recentProjects.filter((p) => p.path !== projectPath);
    persistDatabase();
  });

  ipcMain.handle('db:getSetting', (_event, key: string) => {
    return state.settings[key] ?? null;
  });

  ipcMain.handle('db:setSetting', (_event, key: string, value: string) => {
    state.settings[key] = value;
    persistDatabase();
  });
}
