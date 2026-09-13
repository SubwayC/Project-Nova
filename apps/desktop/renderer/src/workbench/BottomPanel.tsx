import React from 'react';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';
import type { BottomPanelTab } from '../stores/useWorkbenchStore';
import { LayersPanel } from '../panels/LayersPanel';

const TABS: { id: BottomPanelTab; label: string }[] = [
  { id: 'layers', label: 'Layers' },
  { id: 'assets', label: 'Assets' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'output', label: 'Output' },
];

export function BottomPanel(): React.ReactElement {
  const { bottomPanelTab, setBottomPanelTab } = useWorkbenchStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-panel)',
          padding: '0 8px',
          height: 32,
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBottomPanelTab(tab.id)}
            style={{
              padding: '0 12px',
              height: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: bottomPanelTab === tab.id ? 600 : 400,
              color:
                bottomPanelTab === tab.id
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-tertiary)',
              borderBottom:
                bottomPanelTab === tab.id
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {bottomPanelTab === 'layers' && <LayersPanel />}
        {bottomPanelTab !== 'layers' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-text-tertiary)',
              fontSize: 12,
            }}
          >
            {TABS.find((t) => t.id === bottomPanelTab)?.label} — coming soon
          </div>
        )}
      </div>
    </div>
  );
}
