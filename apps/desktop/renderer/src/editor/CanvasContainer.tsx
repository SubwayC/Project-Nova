import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PixiJSRenderer } from '@nova/renderer';
import { useEngineStore } from '../stores/useEngineStore';
import { useEditorStore } from '../stores/useEditorStore';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useProjectStore } from '../stores/useProjectStore';
import { SelectionOverlay } from './SelectionOverlay';
import { useContextMenu } from '../ui/ContextMenu';
import { clamp } from '@nova/shared';

type DragState =
  | { type: 'none' }
  | { type: 'pan'; startX: number; startY: number; startOffsetX: number; startOffsetY: number }
  | { type: 'move'; objectId: string; startCanvasX: number; startCanvasY: number; startObjX: number; startObjY: number }
  | { type: 'marquee'; startCanvasX: number; startCanvasY: number; endCanvasX: number; endCanvasY: number }
  | { type: 'draw'; startCanvasX: number; startCanvasY: number; endCanvasX: number; endCanvasY: number };

export function CanvasContainer(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PixiJSRenderer | null>(null);
  const rendererMountedRef = useRef(false);
  const dragRef = useRef<DragState>({ type: 'none' });
  const [marqueeBounds, setMarqueeBounds] = useState<{
    x: number; y: number; w: number; h: number;
  } | null>(null);

  const { getEngine, engine } = useEngineStore();
  const { showMenu } = useContextMenu();
  const { activeTool, zoom, offsetX, offsetY } = useEditorStore();
  const { selectedIds, setSelection, setSelectionBounds, clearSelection } = useSelectionStore();
  const { pages, activePageId } = useProjectStore();

  // ── Initialize Renderer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || rendererMountedRef.current) return;
    rendererMountedRef.current = true;

    const renderer = new PixiJSRenderer();
    rendererRef.current = renderer;

    let engineInstance: ReturnType<typeof getEngine>;
    try {
      engineInstance = getEngine();
    } catch {
      return;
    }

    engineInstance.attachRenderer(renderer, containerRef.current).then(() => {
      // Initial viewport center
      const container = containerRef.current!;
      engineInstance.centerViewport(container.clientWidth, container.clientHeight);
      const vp = engineInstance.viewport;
      useEditorStore.getState().setViewport({ zoom: vp.zoom, offsetX: vp.offsetX, offsetY: vp.offsetY });

      // Listen for engine events
      engineInstance.on('selection:changed', ({ selectedIds }) => {
        const page = engineInstance.document.getActivePage();
        if (!page) return;
        const objects = selectedIds.map((id) => page.objects[id]).filter(Boolean) as any[];
        setSelection(selectedIds, objects);

        // Compute selection bounds
        if (selectedIds.length > 0) {
          const bounds = engineInstance.selection.getSelectionBounds(page);
          setSelectionBounds(bounds);
        } else {
          setSelectionBounds(null);
        }
      });

      engineInstance.on('viewport:changed', ({ viewport }) => {
        useEditorStore.getState().setViewport({ zoom: viewport.zoom, offsetX: viewport.offsetX, offsetY: viewport.offsetY });
      });
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      renderer.resize(clientWidth, clientHeight);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      engineInstance.detachRenderer();
      rendererMountedRef.current = false;
      rendererRef.current = null;
    };
  }, []);

  // ── Re-render page when project changes ──────────────────────────────────────
  useEffect(() => {
    if (!rendererRef.current || !activePageId) return;
    try {
      const engineInstance = getEngine();
      const page = engineInstance.document.getActivePage();
      if (page) {
        rendererRef.current.renderPage(page, engineInstance.viewport);
      }
    } catch {}
  }, [pages, activePageId]);

  // ── Mouse event handlers ──────────────────────────────────────────────────────

  const getCanvasPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    try {
      return getEngine().screenToCanvas(screenX, screenY);
    } catch {
      return { x: screenX, y: screenY };
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const container = containerRef.current;
    if (!container) return;

    let engineInstance: ReturnType<typeof getEngine>;
    try { engineInstance = getEngine(); } catch { return; }

    const currentTool = useEditorStore.getState().activeTool;
    const canvasPos = getCanvasPos(e);
    const vp = engineInstance.viewport;

    // Middle mouse or space+drag = pan
    if (e.button === 1 || currentTool === 'pan') {
      dragRef.current = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: vp.offsetX,
        startOffsetY: vp.offsetY,
      };
      container.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }

    // Drawing tools
    if (currentTool !== 'select') {
      dragRef.current = {
        type: 'draw',
        startCanvasX: canvasPos.x,
        startCanvasY: canvasPos.y,
        endCanvasX: canvasPos.x,
        endCanvasY: canvasPos.y,
      };
      return;
    }

    // Select tool: hit test
    const page = engineInstance.document.getActivePage();
    if (!page) return;

    const hit = engineInstance.hitTest.hitTest(page, canvasPos);
    if (hit) {
      if (e.shiftKey || e.ctrlKey) {
        engineInstance.toggleSelectObject(hit.id);
      } else {
        if (!engineInstance.selection.isSelected(hit.id)) {
          engineInstance.selectObject(hit.id);
        }
        // Prepare for move
        dragRef.current = {
          type: 'move',
          objectId: hit.id,
          startCanvasX: canvasPos.x,
          startCanvasY: canvasPos.y,
          startObjX: hit.x,
          startObjY: hit.y,
        };
      }
    } else {
      // Deselect and start marquee
      engineInstance.clearSelection();
      dragRef.current = {
        type: 'marquee',
        startCanvasX: canvasPos.x,
        startCanvasY: canvasPos.y,
        endCanvasX: canvasPos.x,
        endCanvasY: canvasPos.y,
      };
    }
  }, [getCanvasPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag.type === 'none') return;

    let engineInstance: ReturnType<typeof getEngine>;
    try { engineInstance = getEngine(); } catch { return; }

    if (drag.type === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      engineInstance.setViewport({
        offsetX: drag.startOffsetX + dx,
        offsetY: drag.startOffsetY + dy,
      });
    } else if (drag.type === 'move') {
      const canvasPos = getCanvasPos(e);
      const dx = canvasPos.x - drag.startCanvasX;
      const dy = canvasPos.y - drag.startCanvasY;
      const newX = drag.startObjX + dx;
      const newY = drag.startObjY + dy;
      // Live update (no history yet, will commit on mouseup)
      const pageId = engineInstance.document.project.activePageId;
      engineInstance.document.updateObject(pageId, drag.objectId, { x: newX, y: newY } as any);

      // Update selection bounds
      const page = engineInstance.document.getActivePage();
      if (page) setSelectionBounds(engineInstance.selection.getSelectionBounds(page));
    } else if (drag.type === 'marquee') {
      const canvasPos = getCanvasPos(e);
      (drag as any).endCanvasX = canvasPos.x;
      (drag as any).endCanvasY = canvasPos.y;

      // Compute screen-space marquee for overlay
      const vp = engineInstance.viewport;
      const sx1 = drag.startCanvasX * vp.zoom + vp.offsetX;
      const sy1 = drag.startCanvasY * vp.zoom + vp.offsetY;
      const sx2 = canvasPos.x * vp.zoom + vp.offsetX;
      const sy2 = canvasPos.y * vp.zoom + vp.offsetY;
      setMarqueeBounds({
        x: Math.min(sx1, sx2),
        y: Math.min(sy1, sy2),
        w: Math.abs(sx2 - sx1),
        h: Math.abs(sy2 - sy1),
      });
    } else if (drag.type === 'draw') {
      const canvasPos = getCanvasPos(e);
      (drag as any).endCanvasX = canvasPos.x;
      (drag as any).endCanvasY = canvasPos.y;
    }
  }, [getCanvasPos]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (container) container.style.cursor = '';

    let engineInstance: ReturnType<typeof getEngine>;
    try { engineInstance = getEngine(); } catch { dragRef.current = { type: 'none' }; return; }

    if (drag.type === 'move') {
      const canvasPos = getCanvasPos(e);
      const dx = canvasPos.x - drag.startCanvasX;
      const dy = canvasPos.y - drag.startCanvasY;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        // Commit to history
        const newX = drag.startObjX + dx;
        const newY = drag.startObjY + dy;
        // First undo the live update
        const pageId = engineInstance.document.project.activePageId;
        engineInstance.document.updateObject(pageId, drag.objectId, { x: drag.startObjX, y: drag.startObjY } as any);
        // Now use the proper command
        engineInstance.moveObject(drag.objectId, newX, newY);
      }
    } else if (drag.type === 'marquee') {
      setMarqueeBounds(null);
      const d = drag;
      const page = engineInstance.document.getActivePage();
      if (!page) { dragRef.current = { type: 'none' }; return; }
      const minX = Math.min(d.startCanvasX, d.endCanvasX);
      const minY = Math.min(d.startCanvasY, d.endCanvasY);
      const maxX = Math.max(d.startCanvasX, d.endCanvasX);
      const maxY = Math.max(d.startCanvasY, d.endCanvasY);
      if (maxX - minX > 4 && maxY - minY > 4) {
        const area = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        const hits = engineInstance.hitTest.areaSelect(page, area);
        if (hits.length > 0) {
          engineInstance.selection.selectMultiple(hits.map((h) => h.id));
          const objects = hits.map((h) => page.objects[h.id]).filter(Boolean) as any[];
          setSelection(hits.map((h) => h.id), objects);
          setSelectionBounds(engineInstance.selection.getSelectionBounds(page));
        }
      }
    } else if (drag.type === 'draw') {
      const d = drag;
      const minX = Math.min(d.startCanvasX, d.endCanvasX);
      const minY = Math.min(d.startCanvasY, d.endCanvasY);
      const w = Math.abs(d.endCanvasX - d.startCanvasX);
      const h = Math.abs(d.endCanvasY - d.startCanvasY);
      const currentTool = useEditorStore.getState().activeTool;

      if (w > 4 && h > 4 && (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'text')) {
        engineInstance.createObject(currentTool === 'circle' ? 'circle' : currentTool, {
          x: minX, y: minY, width: w, height: h,
        });
      } else if (w <= 4 && h <= 4 && (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'text')) {
        // Click to create with default size
        engineInstance.createObject(currentTool === 'circle' ? 'circle' : currentTool, {
          x: d.startCanvasX - 100, y: d.startCanvasY - 50,
        });
      }

      // Switch back to select after drawing
      engineInstance.setTool('select');
      useEditorStore.getState().setActiveTool('select');
    }

    dragRef.current = { type: 'none' };
  }, [getCanvasPos]);

  // ── Scroll to zoom ────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    let engineInstance: ReturnType<typeof getEngine>;
    try { engineInstance = getEngine(); } catch { return; }

    const rect = containerRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      engineInstance.zoomBy(factor, screenX, screenY);
    } else {
      // Pan
      const vp = engineInstance.viewport;
      engineInstance.setViewport({
        offsetX: vp.offsetX - e.deltaX,
        offsetY: vp.offsetY - e.deltaY,
      });
    }
  }, []);

  // ── Cursor based on tool ──────────────────────────────────────────────────────
  const getCursor = (): string => {
    switch (activeTool) {
      case 'pan': return 'grab';
      case 'rectangle':
      case 'circle':
      case 'text':
      case 'image': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-canvas-bg)',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: getCursor(),
      }}
      className="canvas-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => {
        e.preventDefault();
        const hasSelection = useSelectionStore.getState().selectedIds.length > 0;
        let eng: ReturnType<typeof getEngine>;
        try { eng = getEngine(); } catch { return; }
        showMenu(
          [
            { id: 'add-rect', label: 'Add Rectangle', action: () => { const p = getCanvasPos(e); eng.createObject('rectangle', { x: p.x - 100, y: p.y - 50 }); } },
            { id: 'add-circle', label: 'Add Ellipse', action: () => { const p = getCanvasPos(e); eng.createObject('circle', { x: p.x - 75, y: p.y - 75, width: 150, height: 150 }); } },
            { id: 'add-text', label: 'Add Text', action: () => { const p = getCanvasPos(e); eng.createObject('text', { x: p.x - 100, y: p.y - 25 }); } },
            { id: 'sep1', label: '', separator: true },
            { id: 'select-all', label: 'Select All', shortcut: 'Ctrl+A', action: () => eng.selectAll() },
            ...(hasSelection ? [
              { id: 'sep2', label: '', separator: true },
              { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', action: () => eng.duplicateSelected() },
              { id: 'delete', label: 'Delete', shortcut: 'Delete', action: () => eng.deleteSelected() },
            ] : []),
          ],
          e.clientX,
          e.clientY
        );
      }}
      onWheel={handleWheel}
    >
      {/* Selection Overlay (SVG) */}
      <SelectionOverlay viewport={{ zoom, offsetX, offsetY }} />

      {/* Marquee selection box */}
      {marqueeBounds && (
        <div
          style={{
            position: 'absolute',
            left: marqueeBounds.x,
            top: marqueeBounds.y,
            width: marqueeBounds.w,
            height: marqueeBounds.h,
            border: '1px solid var(--color-accent)',
            background: 'rgba(97, 114, 243, 0.08)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
