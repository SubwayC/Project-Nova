import React, { useRef, useCallback } from 'react';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useEngineStore } from '../stores/useEngineStore';
import type { Viewport } from '@nova/renderer';
import type { HandleType } from '@nova/interaction';

const HANDLE_SIZE = 8;
const ROTATION_OFFSET = 24;

interface Props {
  viewport: Viewport;
}

export function SelectionOverlay({ viewport }: Props): React.ReactElement {
  const { selectionBounds, selectedIds } = useSelectionStore();
  const { getEngine } = useEngineStore();
  const activeHandleRef = useRef<HandleType | null>(null);
  const dragStartRef = useRef<{ screenX: number; screenY: number; bounds: typeof selectionBounds } | null>(null);

  if (!selectionBounds || selectedIds.length === 0) {
    return <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
  }

  const { x, y, width, height, rotation } = selectionBounds;
  const zoom = viewport.zoom;
  const ox = viewport.offsetX;
  const oy = viewport.offsetY;

  // Convert canvas coords to screen coords
  const sx = (cx: number) => cx * zoom + ox;
  const sy = (cy: number) => cy * zoom + oy;

  // Canvas bounding box in screen space
  const left = sx(x);
  const top = sy(y);
  const right = sx(x + width);
  const bottom = sy(y + height);
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const w = right - left;
  const h = bottom - top;

  const handles: { type: HandleType; sx: number; sy: number; cursor: string }[] = [
    { type: 'nw', sx: left, sy: top, cursor: 'nwse-resize' },
    { type: 'n', sx: cx, sy: top, cursor: 'ns-resize' },
    { type: 'ne', sx: right, sy: top, cursor: 'nesw-resize' },
    { type: 'e', sx: right, sy: cy, cursor: 'ew-resize' },
    { type: 'se', sx: right, sy: bottom, cursor: 'nwse-resize' },
    { type: 's', sx: cx, sy: bottom, cursor: 'ns-resize' },
    { type: 'sw', sx: left, sy: bottom, cursor: 'nesw-resize' },
    { type: 'w', sx: left, sy: cy, cursor: 'ew-resize' },
    { type: 'rotation', sx: cx, sy: top - ROTATION_OFFSET, cursor: 'crosshair' },
  ];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handleType: HandleType) => {
      e.stopPropagation();
      e.preventDefault();
      activeHandleRef.current = handleType;
      dragStartRef.current = {
        screenX: e.clientX,
        screenY: e.clientY,
        bounds: selectionBounds,
      };

      const onMouseMove = (me: MouseEvent) => {
        if (!activeHandleRef.current || !dragStartRef.current) return;
        const dxScreen = me.clientX - dragStartRef.current.screenX;
        const dyScreen = me.clientY - dragStartRef.current.screenY;
        const dxCanvas = dxScreen / zoom;
        const dyCanvas = dyScreen / zoom;

        let engine: ReturnType<typeof getEngine>;
        try { engine = getEngine(); } catch { return; }

        const pageId = engine.document.project.activePageId;

        if (activeHandleRef.current === 'rotation') {
          // Rotation
          const bounds = dragStartRef.current.bounds!;
          const centerX = sx(bounds.x + bounds.width / 2);
          const centerY = sy(bounds.y + bounds.height / 2);
          const angle = Math.atan2(me.clientY - centerY, me.clientX - centerX);
          const newRotation = (angle * 180) / Math.PI + 90;
          for (const id of selectedIds) {
            const obj = engine.document.getObject(pageId, id);
            if (obj) engine.document.updateObject(pageId, id, { rotation: newRotation } as any);
          }
        } else {
          // Resize — apply to all selected objects
          const bounds = dragStartRef.current.bounds!;
          for (const id of selectedIds) {
            const obj = engine.document.getObject(pageId, id);
            if (!obj) continue;
            const newBounds = engine.transform.applyResize(
              { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
              activeHandleRef.current,
              { x: dxCanvas, y: dyCanvas },
              me.shiftKey
            );
            engine.document.updateObject(pageId, id, newBounds as any);
          }
          // Update selection bounds
          const page = engine.document.getActivePage();
          if (page) {
            const newSelBounds = engine.selection.getSelectionBounds(page);
            useSelectionStore.getState().setSelectionBounds(newSelBounds);
          }
        }
      };

      const onMouseUp = (me: MouseEvent) => {
        const handle = activeHandleRef.current;
        const start = dragStartRef.current;
        if (handle && start) {
          const dxCanvas = (me.clientX - start.screenX) / zoom;
          const dyCanvas = (me.clientY - start.screenY) / zoom;
          if (Math.abs(dxCanvas) > 0.5 || Math.abs(dyCanvas) > 0.5) {
            try {
              const engine = getEngine();
              const pageId = engine.document.project.activePageId;
              for (const id of selectedIds) {
                const obj = engine.document.getObject(pageId, id);
                if (obj) {
                  const startObj = { x: start.bounds!.x, y: start.bounds!.y, width: start.bounds!.width, height: start.bounds!.height };
                  // TODO: proper resize history command
                }
              }
            } catch {}
          }
        }
        activeHandleRef.current = null;
        dragStartRef.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [selectionBounds, selectedIds, zoom, sx, sy, getEngine]
  );

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* Selection bounding box */}
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        fill="none"
        stroke="#6172f3"
        strokeWidth={1.5}
        strokeDasharray={selectedIds.length > 1 ? '4 2' : undefined}
      />

      {/* Rotation line */}
      <line
        x1={cx}
        y1={top}
        x2={cx}
        y2={top - ROTATION_OFFSET}
        stroke="#6172f3"
        strokeWidth={1}
      />

      {/* Handles */}
      {handles.map((handle) => (
        <g
          key={handle.type}
          style={{ pointerEvents: 'all', cursor: handle.cursor }}
          onMouseDown={(e) => handleMouseDown(e, handle.type)}
        >
          {handle.type === 'rotation' ? (
            <circle
              cx={handle.sx}
              cy={handle.sy}
              r={5}
              fill="white"
              stroke="#6172f3"
              strokeWidth={1.5}
            />
          ) : (
            <rect
              x={handle.sx - HANDLE_SIZE / 2}
              y={handle.sy - HANDLE_SIZE / 2}
              width={HANDLE_SIZE}
              height={HANDLE_SIZE}
              rx={2}
              fill="white"
              stroke="#6172f3"
              strokeWidth={1.5}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
