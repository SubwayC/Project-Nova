import React from 'react';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';
import type { ActivePanel } from '../stores/useWorkbenchStore';

interface ActivityBarItem {
  id: ActivePanel;
  icon: React.ReactNode;
  title: string;
  isBottom?: boolean;
}

const TopItems: ActivityBarItem[] = [
  {
    id: 'explorer',
    title: 'Explorer',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h16M3 11h16M3 17h10" />
      </svg>
    ),
  },
  {
    id: 'layers',
    title: 'Layers',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11,2 20,7 11,12 2,7" />
        <polyline points="2,12 11,17 20,12" />
        <polyline points="2,17 11,22 20,17" />
      </svg>
    ),
  },
  {
    id: 'assets',
    title: 'Assets',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="12" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="12" width="7" height="7" rx="1" />
        <rect x="12" y="12" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="18" height="14" rx="2" />
        <path d="M2 8h18M7 8v9" />
      </svg>
    ),
  },
  {
    id: 'components',
    title: 'Components',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11L11 4l7 7-7 7-7-7z" />
      </svg>
    ),
  },
];

const BottomItems: ActivityBarItem[] = [
  {
    id: 'settings',
    title: 'Settings',
    isBottom: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="3" />
        <path d="M11 2v2M11 18v2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M2 11h2M18 11h2M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export function ActivityBar(): React.ReactElement {
  const { activePanel, setActivePanel, toggleSidebar, sidebarOpen } = useWorkbenchStore();

  const handleItemClick = (id: ActivePanel) => {
    if (activePanel === id && sidebarOpen) {
      toggleSidebar();
    } else {
      setActivePanel(id);
      if (!sidebarOpen) toggleSidebar();
    }
  };

  return (
    <div
      style={{
        width: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--color-activity-bar, #f0f0f0)',
        borderRight: '1px solid var(--color-border)',
        flexShrink: 0,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      {/* Top items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {TopItems.map((item) => (
          <ActivityBarButton
            key={item.id}
            item={item}
            isActive={activePanel === item.id && sidebarOpen}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>

      {/* Bottom items */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {BottomItems.map((item) => (
          <ActivityBarButton
            key={item.id}
            item={item}
            isActive={activePanel === item.id && sidebarOpen}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityBarButton({
  item,
  isActive,
  onClick,
}: {
  item: ActivityBarItem;
  isActive: boolean;
  onClick: () => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      title={item.title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: 'none',
        position: 'relative',
        background: isActive
          ? 'rgba(97, 114, 243, 0.12)'
          : hovered
          ? 'var(--color-hover)'
          : 'transparent',
        color: isActive
          ? 'var(--color-accent)'
          : hovered
          ? 'var(--color-text-primary)'
          : 'var(--color-text-tertiary)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 2,
            height: 20,
            background: 'var(--color-accent)',
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}
      {item.icon}
    </button>
  );
}
