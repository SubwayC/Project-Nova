import type { ID } from '@nova/shared';
import { getBoundingBox } from '@nova/shared';
import type { Bounds, Vector2 } from '@nova/shared';
import type { NovaObject, Page } from '@nova/document';

// ─── Selection System ─────────────────────────────────────────────────────────

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0 for multi-select
}

export class SelectionSystem {
  private _selectedIds: Set<ID> = new Set();

  get selectedIds(): ID[] {
    return Array.from(this._selectedIds);
  }

  get isEmpty(): boolean {
    return this._selectedIds.size === 0;
  }

  get count(): number {
    return this._selectedIds.size;
  }

  select(id: ID): void {
    this._selectedIds.clear();
    this._selectedIds.add(id);
  }

  addToSelection(id: ID): void {
    this._selectedIds.add(id);
  }

  removeFromSelection(id: ID): void {
    this._selectedIds.delete(id);
  }

  toggleSelection(id: ID): void {
    if (this._selectedIds.has(id)) {
      this._selectedIds.delete(id);
    } else {
      this._selectedIds.add(id);
    }
  }

  selectMultiple(ids: ID[]): void {
    this._selectedIds = new Set(ids);
  }

  deselect(): void {
    this._selectedIds.clear();
  }

  isSelected(id: ID): boolean {
    return this._selectedIds.has(id);
  }

  /** Compute the combined bounding box of selected objects */
  getSelectionBounds(page: Page): SelectionBounds | null {
    if (this._selectedIds.size === 0) return null;
    const objects = Array.from(this._selectedIds)
      .map((id) => page.objects[id])
      .filter(Boolean) as NovaObject[];
    if (objects.length === 0) return null;
    if (objects.length === 1) {
      const obj = objects[0]!;
      return { x: obj.x, y: obj.y, width: obj.width, height: obj.height, rotation: obj.rotation };
    }
    const bounds = getBoundingBox(
      objects.map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }))
    );
    if (!bounds) return null;
    return { ...bounds, rotation: 0 };
  }
}

// ─── Hit Test ─────────────────────────────────────────────────────────────────

export class HitTestSystem {
  /**
   * Returns the topmost object that contains the point, in reverse z-order.
   */
  hitTest(page: Page, point: Vector2): NovaObject | null {
    // Iterate from top (end) to bottom (start)
    const ids = [...page.objectIds].reverse();
    for (const id of ids) {
      const obj = page.objects[id];
      if (!obj || !obj.visible || obj.locked) continue;
      if (this.pointInObject(obj, point)) return obj;
    }
    return null;
  }

  /**
   * Returns all objects within the given area rectangle.
   */
  areaSelect(page: Page, area: Bounds): NovaObject[] {
    return page.objectIds
      .map((id) => page.objects[id])
      .filter((obj): obj is NovaObject => {
        if (!obj || !obj.visible) return false;
        return this.objectInArea(obj, area);
      });
  }

  private pointInObject(obj: NovaObject, point: Vector2): boolean {
    // Simple AABB test (no rotation handling yet — rotation handled in renderer)
    return (
      point.x >= obj.x &&
      point.x <= obj.x + obj.width &&
      point.y >= obj.y &&
      point.y <= obj.y + obj.height
    );
  }

  private objectInArea(obj: NovaObject, area: Bounds): boolean {
    // Object must be entirely within area for strict selection
    return (
      obj.x >= area.x &&
      obj.y >= area.y &&
      obj.x + obj.width <= area.x + area.width &&
      obj.y + obj.height <= area.y + area.height
    );
  }
}

// ─── Handle Types ─────────────────────────────────────────────────────────────

export type HandleType =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotation';

export interface Handle {
  type: HandleType;
  x: number;
  y: number;
  cursor: string;
}

// ─── Transform System ─────────────────────────────────────────────────────────

const HANDLE_SIZE = 8;
const ROTATION_OFFSET = 24;

export class TransformSystem {
  /**
   * Compute the 9 handles (8 resize + 1 rotate) for a selection bounds.
   */
  getHandles(bounds: SelectionBounds): Handle[] {
    const { x, y, width, height } = bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;

    return [
      { type: 'nw', x, y, cursor: 'nwse-resize' },
      { type: 'n', x: cx, y, cursor: 'ns-resize' },
      { type: 'ne', x: x + width, y, cursor: 'nesw-resize' },
      { type: 'e', x: x + width, y: cy, cursor: 'ew-resize' },
      { type: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
      { type: 's', x: cx, y: y + height, cursor: 'ns-resize' },
      { type: 'sw', x, y: y + height, cursor: 'nesw-resize' },
      { type: 'w', x, y: cy, cursor: 'ew-resize' },
      { type: 'rotation', x: cx, y: y - ROTATION_OFFSET, cursor: 'crosshair' },
    ];
  }

  /**
   * Determine which handle (if any) a point hits.
   */
  hitTestHandle(handles: Handle[], point: Vector2, zoom = 1): HandleType | null {
    const hitRadius = (HANDLE_SIZE * 2) / zoom;
    for (const handle of handles) {
      const dx = point.x - handle.x;
      const dy = point.y - handle.y;
      if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
        return handle.type;
      }
    }
    return null;
  }

  /**
   * Compute new bounds when dragging a handle.
   */
  applyResize(
    original: { x: number; y: number; width: number; height: number },
    handle: HandleType,
    delta: Vector2,
    maintainAspectRatio = false
  ): { x: number; y: number; width: number; height: number } {
    let { x, y, width, height } = original;
    const aspectRatio = width / height;

    switch (handle) {
      case 'nw':
        x += delta.x;
        y += delta.y;
        width -= delta.x;
        height -= delta.y;
        break;
      case 'n':
        y += delta.y;
        height -= delta.y;
        break;
      case 'ne':
        y += delta.y;
        width += delta.x;
        height -= delta.y;
        break;
      case 'e':
        width += delta.x;
        break;
      case 'se':
        width += delta.x;
        height += delta.y;
        break;
      case 's':
        height += delta.y;
        break;
      case 'sw':
        x += delta.x;
        width -= delta.x;
        height += delta.y;
        break;
      case 'w':
        x += delta.x;
        width -= delta.x;
        break;
    }

    if (maintainAspectRatio) {
      if (Math.abs(delta.x) > Math.abs(delta.y)) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    }

    // Minimum size guard
    width = Math.max(1, width);
    height = Math.max(1, height);

    return { x, y, width, height };
  }
}

// ─── Snapping System ──────────────────────────────────────────────────────────

export class SnappingSystem {
  private _gridSize: number;
  private _snapToGrid: boolean;
  private _threshold: number;

  constructor(gridSize = 8, snapToGrid = true, threshold = 6) {
    this._gridSize = gridSize;
    this._snapToGrid = snapToGrid;
    this._threshold = threshold;
  }

  set gridSize(v: number) {
    this._gridSize = v;
  }
  set snapToGrid(v: boolean) {
    this._snapToGrid = v;
  }

  snapPoint(point: Vector2): Vector2 {
    if (!this._snapToGrid) return point;
    return {
      x: Math.round(point.x / this._gridSize) * this._gridSize,
      y: Math.round(point.y / this._gridSize) * this._gridSize,
    };
  }
}
