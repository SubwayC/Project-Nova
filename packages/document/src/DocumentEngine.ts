import {
  generateId,
  deepClone,
  logger,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_GRID_SIZE,
  DEFAULT_MAJOR_GRID_MULTIPLIER,
  APP_VERSION,
} from '@nova/shared';
import type { ID, Color } from '@nova/shared';
import type {
  Project,
  Page,
  NovaObject,
  NovaObjectType,
  ProjectMetadata,
  ProjectSettings,
  PageBackground,
  PageGrid,
  TextObject,
  RectangleObject,
  CircleObject,
  ImageObject,
  GroupObject,
  ObjectStyle,
  Fill,
} from './types';

// ─── Default Factories ────────────────────────────────────────────────────────

export function createDefaultFill(color: Color = { r: 100, g: 149, b: 237, a: 1 }): Fill {
  return { type: 'solid', color };
}

export function createDefaultStyle(): ObjectStyle {
  return {
    fill: createDefaultFill(),
  };
}

export function createDefaultProjectSettings(): ProjectSettings {
  return {
    defaultPageWidth: DEFAULT_CANVAS_WIDTH,
    defaultPageHeight: DEFAULT_CANVAS_HEIGHT,
    defaultBackgroundColor: '#FFFFFF',
    snapToGrid: true,
    snapToObjects: false,
    gridSize: DEFAULT_GRID_SIZE,
    showGrid: true,
    showGuides: true,
    autoSave: true,
    autoSaveIntervalMs: 30_000,
  };
}

export function createDefaultPage(name = 'Page 1'): Page {
  return {
    id: generateId('page'),
    name,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    background: { type: 'color', color: { r: 255, g: 255, b: 255, a: 1 } },
    grid: {
      enabled: true,
      size: DEFAULT_GRID_SIZE,
      color: { r: 200, g: 200, b: 200, a: 0.5 },
      majorEvery: DEFAULT_MAJOR_GRID_MULTIPLIER,
    },
    objectIds: [],
    objects: {},
  };
}

export function createProject(name: string): Project {
  const now = new Date().toISOString();
  const firstPage = createDefaultPage('Page 1');
  return {
    metadata: {
      id: generateId('proj'),
      name,
      description: '',
      createdAt: now,
      updatedAt: now,
      version: APP_VERSION,
      tags: [],
    },
    pages: [firstPage],
    activePageId: firstPage.id,
    settings: createDefaultProjectSettings(),
    assetIds: [],
    components: {},
    styles: {},
  };
}

// ─── Document Engine ──────────────────────────────────────────────────────────

export type DocumentEngineEvents = {
  'object:created': { pageId: ID; object: NovaObject };
  'object:updated': { pageId: ID; objectId: ID; changes: Partial<NovaObject> };
  'object:deleted': { pageId: ID; objectId: ID };
  'object:reordered': { pageId: ID; objectIds: ID[] };
  'page:added': { page: Page };
  'page:removed': { pageId: ID };
  'page:updated': { pageId: ID; changes: Partial<Page> };
  'project:changed': { project: Project };
};

type Listener<T> = (payload: T) => void;

/**
 * DocumentEngine manages the project document model.
 * It has no dependency on Electron, React, or any UI framework.
 */
export class DocumentEngine {
  private _project: Project;
  private _listeners: Map<string, Set<Listener<unknown>>> = new Map();
  private _isDirty = false;

