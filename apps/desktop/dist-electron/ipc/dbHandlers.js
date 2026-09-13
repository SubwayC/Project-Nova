"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.registerDbHandlers = registerDbHandlers;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let dbFile = null;
let state = {
    recentProjects: [],
    settings: {},
    nextId: 1,
};
function persistDatabase() {
    if (!dbFile)
        return;
    try {
        const dir = path_1.default.dirname(dbFile);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(dbFile, JSON.stringify(state, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Failed to persist database:', err);
    }
}
async function initDatabase(userDataPath) {
    dbFile = path_1.default.join(userDataPath, 'nova-metadata.json');
    try {
        if (fs_1.default.existsSync(dbFile)) {
            const data = fs_1.default.readFileSync(dbFile, 'utf-8');
            const loaded = JSON.parse(data);
            state = {
                recentProjects: loaded.recentProjects || [],
                settings: loaded.settings || {},
                nextId: loaded.nextId || (loaded.recentProjects?.length ? Math.max(...loaded.recentProjects.map((p) => p.id)) + 1 : 1),
            };
        }
        else {
            persistDatabase();
        }
    }
    catch (err) {
        console.warn('Could not read existing database, re-initializing:', err);
        state = { recentProjects: [], settings: {}, nextId: 1 };
        persistDatabase();
    }
}
function registerDbHandlers(ipcMain, _userDataPath) {
    ipcMain.handle('db:getRecentProjects', () => {
        return [...state.recentProjects]
            .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
            .slice(0, 20);
    });
    ipcMain.handle('db:addRecentProject', (_event, name, projectPath) => {
        const now = new Date().toISOString();
        const existingIndex = state.recentProjects.findIndex((p) => p.path === projectPath);
        const existing = state.recentProjects[existingIndex];
        if (existing) {
            existing.name = name;
            existing.lastOpenedAt = now;
        }
        else {
            state.recentProjects.push({
                id: state.nextId++,
                name,
                path: projectPath,
                lastOpenedAt: now,
            });
        }
        persistDatabase();
    });
    ipcMain.handle('db:removeRecentProject', (_event, projectPath) => {
        state.recentProjects = state.recentProjects.filter((p) => p.path !== projectPath);
        persistDatabase();
    });
    ipcMain.handle('db:getSetting', (_event, key) => {
        return state.settings[key] ?? null;
    });
    ipcMain.handle('db:setSetting', (_event, key, value) => {
        state.settings[key] = value;
        persistDatabase();
    });
}
//# sourceMappingURL=dbHandlers.js.map