import { logger, deepClone, generateId } from '@nova/shared';
import type { ID } from '@nova/shared';
import {
  DocumentEngine,
  createProject,
  createDefaultPage,
  createRectangle,
  createCircle,
  createText,
  createImage,
} from '@nova/document';
import type { Project, Page, NovaObject, NovaObjectType } from '@nova/document';
import {
  HistoryEngine,
  CreateObjectCommand,
  DeleteObjectCommand,
  MoveObjectCommand,
  ResizeObjectCommand,
  RotateObjectCommand,
  ChangePropertyCommand,
  ReorderObjectsCommand,
} from '@nova/history';
import { SelectionSystem, HitTestSystem, TransformSystem, SnappingSystem } from '@nova/interaction';
import type { RendererAPI, Viewport } from '@nova/renderer';
import { AssetManager } from '@nova/assets';

export type ToolMode = 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'pan' | 'line';

export type NovaEngineEvents = {
  'engine:ready': void;
  'engine:destroyed': void;
  'selection:changed': { selectedIds: ID[] };
  'history:changed': { canUndo: boolean; canRedo: boolean };
  'viewport:changed': { viewport: Viewport };
  'tool:changed': { tool: ToolMode };
  'project:changed': { project: Project };
  'object:created': { object: NovaObject };
  'object:deleted': { objectId: ID };
  'object:updated': { object: NovaObject };
};

type EngineListener<T> = (payload: T) => void;

/**
 * NovaEngine — the central orchestrator.
 * Wires together DocumentEngine, HistoryEngine, SelectionSystem,
 * TransformSystem, SnappingSystem, and RendererAPI.
 *
 * No dependency on Electron or React.
 */
export class NovaEngine {
  // Core systems
  readonly document: DocumentEngine;
  readonly history: HistoryEngine;
  readonly selection: SelectionSystem;
  readonly hitTest: HitTestSystem;
  readonly transform: TransformSystem;
  readonly snapping: SnappingSystem;
  readonly assets: AssetManager;

  private _renderer: RendererAPI | null = null;
  private _viewport: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
  private _activeTool: ToolMode = 'select';
  private _listeners: Map<string, Set<EngineListener<unknown>>> = new Map();

  constructor(project?: Project) {
    const initialProject = project ?? createProject('Untitled Project');
    this.document = new DocumentEngine(initialProject);
    this.history = new HistoryEngine();
    this.selection = new SelectionSystem();
    this.hitTest = new HitTestSystem();
    this.transform = new TransformSystem();
    this.snapping = new SnappingSystem();
    this.assets = new AssetManager();

    // Forward document events
    this.document.on('project:changed', ({ project }) => {
      this.emit('project:changed', { project });
    });
    this.document.on('object:created', ({ object }) => {
      this._syncRendererObject(object);
      this.emit('object:created', { object });
    });
    this.document.on('object:updated', ({ objectId, pageId }) => {
      const obj = this.document.getObject(pageId, objectId);
      if (obj) {
        this._syncRendererObject(obj);
        this.emit('object:updated', { object: obj });
      }
    });
    this.document.on('object:deleted', ({ objectId }) => {
      this._renderer?.removeObject(objectId);
      this.emit('object:deleted', { objectId });
    });
    this.document.on('object:reordered', ({ pageId }) => {
      const page = this.document.getPage(pageId);
      if (page) this._renderer?.renderPage(page, this._viewport);
    });

    // Forward history events
    this.history.on('history:changed', ({ canUndo, canRedo }) => {
      this.emit('history:changed', { canUndo, canRedo });
    });
  }

  // ─── Event System ─────────────────────────────────────────────────────────

