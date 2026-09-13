"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectHandlers = registerProjectHandlers;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PROJECT_MANIFEST = 'project.json';
const PROJECT_DIRS = ['pages', 'assets', 'components', 'exports'];
function registerProjectHandlers(ipcMain) {
    // Create a new project directory structure
    ipcMain.handle('project:create', async (_event, name, directory) => {
        try {
            const projectDir = path_1.default.join(directory, `${name.replace(/[^a-z0-9_-]/gi, '_')}.nova`);
            fs_1.default.mkdirSync(projectDir, { recursive: true });
            for (const dir of PROJECT_DIRS) {
                fs_1.default.mkdirSync(path_1.default.join(projectDir, dir), { recursive: true });
            }
            const manifest = {
                name,
                version: '0.1.0',
                createdAt: new Date().toISOString(),
                pages: ['pages/page-001.json'],
                assets: [],
            };
            fs_1.default.writeFileSync(path_1.default.join(projectDir, PROJECT_MANIFEST), JSON.stringify(manifest, null, 2), 'utf-8');
            return { success: true, path: projectDir };
        }
        catch (e) {
            return { success: false, error: String(e) };
        }
    });
    // Open and read a project
    ipcMain.handle('project:open', async (_event, projectPath) => {
        try {
            const manifestPath = path_1.default.join(projectPath, PROJECT_MANIFEST);
            if (!fs_1.default.existsSync(manifestPath)) {
                return { success: false, error: 'Not a valid Nova project (missing project.json)' };
            }
            const data = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            return { success: true, data };
        }
        catch (e) {
            return { success: false, error: String(e) };
        }
    });
    // Save project data
    ipcMain.handle('project:save', async (_event, projectPath, data) => {
        try {
            const manifestPath = path_1.default.join(projectPath, PROJECT_MANIFEST);
            fs_1.default.writeFileSync(manifestPath, JSON.stringify(data, null, 2), 'utf-8');
            return { success: true };
        }
        catch (e) {
            return { success: false, error: String(e) };
        }
    });
    // Filesystem helpers
    ipcMain.handle('fs:readDirectory', async (_event, directoryPath) => {
        return fs_1.default.readdirSync(directoryPath, { withFileTypes: true })
            .sort((a, b) => {
            if (a.isDirectory() !== b.isDirectory())
                return a.isDirectory() ? -1 : 1;
            return a.name.localeCompare(b.name);
        })
            .map((entry) => ({
            name: entry.name,
            path: path_1.default.join(directoryPath, entry.name),
            isDirectory: entry.isDirectory(),
        }));
    });
    ipcMain.handle('fs:readFile', async (_event, filePath) => {
        return fs_1.default.readFileSync(filePath, 'utf-8');
    });
    ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
        try {
            fs_1.default.writeFileSync(filePath, content, 'utf-8');
            return { success: true };
        }
        catch (e) {
            return { success: false, error: String(e) };
        }
    });
    ipcMain.handle('fs:exists', async (_event, filePath) => {
        return fs_1.default.existsSync(filePath);
    });
    ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
        try {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
            return { success: true };
        }
        catch (e) {
            return { success: false };
        }
    });
}
//# sourceMappingURL=projectHandlers.js.map