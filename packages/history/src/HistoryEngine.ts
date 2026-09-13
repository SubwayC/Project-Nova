import type { ID } from '@nova/shared';
import { MAX_HISTORY_SIZE, logger } from '@nova/shared';
import type { DocumentEngine } from '@nova/document';
import type { NovaObject, Page } from '@nova/document';

// ─── Command Interface ────────────────────────────────────────────────────────

export interface Command {
  /** Human-readable description for history panel */
  readonly description: string;
  execute(): void;
  undo(): void;
  /** Optional: merge with previous command for batching */
  canMergeWith?(other: Command): boolean;
  mergeWith?(other: Command): Command;
}

// ─── History Engine ───────────────────────────────────────────────────────────

export type HistoryEngineEvents = {
  'history:changed': { canUndo: boolean; canRedo: boolean; description?: string };
};

type HistoryListener<T> = (payload: T) => void;

export class HistoryEngine {
  private _undoStack: Command[] = [];
  private _redoStack: Command[] = [];
  private _listeners: Map<string, Set<HistoryListener<unknown>>> = new Map();
  private _maxSize: number;
  private _isExecuting = false;

  constructor(maxSize = MAX_HISTORY_SIZE) {
    this._maxSize = maxSize;
  }

  on<K extends keyof HistoryEngineEvents>(
    event: K,
    listener: HistoryListener<HistoryEngineEvents[K]>
  ): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(listener as HistoryListener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof HistoryEngineEvents>(
    event: K,
    listener: HistoryListener<HistoryEngineEvents[K]>
  ): void {
    this._listeners.get(event)?.delete(listener as HistoryListener<unknown>);
  }

  private emit<K extends keyof HistoryEngineEvents>(
    event: K,
    payload: HistoryEngineEvents[K]
  ): void {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  get undoDescription(): string | undefined {
    return this._undoStack[this._undoStack.length - 1]?.description;
  }

  get redoDescription(): string | undefined {
    return this._redoStack[this._redoStack.length - 1]?.description;
  }

  /** Execute a command and push it to the undo stack */
  execute(command: Command): void {
    if (this._isExecuting) return;
    this._isExecuting = true;
    try {
      command.execute();
      // Try to merge with top of undo stack
      const top = this._undoStack[this._undoStack.length - 1];
      if (top && command.canMergeWith?.(top)) {
        this._undoStack[this._undoStack.length - 1] = command.mergeWith!(top);
      } else {
        this._undoStack.push(command);
      }
      // Trim if over limit
      if (this._undoStack.length > this._maxSize) {
        this._undoStack.shift();
      }
      // Clear redo stack on new action
      this._redoStack = [];
    } catch (e) {
      logger.error('Command execution failed', e);
    } finally {
      this._isExecuting = false;
      this.notify();
    }
  }

  undo(): void {
    const command = this._undoStack.pop();
    if (!command) return;
    try {
      command.undo();
      this._redoStack.push(command);
    } catch (e) {
      logger.error('Undo failed', e);
    }
    this.notify();
  }

  redo(): void {
    const command = this._redoStack.pop();
    if (!command) return;
    try {
      command.execute();
      this._undoStack.push(command);
    } catch (e) {
      logger.error('Redo failed', e);
    }
    this.notify();
  }

  clear(): void {
    this._undoStack = [];
    this._redoStack = [];
    this.notify();
  }

  private notify(): void {
    this.emit('history:changed', {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      description: this.undoDescription,
    });
  }
}

// ─── Concrete Commands ────────────────────────────────────────────────────────

export class CreateObjectCommand implements Command {
  readonly description: string;
  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private object: NovaObject
  ) {
    this.description = `Create ${object.type}`;
  }
  execute(): void {
    this.doc.addObject(this.pageId, this.object);
  }
  undo(): void {
    this.doc.deleteObject(this.pageId, this.object.id);
  }
}

export class DeleteObjectCommand implements Command {
  readonly description: string;
  private _deletedObjects: NovaObject[] = [];

  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private objectIds: ID[]
  ) {
    this.description = `Delete ${objectIds.length > 1 ? `${objectIds.length} objects` : 'object'}`;
  }

  execute(): void {
    this._deletedObjects = [];
    for (const id of this.objectIds) {
      const obj = this.doc.deleteObject(this.pageId, id);
      if (obj) this._deletedObjects.push(obj);
    }
  }

  undo(): void {
    for (const obj of this._deletedObjects) {
      this.doc.addObject(this.pageId, obj);
    }
  }
}

export class MoveObjectCommand implements Command {
  readonly description = 'Move';
  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private objectId: ID,
    private newX: number,
    private newY: number,
    private oldX: number,
    private oldY: number
  ) {}
  execute(): void {
    this.doc.updateObject(this.pageId, this.objectId, { x: this.newX, y: this.newY } as Partial<NovaObject>);
  }
  undo(): void {
    this.doc.updateObject(this.pageId, this.objectId, { x: this.oldX, y: this.oldY } as Partial<NovaObject>);
  }
  canMergeWith(other: Command): boolean {
    return (
      other instanceof MoveObjectCommand &&
      other.objectId === this.objectId &&
      other.pageId === this.pageId
    );
  }
  mergeWith(other: MoveObjectCommand): Command {
    return new MoveObjectCommand(
      this.doc,
      this.pageId,
      this.objectId,
      this.newX,
      this.newY,
      other.oldX,
      other.oldY
    );
  }
}

export class ResizeObjectCommand implements Command {
  readonly description = 'Resize';
  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private objectId: ID,
    private newBounds: { x: number; y: number; width: number; height: number },
    private oldBounds: { x: number; y: number; width: number; height: number }
  ) {}
  execute(): void {
    this.doc.updateObject(this.pageId, this.objectId, this.newBounds as Partial<NovaObject>);
  }
  undo(): void {
    this.doc.updateObject(this.pageId, this.objectId, this.oldBounds as Partial<NovaObject>);
  }
}

export class RotateObjectCommand implements Command {
  readonly description = 'Rotate';
  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private objectId: ID,
    private newRotation: number,
    private oldRotation: number
  ) {}
  execute(): void {
    this.doc.updateObject(this.pageId, this.objectId, { rotation: this.newRotation } as Partial<NovaObject>);
  }
  undo(): void {
    this.doc.updateObject(this.pageId, this.objectId, { rotation: this.oldRotation } as Partial<NovaObject>);
  }
}

export class ChangePropertyCommand<T extends Partial<NovaObject>> implements Command {
  readonly description: string;
  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private objectId: ID,
    private newProps: T,
    private oldProps: T,
    description?: string
  ) {
    this.description = description ?? 'Change property';
  }
  execute(): void {
    this.doc.updateObject(this.pageId, this.objectId, this.newProps);
  }
  undo(): void {
    this.doc.updateObject(this.pageId, this.objectId, this.oldProps);
  }
}

export class ReorderObjectsCommand implements Command {
  readonly description = 'Reorder layers';
  constructor(
    private doc: DocumentEngine,
    private pageId: ID,
    private newOrder: ID[],
    private oldOrder: ID[]
  ) {}
  execute(): void {
    this.doc.reorderObjects(this.pageId, this.newOrder);
  }
  undo(): void {
    this.doc.reorderObjects(this.pageId, this.oldOrder);
  }
}