  on<K extends keyof NovaEngineEvents>(
    event: K,
    listener: EngineListener<NovaEngineEvents[K]>
  ): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(listener as EngineListener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof NovaEngineEvents>(
    event: K,
    listener: EngineListener<NovaEngineEvents[K]>
  ): void {
    this._listeners.get(event)?.delete(listener as EngineListener<unknown>);
  }

  emit<K extends keyof NovaEngineEvents>(event: K, payload: NovaEngineEvents[K]): void {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  }

  // ─── Renderer ─────────────────────────────────────────────────────────────

  async attachRenderer(renderer: RendererAPI, container: HTMLElement): Promise<void> {
    this._renderer = renderer;
    await renderer.init(container);
    // Render the current active page
    const page = this.document.getActivePage();
    if (page) renderer.renderPage(page, this._viewport);
    this.emit('engine:ready', undefined as void);
  }

  detachRenderer(): void {
    this._renderer?.destroy();
    this._renderer = null;
  }

  // ─── Viewport ─────────────────────────────────────────────────────────────

  get viewport(): Viewport {
    return { ...this._viewport };
  }

  setViewport(viewport: Partial<Viewport>): void {
    this._viewport = { ...this._viewport, ...viewport };
    this._renderer?.setViewport(this._viewport);
    this.emit('viewport:changed', { viewport: this._viewport });
  }

  centerViewport(containerWidth: number, containerHeight: number): void {
    const page = this.document.getActivePage();
    if (!page) return;
    const offsetX = (containerWidth - page.width * this._viewport.zoom) / 2;
    const offsetY = (containerHeight - page.height * this._viewport.zoom) / 2;
    this.setViewport({ offsetX, offsetY });
  }

  zoomBy(factor: number, centerX?: number, centerY?: number): void {
    const newZoom = Math.min(50, Math.max(0.05, this._viewport.zoom * factor));
    if (centerX !== undefined && centerY !== undefined) {
      const newOffsetX = centerX - (centerX - this._viewport.offsetX) * (newZoom / this._viewport.zoom);
      const newOffsetY = centerY - (centerY - this._viewport.offsetY) * (newZoom / this._viewport.zoom);
      this.setViewport({ zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY });
    } else {
      this.setViewport({ zoom: newZoom });
    }
  }

  // ─── Tool ─────────────────────────────────────────────────────────────────

  get activeTool(): ToolMode {
    return this._activeTool;
  }

  setTool(tool: ToolMode): void {
    this._activeTool = tool;
    this.emit('tool:changed', { tool });
  }

  // ─── Object Creation ──────────────────────────────────────────────────────

  private _getActivePageId(): ID | null {
    return this.document.project.activePageId;
  }

  createObject(type: NovaObjectType, opts: { x?: number; y?: number; width?: number; height?: number } = {}): NovaObject | null {
    const pageId = this._getActivePageId();
    if (!pageId) return null;

    let obj: NovaObject;
    switch (type) {
      case 'rectangle':
        obj = createRectangle(opts);
        break;
      case 'circle':
        obj = createCircle(opts);
        break;
      case 'text':
        obj = createText(opts);
        break;
      default:
        logger.warn(`Unknown object type: ${type}`);
        return null;
    }

    const cmd = new CreateObjectCommand(this.document, pageId, obj);
    this.history.execute(cmd);
    this.selectObject(obj.id);
    return obj;
  }

  createImageObject(assetId: ID, opts: { x?: number; y?: number; width?: number; height?: number } = {}): NovaObject | null {
    const pageId = this._getActivePageId();
    if (!pageId) return null;
    const obj = createImage({ assetId, ...opts });
    const cmd = new CreateObjectCommand(this.document, pageId, obj);
    this.history.execute(cmd);
    this.selectObject(obj.id);
    return obj;
  }

  deleteSelected(): void {
    const pageId = this._getActivePageId();
    if (!pageId || this.selection.isEmpty) return;
    const ids = [...this.selection.selectedIds];
    const cmd = new DeleteObjectCommand(this.document, pageId, ids);
    this.history.execute(cmd);
    this.selection.deselect();
    this.emit('selection:changed', { selectedIds: [] });
  }

  duplicateSelected(): void {
    const pageId = this._getActivePageId();
    const page = this.document.getActivePage();
    if (!pageId || !page || this.selection.isEmpty) return;

    const newIds: ID[] = [];
    for (const id of this.selection.selectedIds) {
      const obj = this.document.getObject(pageId, id);
      if (!obj) continue;
      const cloned = deepClone(obj);
      cloned.id = generateId(obj.type);
      cloned.x += 20;
      cloned.y += 20;
      cloned.name = `${obj.name} copy`;
      const cmd = new CreateObjectCommand(this.document, pageId, cloned);
      this.history.execute(cmd);
      newIds.push(cloned.id);
    }
    this.selection.selectMultiple(newIds);
    this.emit('selection:changed', { selectedIds: newIds });
  }

  // ─── Object Mutation ──────────────────────────────────────────────────────

  moveObject(objectId: ID, newX: number, newY: number): void {
    const pageId = this._getActivePageId();
    const page = this.document.getActivePage();
    if (!pageId || !page) return;
    const obj = this.document.getObject(pageId, objectId);
    if (!obj) return;
    const cmd = new MoveObjectCommand(this.document, pageId, objectId, newX, newY, obj.x, obj.y);
    this.history.execute(cmd);
  }

  resizeObject(objectId: ID, newBounds: { x: number; y: number; width: number; height: number }): void {
    const pageId = this._getActivePageId();
    const page = this.document.getActivePage();
    if (!pageId || !page) return;
    const obj = this.document.getObject(pageId, objectId);
    if (!obj) return;
    const oldBounds = { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
    const cmd = new ResizeObjectCommand(this.document, pageId, objectId, newBounds, oldBounds);
    this.history.execute(cmd);
  }

  rotateObject(objectId: ID, newRotation: number): void {
    const pageId = this._getActivePageId();
    const page = this.document.getActivePage();
    if (!pageId || !page) return;
    const obj = this.document.getObject(pageId, objectId);
    if (!obj) return;
    const cmd = new RotateObjectCommand(this.document, pageId, objectId, newRotation, obj.rotation);
    this.history.execute(cmd);
  }

  updateObjectProperty<T extends Partial<NovaObject>>(
    objectId: ID,
    newProps: T,
    description?: string
  ): void {
    const pageId = this._getActivePageId();
    const page = this.document.getActivePage();
    if (!pageId || !page) return;
    const obj = this.document.getObject(pageId, objectId);
    if (!obj) return;
    const oldProps: T = {} as T;
    for (const key of Object.keys(newProps)) {
      (oldProps as Record<string, unknown>)[key] = (obj as unknown as Record<string, unknown>)[key];
    }
    const cmd = new ChangePropertyCommand(this.document, pageId, objectId, newProps, oldProps, description);
    this.history.execute(cmd);
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  selectObject(id: ID): void {
    this.selection.select(id);
    this.emit('selection:changed', { selectedIds: this.selection.selectedIds });
  }

  toggleSelectObject(id: ID): void {
    this.selection.toggleSelection(id);
    this.emit('selection:changed', { selectedIds: this.selection.selectedIds });
  }

  clearSelection(): void {
    this.selection.deselect();
    this.emit('selection:changed', { selectedIds: [] });
  }

  selectAll(): void {
    const page = this.document.getActivePage();
    if (!page) return;
    this.selection.selectMultiple(page.objectIds);
    this.emit('selection:changed', { selectedIds: this.selection.selectedIds });
  }

  // ─── History ──────────────────────────────────────────────────────────────

  undo(): void {
    this.history.undo();
  }

  redo(): void {
    this.history.redo();
  }

  // ─── Pages ────────────────────────────────────────────────────────────────

  addPage(): Page {
    const pageCount = this.document.project.pages.length;
    const page = createDefaultPage(`Page ${pageCount + 1}`);
    this.document.addPage(page);
    this.clearSelection();
    return page;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private _syncRendererObject(obj: NovaObject): void {
    if (!this._renderer) return;
    this._renderer.updateObject(obj);
  }

  // ─── Coordinate Utilities ─────────────────────────────────────────────────

  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    if (!this._renderer) {
      return {
        x: (screenX - this._viewport.offsetX) / this._viewport.zoom,
        y: (screenY - this._viewport.offsetY) / this._viewport.zoom,
      };
    }
    return this._renderer.screenToCanvas(screenX, screenY, this._viewport);
  }
}
