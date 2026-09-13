import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useEngineStore } from '../stores/useEngineStore';
import type { NovaObject } from '@nova/document';

export function LayersPanel(): React.ReactElement {
  const { pages, activePageId } = useProjectStore();
  const { selectedIds } = useSelectionStore();
  const { getEngine } = useEngineStore();

  const activePage = pages.find((p) => p.id === activePageId);

  if (!activePage) {
    return (
      <div style={{ padding: 16, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
        No page selected
      </div>
    );
  }

  const objects = [...activePage.objectIds].reverse().map((id) => activePage.objects[id]).filter(Boolean) as NovaObject[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Layers
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {objects.length}
        </span>
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {objects.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 8,
              color: 'var(--color-text-tertiary)',
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12,2 22,8 12,14 2,8" />
              <polyline points="2,14 12,20 22,14" />
            </svg>
            No objects
          </div>
        ) : (
          objects.map((obj) => (
            <LayerItem
              key={obj.id}
              object={obj}
              isSelected={selectedIds.includes(obj.id)}
              onSelect={(id, multi) => {
                try {
                  const engine = getEngine();
                  if (multi) engine.toggleSelectObject(id);
                  else engine.selectObject(id);
                } catch {}
              }}
              onToggleVisibility={(id) => {
                try {
                  const engine = getEngine();
                  const page = engine.document.getActivePage();
                  if (!page) return;
                  const obj = page.objects[id];
                  if (obj) engine.updateObjectProperty(id, { visible: !obj.visible } as any, 'Toggle visibility');
                } catch {}
              }}
              onToggleLock={(id) => {
                try {
                  const engine = getEngine();
                  const page = engine.document.getActivePage();
                  if (!page) return;
                  const obj = page.objects[id];
                  if (obj) engine.updateObjectProperty(id, { locked: !obj.locked } as any, 'Toggle lock');
                } catch {}
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LayerItem({
  object,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
}: {
  object: NovaObject;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(object.name);

  const typeIcon = getTypeIcon(object.type);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => onSelect(object.id, e.shiftKey || e.ctrlKey)}
      onDoubleClick={() => setRenaming(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        background: isSelected
          ? 'rgba(97, 114, 243, 0.1)'
          : hovered
          ? 'var(--color-hover)'
          : 'transparent',
        borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
        cursor: 'pointer',
        userSelect: 'none',
        opacity: object.visible ? 1 : 0.4,
        minHeight: 28,
      }}
    >
      {/* Type icon */}
      <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, display: 'flex' }}>
        {typeIcon}
      </span>

      {/* Name */}
      {renaming ? (
        <input
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={() => setRenaming(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            fontSize: 12,
            border: '1px solid var(--color-accent)',
            borderRadius: 3,
            padding: '1px 4px',
            outline: 'none',
            userSelect: 'text',
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {object.name}
        </span>
      )}

      {/* Controls (visible on hover or selected) */}
      {(hovered || isSelected) && !renaming && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <LayerControlButton
            title={object.visible ? 'Hide' : 'Show'}
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(object.id); }}
            active={object.visible}
          >
            <EyeIcon />
          </LayerControlButton>
          <LayerControlButton
            title={object.locked ? 'Unlock' : 'Lock'}
            onClick={(e) => { e.stopPropagation(); onToggleLock(object.id); }}
            active={!object.locked}
          >
            <LockIcon locked={object.locked} />
          </LayerControlButton>
        </div>
      )}
    </div>
  );
}

function LayerControlButton({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
}): React.ReactElement {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 3,
        cursor: 'pointer',
        color: active ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'rectangle':
      return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2" width="10" height="8" rx="1" /></svg>;
    case 'circle':
      return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6" cy="6" r="4.5" /></svg>;
    case 'text':
      return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 3h8M6 3v6M4 9h4" /></svg>;
    case 'image':
      return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2" width="10" height="8" rx="1" /><circle cx="4" cy="5" r="1" fill="currentColor" opacity={0.5} /><path d="M1 8l3-2.5 2.5 2.5 1.5-1.5 3 2.5" /></svg>;
    case 'group':
      return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="4" height="4" rx="0.5" /><rect x="7" y="1" width="4" height="4" rx="0.5" /><rect x="1" y="7" width="4" height="4" rx="0.5" /><rect x="7" y="7" width="4" height="4" rx="0.5" /></svg>;
    default:
      return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="10" height="10" rx="1" /></svg>;
  }
}

function EyeIcon(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" />
      <circle cx="6" cy="6" r="1.5" />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2.5" y="5" width="7" height="6" rx="1" />
      {locked ? (
        <path d="M4 5V3.5a2 2 0 0 1 4 0V5" />
      ) : (
        <path d="M4 5V3.5a2 2 0 0 1 4 0" />
      )}
    </svg>
  );
}
