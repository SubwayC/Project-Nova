import React from 'react';

export function AssetsPanel(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          Assets
        </span>
        <button
          title="Import Asset"
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="7" y1="2" x2="7" y2="12" />
            <line x1="2" y1="7" x2="12" y2="7" />
          </svg>
        </button>
      </div>

      {/* Empty state */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'var(--color-text-tertiary)',
          padding: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: 'var(--color-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="4" width="10" height="10" rx="2" />
            <rect x="18" y="4" width="10" height="10" rx="2" />
            <rect x="4" y="18" width="10" height="10" rx="2" />
            <rect x="18" y="18" width="10" height="10" rx="2" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>No assets yet</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Import images and SVGs</p>
        </div>
        <button
          style={{
            padding: '6px 14px',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Import Asset
        </button>
      </div>
    </div>
  );
}
