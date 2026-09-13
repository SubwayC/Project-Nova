import React from 'react';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';
import { LayersPanel } from '../panels/LayersPanel';
import { AssetsPanel } from '../panels/AssetsPanel';
import { ExplorerPanel } from './ExplorerPanel';

export function Sidebar(): React.ReactElement {
  const { activePanel, sidebarWidth } = useWorkbenchStore();

  const PanelComponent = React.useMemo(() => {
    switch (activePanel) {
      case 'layers':
        return LayersPanel;
      case 'assets':
        return AssetsPanel;
      case 'explorer':
        return ExplorerPanel;
      default:
        return DefaultPanel;
    }
  }, [activePanel]);

  return (
    <div
      style={{
        width: sidebarWidth,
        minWidth: 160,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-border)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <PanelComponent />
    </div>
  );
}

function DefaultPanel(): React.ReactElement {
  const { activePanel } = useWorkbenchStore();
  const label =
    activePanel.charAt(0).toUpperCase() + activePanel.slice(1);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-tertiary)',
        gap: 8,
        fontSize: 12,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5}>
        <rect x="4" y="4" width="24" height="24" rx="4" />
        <path d="M10 16h12M16 10v12" />
      </svg>
      <span>{label} panel coming soon</span>
    </div>
  );
}
