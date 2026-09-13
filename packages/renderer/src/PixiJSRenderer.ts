import {
  Application,
  Container,
  Graphics,
  Text as PixiText,
  TextStyle as PixiTextStyle,
  Sprite,
  Texture,
  Assets,
  ColorSource,
} from 'pixi.js';
import type { ID } from '@nova/shared';
import { colorToNumber, logger } from '@nova/shared';
import type {
  Page,
  NovaObject,
  RectangleObject,
  CircleObject,
  TextObject,
  ImageObject,
  Fill,
  ObjectStyle,
} from '@nova/document';
import type { RendererAPI, Viewport } from './RendererAPI';

// ─── PixiJS Renderer ──────────────────────────────────────────────────────────

/**
 * PixiJS implementation of RendererAPI.
 * Manages a PixiJS Application and maps NovaObjects to Pixi display objects.
 * Completely decoupled from the document model.
 */
export class PixiJSRenderer implements RendererAPI {
  private _app: Application | null = null;
  private _worldContainer: Container | null = null;
  private _pageBackground: Graphics | null = null;
  private _objectContainer: Container | null = null;
  private _gridContainer: Container | null = null;
  /** Map from object ID to Pixi display object */
  private _displayObjects: Map<ID, Container> = new Map();
  private _currentPage: Page | null = null;
  private _viewport: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
  private _containerElement: HTMLElement | null = null;

