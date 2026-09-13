import type { ID } from '@nova/shared';
import type { Page, NovaObject } from '@nova/document';

// ─── Viewport ─────────────────────────────────────────────────────────────────

export interface Viewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

// ─── Renderer API ─────────────────────────────────────────────────────────────

/**
 * Abstract rendering API.
 * Implementations: PixiJSRenderer, SVGRenderer, (future) WebGPURenderer.
 * The document model is passed in; the renderer decides how to display it.
 */
export interface RendererAPI {
  /** Initialize the renderer and attach to the given DOM container */
  init(container: HTMLElement): Promise<void>;
  /** Destroy the renderer and clean up resources */
  destroy(): void;
  /** Render a full page */
  renderPage(page: Page, viewport: Viewport): void;
  /** Update a single object (partial re-render) */
  updateObject(object: NovaObject): void;
  /** Remove an object from the rendering layer */
  removeObject(objectId: ID): void;
  /** Set the viewport (zoom + pan) */
  setViewport(viewport: Viewport): void;
  /** Convert screen coordinates to canvas/document coordinates */
  screenToCanvas(screenX: number, screenY: number, viewport: Viewport): { x: number; y: number };
  /** Convert canvas coordinates to screen coordinates */
  canvasToScreen(canvasX: number, canvasY: number, viewport: Viewport): { x: number; y: number };
  /** Resize the rendering surface */
  resize(width: number, height: number): void;
}