  constructor(project: Project) {
    this._project = deepClone(project);
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  on<K extends keyof DocumentEngineEvents>(
    event: K,
    listener: Listener<DocumentEngineEvents[K]>
  ): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof DocumentEngineEvents>(
    event: K,
    listener: Listener<DocumentEngineEvents[K]>
  ): void {
    this._listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  private emit<K extends keyof DocumentEngineEvents>(
    event: K,
    payload: DocumentEngineEvents[K]
  ): void {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  }

  // ─── Project ───────────────────────────────────────────────────────────────

  get project(): Project {
    return this._project;
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  markClean(): void {
    this._isDirty = false;
  }

  private touch(): void {
    this._project.metadata.updatedAt = new Date().toISOString();
    this._isDirty = true;
    this.emit('project:changed', { project: this._project });
  }

  // ─── Pages ─────────────────────────────────────────────────────────────────

  getActivePage(): Page | undefined {
    return this._project.pages.find((p) => p.id === this._project.activePageId);
  }

  getPage(pageId: ID): Page | undefined {
    return this._project.pages.find((p) => p.id === pageId);
  }

  addPage(page: Page): void {
    this._project.pages.push(page);
    this._project.activePageId = page.id;
    this.touch();
    this.emit('page:added', { page });
  }

  removePage(pageId: ID): void {
    const index = this._project.pages.findIndex((p) => p.id === pageId);
    if (index === -1) return;
    this._project.pages.splice(index, 1);
    if (this._project.activePageId === pageId && this._project.pages.length > 0) {
      this._project.activePageId = this._project.pages[0]!.id;
    }
    this.touch();
    this.emit('page:removed', { pageId });
  }

  updatePage(pageId: ID, changes: Partial<Omit<Page, 'id' | 'objects' | 'objectIds'>>): void {
    const page = this.getPage(pageId);
    if (!page) return;
    Object.assign(page, changes);
    this.touch();
    this.emit('page:updated', { pageId, changes });
  }

  setActivePage(pageId: ID): void {
    if (!this.getPage(pageId)) return;
    this._project.activePageId = pageId;
    this.emit('project:changed', { project: this._project });
  }

  // ─── Objects ───────────────────────────────────────────────────────────────

  getObject(pageId: ID, objectId: ID): NovaObject | undefined {
    return this.getPage(pageId)?.objects[objectId];
  }

  getObjects(pageId: ID): NovaObject[] {
    const page = this.getPage(pageId);
    if (!page) return [];
    return page.objectIds.map((id) => page.objects[id]).filter(Boolean) as NovaObject[];
  }

  addObject(pageId: ID, object: NovaObject): void {
    const page = this.getPage(pageId);
    if (!page) {
      logger.error(`Page ${pageId} not found`);
      return;
    }
    page.objects[object.id] = object;
    page.objectIds.push(object.id);
    this.touch();
    this.emit('object:created', { pageId, object });
  }

  updateObject(pageId: ID, objectId: ID, changes: Partial<NovaObject>): void {
    const page = this.getPage(pageId);
    if (!page) return;
    const obj = page.objects[objectId];
    if (!obj) return;
    Object.assign(obj, changes);
    this.touch();
    this.emit('object:updated', { pageId, objectId, changes });
  }

  deleteObject(pageId: ID, objectId: ID): NovaObject | undefined {
    const page = this.getPage(pageId);
    if (!page) return undefined;
    const obj = page.objects[objectId];
    if (!obj) return undefined;
    delete page.objects[objectId];
    page.objectIds = page.objectIds.filter((id) => id !== objectId);
    this.touch();
    this.emit('object:deleted', { pageId, objectId });
    return obj;
  }

  reorderObjects(pageId: ID, objectIds: ID[]): void {
    const page = this.getPage(pageId);
    if (!page) return;
    page.objectIds = objectIds;
    this.touch();
    this.emit('object:reordered', { pageId, objectIds });
  }

  moveObjectInStack(pageId: ID, objectId: ID, direction: 'up' | 'down' | 'front' | 'back'): void {
    const page = this.getPage(pageId);
    if (!page) return;
    const idx = page.objectIds.indexOf(objectId);
    if (idx === -1) return;
    const newIds = [...page.objectIds];
    newIds.splice(idx, 1);
    if (direction === 'up') newIds.splice(Math.min(idx + 1, newIds.length), 0, objectId);
    else if (direction === 'down') newIds.splice(Math.max(idx - 1, 0), 0, objectId);
    else if (direction === 'front') newIds.push(objectId);
    else if (direction === 'back') newIds.unshift(objectId);
    this.reorderObjects(pageId, newIds);
  }

  // ─── Serialization ─────────────────────────────────────────────────────────

  serialize(): Project {
    return deepClone(this._project);
  }

  deserialize(project: Project): void {
    this._project = deepClone(project);
    this._isDirty = false;
    this.emit('project:changed', { project: this._project });
  }
}