  async init(container: HTMLElement): Promise<void> {
    this._containerElement = container;
    const app = new Application();
    await app.init({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Attach canvas to container
    container.appendChild(app.canvas as HTMLCanvasElement);
    (app.canvas as HTMLCanvasElement).style.display = 'block';
    (app.canvas as HTMLCanvasElement).style.width = '100%';
    (app.canvas as HTMLCanvasElement).style.height = '100%';

    this._app = app;

    // ── World container (panned/zoomed) ──────────────────────────────────────
    this._worldContainer = new Container();
    app.stage.addChild(this._worldContainer);

    // ── Grid ─────────────────────────────────────────────────────────────────
    this._gridContainer = new Container();
    this._worldContainer.addChild(this._gridContainer);

    // ── Page background ──────────────────────────────────────────────────────
    this._pageBackground = new Graphics();
    this._worldContainer.addChild(this._pageBackground);

    // ── Objects ───────────────────────────────────────────────────────────────
    this._objectContainer = new Container();
    this._worldContainer.addChild(this._objectContainer);

    logger.info('PixiJSRenderer initialized');
  }

  destroy(): void {
    this._displayObjects.clear();
    this._app?.destroy(true, { children: true });
    this._app = null;
    logger.info('PixiJSRenderer destroyed');
  }

  renderPage(page: Page, viewport: Viewport): void {
    if (!this._app || !this._worldContainer) return;
    this._currentPage = page;
    this._viewport = viewport;

    this._applyViewport(viewport);
    this._renderBackground(page);
    this._renderGrid(page);

    // Remove display objects not in this page
    for (const [id] of this._displayObjects) {
      if (!page.objects[id]) {
        this._removeDisplayObject(id);
      }
    }

    // Render all objects in z-order
    for (const id of page.objectIds) {
      const obj = page.objects[id];
      if (obj) this._renderObject(obj);
    }

    // Ensure z-order matches objectIds
    this._syncZOrder(page);
  }

  updateObject(object: NovaObject): void {
    if (!this._objectContainer) return;
    this._renderObject(object);
  }

  removeObject(objectId: ID): void {
    this._removeDisplayObject(objectId);
  }

  setViewport(viewport: Viewport): void {
    this._viewport = viewport;
    this._applyViewport(viewport);
    // Re-render grid when viewport changes
    if (this._currentPage) {
      this._renderGrid(this._currentPage);
    }
  }

  screenToCanvas(screenX: number, screenY: number, viewport: Viewport): { x: number; y: number } {
    return {
      x: (screenX - viewport.offsetX) / viewport.zoom,
      y: (screenY - viewport.offsetY) / viewport.zoom,
    };
  }

  canvasToScreen(canvasX: number, canvasY: number, viewport: Viewport): { x: number; y: number } {
    return {
      x: canvasX * viewport.zoom + viewport.offsetX,
      y: canvasY * viewport.zoom + viewport.offsetY,
    };
  }

  resize(width: number, height: number): void {
    if (!this._app) return;
    this._app.renderer.resize(width, height);
  }

  // ─── Private Rendering Methods ─────────────────────────────────────────────

  private _applyViewport(viewport: Viewport): void {
    if (!this._worldContainer) return;
    this._worldContainer.x = viewport.offsetX;
    this._worldContainer.y = viewport.offsetY;
    this._worldContainer.scale.set(viewport.zoom);
  }

  private _renderBackground(page: Page): void {
    if (!this._pageBackground) return;
    const g = this._pageBackground;
    g.clear();

    // Drop shadow
    g.rect(4, 4, page.width, page.height);
    g.fill({ color: 0x000000, alpha: 0.15 });

    // Page fill
    const bgColor =
      page.background.type === 'color' && page.background.color
        ? colorToNumber(page.background.color)
        : 0xffffff;
    g.rect(0, 0, page.width, page.height);
    g.fill({ color: bgColor, alpha: 1 });
  }

  private _renderGrid(page: Page): void {
    if (!this._gridContainer || !this._app) return;
    const g = this._gridContainer;
    g.removeChildren();
    if (!page.grid.enabled) return;

    const grid = new Graphics();
    const { width, height, grid: gridConfig } = page;
    const { size, majorEvery } = gridConfig;
    const gridColor = colorToNumber(gridConfig.color);
    const gridAlpha = gridConfig.color.a;

    // Minor grid lines
    for (let x = 0; x <= width; x += size) {
      const isMajor = x % (size * majorEvery) === 0;
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
      grid.stroke({ color: gridColor, alpha: isMajor ? gridAlpha * 1.5 : gridAlpha * 0.5, width: isMajor ? 0.5 : 0.25 });
    }
    for (let y = 0; y <= height; y += size) {
      const isMajor = y % (size * majorEvery) === 0;
      grid.moveTo(0, y);
      grid.lineTo(width, y);
      grid.stroke({ color: gridColor, alpha: isMajor ? gridAlpha * 1.5 : gridAlpha * 0.5, width: isMajor ? 0.5 : 0.25 });
    }
    g.addChild(grid);
  }

  private _renderObject(obj: NovaObject): void {
    if (!this._objectContainer) return;
    if (!obj.visible) {
      const existing = this._displayObjects.get(obj.id);
      if (existing) existing.visible = false;
      return;
    }

    let displayObj: Container | null | undefined = this._displayObjects.get(obj.id);
    if (!displayObj) {
      displayObj = this._createDisplayObject(obj);
      if (!displayObj) return;
      this._displayObjects.set(obj.id, displayObj);
      this._objectContainer.addChild(displayObj);
    } else {
      this._updateDisplayObject(displayObj, obj);
    }
  }

  private _createDisplayObject(obj: NovaObject): Container | null {
    switch (obj.type) {
      case 'rectangle':
        return this._createRect(obj as RectangleObject);
      case 'circle':
        return this._createCircle(obj as CircleObject);
      case 'text':
        return this._createText(obj as TextObject);
      case 'image':
        return this._createImage(obj as ImageObject);
      case 'group':
        return new Container();
      default:
        return new Container();
    }
  }

  private _updateDisplayObject(displayObj: Container, obj: NovaObject): void {
    // Update common transform
    displayObj.x = obj.x;
    displayObj.y = obj.y;
    displayObj.alpha = obj.opacity;
    displayObj.visible = obj.visible;
    displayObj.rotation = (obj.rotation * Math.PI) / 180;

    // Type-specific update
    if (obj.type === 'rectangle' && displayObj instanceof Graphics) {
      this._drawRect(displayObj, obj as RectangleObject);
    } else if (obj.type === 'circle' && displayObj instanceof Graphics) {
      this._drawCircle(displayObj, obj as CircleObject);
    } else if (obj.type === 'text') {
      const textObj = obj as TextObject;
      const textDisplay = displayObj.children[0] as PixiText | undefined;
      if (textDisplay instanceof PixiText) {
        textDisplay.text = textObj.content;
        textDisplay.style.fontSize = textObj.textStyle.fontSize;
        textDisplay.style.fill = colorToNumber(textObj.textStyle.color);
        textDisplay.style.fontFamily = textObj.textStyle.fontFamily;
        textDisplay.style.fontWeight = textObj.textStyle.fontWeight as any;
        textDisplay.style.fontStyle = textObj.textStyle.fontStyle;
      }
    }
  }

  private _createRect(obj: RectangleObject): Graphics {
    const g = new Graphics();
    g.x = obj.x;
    g.y = obj.y;
    g.alpha = obj.opacity;
    g.rotation = (obj.rotation * Math.PI) / 180;
    this._drawRect(g, obj);
    return g;
  }

  private _drawRect(g: Graphics, obj: RectangleObject): void {
    g.clear();
    const fillColor = this._getFillColor(obj.style.fill);
    const cornerRadius = obj.style.cornerRadius ?? 0;
    if (cornerRadius > 0) {
      g.roundRect(0, 0, obj.width, obj.height, cornerRadius);
    } else {
      g.rect(0, 0, obj.width, obj.height);
    }
    if (obj.style.fill.type !== 'none') {
      g.fill({ color: fillColor.color, alpha: fillColor.alpha });
    }
    if (obj.style.stroke) {
      const strokeColor = colorToNumber(obj.style.stroke.color);
      g.stroke({ color: strokeColor, alpha: obj.style.stroke.color.a, width: obj.style.stroke.width });
    }
  }

  private _createCircle(obj: CircleObject): Graphics {
    const g = new Graphics();
    g.x = obj.x;
    g.y = obj.y;
    g.alpha = obj.opacity;
    g.rotation = (obj.rotation * Math.PI) / 180;
    this._drawCircle(g, obj);
    return g;
  }

  private _drawCircle(g: Graphics, obj: CircleObject): void {
    g.clear();
    const fillColor = this._getFillColor(obj.style.fill);
    g.ellipse(obj.width / 2, obj.height / 2, obj.width / 2, obj.height / 2);
    if (obj.style.fill.type !== 'none') {
      g.fill({ color: fillColor.color, alpha: fillColor.alpha });
    }
    if (obj.style.stroke) {
      const strokeColor = colorToNumber(obj.style.stroke.color);
      g.stroke({ color: strokeColor, alpha: obj.style.stroke.color.a, width: obj.style.stroke.width });
    }
  }

  private _createText(obj: TextObject): Container {
    const container = new Container();
    container.x = obj.x;
    container.y = obj.y;
    container.alpha = obj.opacity;
    container.rotation = (obj.rotation * Math.PI) / 180;

    const style = new PixiTextStyle({
      fontFamily: obj.textStyle.fontFamily,
      fontSize: obj.textStyle.fontSize,
      fontWeight: obj.textStyle.fontWeight as any,
      fontStyle: obj.textStyle.fontStyle,
      fill: colorToNumber(obj.textStyle.color),
      align: obj.textStyle.textAlign,
      wordWrap: true,
      wordWrapWidth: obj.width,
      lineHeight: obj.textStyle.fontSize * obj.textStyle.lineHeight,
      letterSpacing: obj.textStyle.letterSpacing,
    });

    const text = new PixiText({ text: obj.content, style });
    container.addChild(text);
    return container;
  }

  private _createImage(obj: ImageObject): Container {
    const container = new Container();
    container.x = obj.x;
    container.y = obj.y;
    container.alpha = obj.opacity;
    container.rotation = (obj.rotation * Math.PI) / 180;
    // Image loading is async — a placeholder is shown initially
    const placeholder = new Graphics();
    placeholder.rect(0, 0, obj.width, obj.height);
    placeholder.fill({ color: 0xdddddd });
    placeholder.stroke({ color: 0xaaaaaa, width: 1 });
    container.addChild(placeholder);
    return container;
  }

  private _getFillColor(fill: Fill): { color: number; alpha: number } {
    if (fill.type === 'solid') {
      return { color: colorToNumber(fill.color), alpha: fill.color.a };
    }
    return { color: 0x000000, alpha: 0 };
  }

  private _removeDisplayObject(id: ID): void {
    const obj = this._displayObjects.get(id);
    if (obj) {
      obj.destroy({ children: true });
      this._displayObjects.delete(id);
    }
  }

  private _syncZOrder(page: Page): void {
    if (!this._objectContainer) return;
    for (let i = 0; i < page.objectIds.length; i++) {
      const id = page.objectIds[i];
      if (!id) continue;
      const displayObj = this._displayObjects.get(id);
      if (displayObj) {
        this._objectContainer.addChildAt(displayObj, Math.min(i, this._objectContainer.children.length));
      }
    }
  }
}
