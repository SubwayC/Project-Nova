import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { useEngineStore } from '../stores/useEngineStore';
import type { ToolMode } from '@nova/core';

interface Tool {
  id: ToolMode;
  title: string;
  shortcut: string;
  icon: React.ReactNode;
}

const TOOLS: Tool[] = [
  {
    id: 'select',
    title: 'Select (V)',
    shortcut: 'V',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2l10 6-5 1-3 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    title: 'Rectangle (R)',
    shortcut: 'R',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: 'circle',
    title: 'Ellipse (O)',
    shortcut: 'O',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <ellipse cx="8" cy="8" rx="6" ry="5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: 'text',
    title: 'Text (T)',
    shortcut: 'T',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M3 4h10M8 4v8M5 12h6" />
      </svg>
    ),
  },
  {
    id: 'image',
    title: 'Image (I)',
    shortcut: 'I',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="5.5" cy="6.5" r="1.5" fill="currentColor" opacity={0.5} />
        <path d="M2 11l4-3 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'pan',
    title: 'Pan (H)',
    shortcut: 'H',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 2v4M8 10v4M2 8h4M10 8h4" />
        <circle cx="8" cy="8" r="2" />
      </svg>
    ),
  },
];

const DIVIDER_AFTER: ToolMode[] = ['select', 'pan'];

export function Toolbar(): React.ReactElement {
  const { activeTool } = useEditorStore();
  const { getEngine } = useEngineStore();

  const handleToolClick = (tool: ToolMode) => {
    try {
      const engine = getEngine();
      engine.setTool(tool);
      useEditorStore.getState().setActiveTool(tool);
    } catch {}
  };

  const handleZoomIn = () => {
    try { getEngine().zoomBy(1.2); } catch {}
  };
  const handleZoomOut = () => {
    try { getEngine().zoomBy(1 / 1.2); } catch {}
  };
  const handleFitPage = () => {
    const container = document.querySelector('.canvas-container') as HTMLElement | null;
    if (!container) return;
    try {
      getEngine().centerViewport(container.clientWidth, container.clientHeight);
    } catch {}
  };

  return (
    <div
      style={{
        height: 40,
        background: 'var(--color-panel)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 2,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Tool buttons */}
      {TOOLS.map((tool) => (
        <React.Fragment key={tool.id}>
          <ToolButton
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => handleToolClick(tool.id)}
          />
          {DIVIDER_AFTER.includes(tool.id) && (
            <div
              style={{
                width: 1,
                height: 20,
                background: 'var(--color-border)',
                margin: '0 4px',
              }}
            />
          )}
        </React.Fragment>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (Ctrl+-)"
          style={toolButtonStyle(false, false)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="5" />
            <line x1="3" y1="6" x2="9" y2="6" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" />
          </svg>
        </button>
        <ZoomDisplay />
        <button
          onClick={handleZoomIn}
          title="Zoom In (Ctrl+=)"
          style={toolButtonStyle(false, false)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="5" />
            <line x1="3" y1="6" x2="9" y2="6" />
            <line x1="6" y1="3" x2="6" y2="9" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" />
          </svg>
        </button>
        <button
          onClick={handleFitPage}
          title="Fit Page"
          style={{ ...toolButtonStyle(false, false), fontSize: 11, padding: '0 8px', color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          Fit
        </button>
      </div>
    </div>
  );
}

function ZoomDisplay(): React.ReactElement {
  const { zoom } = useEditorStore();
  return (
    <div
      style={{
        minWidth: 52,
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--color-text-secondary)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {Math.round(zoom * 100)}%
    </div>
  );
}

function toolButtonStyle(isActive: boolean, isHovered: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    background: isActive ? 'rgba(97, 114, 243, 0.12)' : isHovered ? 'var(--color-hover)' : 'transparent',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    transition: 'background 0.1s, color 0.1s',
    flexShrink: 0,
  };
}

function ToolButton({
  tool,
  isActive,
  onClick,
}: {
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      title={tool.title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={toolButtonStyle(isActive, hovered)}
    >
      {tool.icon}
    </button>
  );
}
