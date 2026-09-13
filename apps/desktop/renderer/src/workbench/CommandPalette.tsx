import React, { useState, useEffect, useRef } from 'react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

const COMMANDS: Command[] = [
  { id: 'add-rect', label: 'Add Rectangle', keywords: ['shape', 'rect'], action: () => {} },
  { id: 'add-circle', label: 'Add Ellipse', keywords: ['shape', 'circle', 'oval'], action: () => {} },
  { id: 'add-text', label: 'Add Text', keywords: ['type', 'text'], action: () => {} },
  { id: 'toggle-grid', label: 'Toggle Grid', keywords: ['view', 'grid'], action: () => {} },
  { id: 'zoom-in', label: 'Zoom In', keywords: ['zoom', 'scale'], action: () => {} },
  { id: 'zoom-out', label: 'Zoom Out', keywords: ['zoom', 'scale'], action: () => {} },
  { id: 'fit-page', label: 'Fit Page to Window', keywords: ['zoom', 'fit'], action: () => {} },
  { id: 'select-all', label: 'Select All', keywords: ['select'], action: () => {} },
  { id: 'undo', label: 'Undo', keywords: ['history'], action: () => {} },
  { id: 'redo', label: 'Redo', keywords: ['history'], action: () => {} },
];

let _openCommandPalette: (() => void) | null = null;

export function openCommandPalette(): void {
  _openCommandPalette?.();
}

export function CommandPalette(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  _openCommandPalette = () => setOpen(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = COMMANDS.filter(
    (c) =>
      !query ||
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.keywords?.some((k) => k.includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      filtered[selected]?.action();
      setOpen(false);
    }
  };

  if (!open) return <></>;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 10000,
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          maxWidth: '90vw',
          background: 'white',
          borderRadius: 10,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          zIndex: 10001,
          overflow: 'hidden',
          animation: 'scaleIn 0.1s ease-out',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <line x1="11" y1="11" x2="15" y2="15" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              background: 'transparent',
              userSelect: 'text',
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              color: 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 3,
              padding: '2px 5px',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
                fontSize: 13,
              }}
            >
              No commands found
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  background: i === selected ? 'var(--color-accent-light)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: i === selected ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: i === selected ? 500 : 400 }}>
                    {cmd.label}
                  </div>
                  {cmd.description && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                      {cmd.description}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
