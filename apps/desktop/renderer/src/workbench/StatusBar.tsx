import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';

export function StatusBar(): React.ReactElement {
  const { zoom, activeTool, isDirty } = useEditorStore();
  const { selectedIds } = useSelectionStore();
  const { canUndo, canRedo } = useHistoryStore();
  const { setBottomPanelOpen, bottomPanelOpen, setBottomPanelTab } = useWorkbenchStore();

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      style={{
        height: 24,
        background: 'var(--color-statusbar, var(--color-accent))',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 0,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
        <StatusBarItem
          onClick={() => { setBottomPanelOpen(!bottomPanelOpen); setBottomPanelTab('layers'); }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
            <polygon points="6,1 11,9 1,9" />
            <polyline points="1,4.5 6,7.5 11,4.5" opacity="0.6" />
          </svg>
          Layers
        </StatusBarItem>
      </div>

      {/* Center / right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {selectedIds.length > 0 && (
          <StatusBarItem>
            {selectedIds.length} selected
          </StatusBarItem>
        )}
        <StatusBarItem>
          Tool: {activeTool}
        </StatusBarItem>
        <StatusBarItem>
          Zoom: {zoomPercent}%
        </StatusBarItem>
        {isDirty && (
          <StatusBarItem>
            ● Unsaved
          </StatusBarItem>
        )}
      </div>
    </div>
  );
}

function StatusBarItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        height: 24,
        background: hovered && onClick ? 'rgba(255,255,255,0.15)' : 'transparent',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: 400,
        whiteSpace: 'nowrap',
        borderRadius: 2,
        transition: 'background 0.1s',
      }}
    >
      {children}
    </button>
  );
}
