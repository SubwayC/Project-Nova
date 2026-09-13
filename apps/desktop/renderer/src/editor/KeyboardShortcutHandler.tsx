import { useEffect } from 'react';
import { useEngineStore } from '../stores/useEngineStore';
import { useEditorStore } from '../stores/useEditorStore';
import type { ToolMode } from '@nova/core';
import { KEYS } from '@nova/shared';

/**
 * Keyboard shortcut handler — mounted at the workbench level.
 * Translates keyboard events into engine commands.
 */
export function KeyboardShortcutHandler(): null {
  const { getEngine } = useEngineStore();
  const { activeTool, setActiveTool } = useEditorStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      let engine: ReturnType<typeof getEngine>;
      try { engine = getEngine(); } catch { return; }

      const ctrl = e.ctrlKey || e.metaKey;

      // ── Undo / Redo ──────────────────────────────────────────────────────────
      if (ctrl && e.shiftKey && e.key === KEYS.Z) {
        e.preventDefault();
        engine.redo();
        return;
      }
      if (ctrl && e.key === KEYS.Z) {
        e.preventDefault();
        engine.undo();
        return;
      }

      // ── Copy / Paste / Cut / Duplicate ────────────────────────────────────────
      if (ctrl && e.key === KEYS.D) {
        e.preventDefault();
        engine.duplicateSelected();
        return;
      }
      if (ctrl && e.key === KEYS.A) {
        e.preventDefault();
        engine.selectAll();
        return;
      }

      // ── Delete ────────────────────────────────────────────────────────────────
      if (e.key === KEYS.DELETE || e.key === KEYS.BACKSPACE) {
        e.preventDefault();
        engine.deleteSelected();
        return;
      }

      // ── Escape ────────────────────────────────────────────────────────────────
      if (e.key === KEYS.ESCAPE) {
        engine.clearSelection();
        engine.setTool('select');
        setActiveTool('select');
        return;
      }

      // ── Tool shortcuts ────────────────────────────────────────────────────────
      if (!ctrl) {
        const toolMap: Record<string, ToolMode> = {
          'v': 'select',
          'r': 'rectangle',
          'o': 'circle',
          't': 'text',
          'i': 'image',
          'h': 'pan',
        };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          engine.setTool(tool);
          setActiveTool(tool);
          return;
        }
      }

      // ── Zoom ──────────────────────────────────────────────────────────────────
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        engine.zoomBy(1.2);
        return;
      }
      if (ctrl && e.key === '-') {
        e.preventDefault();
        engine.zoomBy(1 / 1.2);
        return;
      }
      if (ctrl && e.key === '0') {
        e.preventDefault();
        engine.setViewport({ zoom: 1 });
        return;
      }

      // ── Arrow keys (nudge) ────────────────────────────────────────────────────
      const step = e.shiftKey ? 10 : 1;
      let nx = 0, ny = 0;
      if (e.key === KEYS.ARROW_LEFT) nx = -step;
      else if (e.key === KEYS.ARROW_RIGHT) nx = step;
      else if (e.key === KEYS.ARROW_UP) ny = -step;
      else if (e.key === KEYS.ARROW_DOWN) ny = step;

      if ((nx !== 0 || ny !== 0) && !engine.selection.isEmpty) {
        e.preventDefault();
        const pageId = engine.document.project.activePageId;
        for (const id of engine.selection.selectedIds) {
          const obj = engine.document.getObject(pageId, id);
          if (obj) {
            engine.moveObject(id, obj.x + nx, obj.y + ny);
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return null;
}
