import React, { useEffect, useRef, useState } from 'react';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';
import { useEditorStore } from '../stores/useEditorStore';
import { MenuBar } from './MenuBar';
import './TitleBar.css';

const isElectron = typeof window !== 'undefined' && 'nova' in window;

export function TitleBar(): React.ReactElement {
  const {
    activityBarOpen,
    sidebarOpen,
    sidebarWidth,
    propertiesOpen,
    propertiesWidth,
    bottomPanelOpen,
    bottomPanelHeight,
    statusBarOpen,
    isMaximized,
    toggleActivityBar,
    toggleSidebar,
    resetSidebarWidth,
    toggleProperties,
    resetPropertiesWidth,
    toggleBottomPanel,
    resetBottomPanelHeight,
    toggleStatusBar,
    setMaximized,
    setActivePanel,
    setSidebarOpen,
    setAboutModalOpen,
  } = useWorkbenchStore();

  const { projectName, isDirty } = useEditorStore();

  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  // Sync window maximized state from electron
  useEffect(() => {
    if (isElectron) {
      window.nova.window
        .isMaximized()
        .then(setMaximized)
        .catch(() => {});
      const unsub = window.nova.window.onStateChanged((state) => {
        setMaximized(state.maximized);
      });
      return unsub;
    }
    return undefined;
  }, [setMaximized]);

  // Track fullscreen
  useEffect(() => {
    const onFsChange = () => setIsFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Close layout menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setLayoutMenuOpen(false);
      }
    };
    if (layoutMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [layoutMenuOpen]);

  const handleMinimize = () => {
    if (isElectron) window.nova.window.minimize();
  };

  const handleMaximize = () => {
    if (isElectron) window.nova.window.maximize();
  };

  const handleClose = () => {
    if (isElectron) window.nova.window.close();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        if (isElectron) window.nova.window.maximize();
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSettingsClick = () => {
    setActivePanel('settings');
    setSidebarOpen(true);
  };

  return (
    <div className="titlebar">
      {/* Left: Logo & MenuBar */}
      <div className="titlebar-left">
        <div
          className="titlebar-logo-badge"
          onClick={() => setAboutModalOpen(true)}
          title="About Project Nova"
        >
          <div className="logo-icon">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polygon points="6,1 11,10 1,10" fill="white" />
            </svg>
          </div>
          <span className="logo-text">Nova</span>
        </div>

        {/* Rich Desktop MenuBar */}
        <MenuBar onSettings={handleSettingsClick} />
      </div>

      {/* Center: Project Title & Dirty Status */}
      <div className="titlebar-center">
        <span className="project-title">{projectName}</span>
        {isDirty && <span className="project-dirty-dot" title="Unsaved changes" />}
      </div>

      {/* Right: Layout Toggles, Settings, Profile & Window Controls */}
      <div className="titlebar-right">
        {/* Quick layout icon buttons */}
        <button
          className={`titlebar-icon-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={toggleSidebar}
          title="Toggle Primary Side Bar (Ctrl+B)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <rect x="1" y="2" width="14" height="12" rx="2" />
            <line x1="5.5" y1="2" x2="5.5" y2="14" />
          </svg>
        </button>

        <button
          className={`titlebar-icon-btn ${bottomPanelOpen ? 'active' : ''}`}
          onClick={toggleBottomPanel}
          title="Toggle Bottom Panel (Ctrl+`)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <rect x="1" y="2" width="14" height="12" rx="2" />
            <line x1="1" y1="10" x2="15" y2="10" />
          </svg>
        </button>

        <button
          className={`titlebar-icon-btn ${propertiesOpen ? 'active' : ''}`}
          onClick={toggleProperties}
          title="Toggle Properties Inspector"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <rect x="1" y="2" width="14" height="12" rx="2" />
            <line x1="10.5" y1="2" x2="10.5" y2="14" />
          </svg>
        </button>

        {/* Customize Layout Dropdown Trigger */}
        <div className="layout-menu-wrapper" ref={layoutMenuRef}>
          <button
            className={`titlebar-icon-btn ${layoutMenuOpen ? 'active' : ''}`}
            onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
            title="Customize Layout"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <rect x="1" y="2" width="14" height="12" rx="2" />
              <line x1="1" y1="6" x2="15" y2="6" />
              <line x1="6" y1="6" x2="6" y2="14" />
            </svg>
          </button>

          {layoutMenuOpen && (
            <div className="layout-menu">
              <div className="layout-menu-header">Customize Layout</div>
              <div className="layout-menu-separator" />

              {/* Activity Bar */}
              <LayoutMenuItem
                label="Activity Bar"
                checked={activityBarOpen}
                onToggle={toggleActivityBar}
              />

              {/* Primary Sidebar */}
              <LayoutMenuItem
                label="Primary Side Bar"
                shortcut="Ctrl+B"
                checked={sidebarOpen}
                onToggle={toggleSidebar}
                canReset={sidebarWidth !== 260}
                onReset={(e) => {
                  e.stopPropagation();
                  resetSidebarWidth();
                }}
              />

              {/* Properties Panel */}
              <LayoutMenuItem
                label="Secondary Side Bar (Properties)"
                checked={propertiesOpen}
                onToggle={toggleProperties}
                canReset={propertiesWidth !== 260}
                onReset={(e) => {
                  e.stopPropagation();
                  resetPropertiesWidth();
                }}
              />

              <div className="layout-menu-separator" />

              {/* Bottom Panel */}
              <LayoutMenuItem
                label="Bottom Panel"
                shortcut="Ctrl+`"
                checked={bottomPanelOpen}
                onToggle={toggleBottomPanel}
                canReset={bottomPanelHeight !== 200}
                onReset={(e) => {
                  e.stopPropagation();
                  resetBottomPanelHeight();
                }}
              />

              {/* Status Bar */}
              <LayoutMenuItem
                label="Status Bar"
                checked={statusBarOpen}
                onToggle={toggleStatusBar}
              />

              <div className="layout-menu-separator" />

              {/* Full Screen */}
              <LayoutMenuItem
                label="Full Screen"
                shortcut="F11"
                checked={isFullScreen}
                onToggle={toggleFullScreen}
              />
            </div>
          )}
        </div>

        <div className="titlebar-separator" />

        {/* Settings button */}
        <button
          className="titlebar-icon-btn"
          onClick={handleSettingsClick}
          title="Settings (Ctrl+,)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
          </svg>
        </button>

        {/* Profile button */}
        <button
          className="titlebar-profile-btn"
          title="User Profile"
          onClick={() => setAboutModalOpen(true)}
        >
          N
        </button>

        {/* Windows Window Controls */}
        <div className="titlebar-controls win">
          <button className="wc-btn minimize" onClick={handleMinimize} title="Minimize">
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            className="wc-btn maximize"
            onClick={handleMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <rect x="2.5" y="0.5" width="7" height="7" />
                <path d="M0.5 2.5v7h7" />
              </svg>
            ) : (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <rect x="0.5" y="0.5" width="9" height="9" />
              </svg>
            )}
          </button>
          <button className="wc-btn close" onClick={handleClose} title="Close">
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <line x1="0" y1="0" x2="10" y2="10" />
              <line x1="10" y1="0" x2="0" y2="10" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface LayoutMenuItemProps {
  label: string;
  shortcut?: string;
  checked: boolean;
  onToggle: () => void;
  canReset?: boolean;
  onReset?: (e: React.MouseEvent) => void;
}

function LayoutMenuItem({
  label,
  shortcut,
  checked,
  onToggle,
  canReset,
  onReset,
}: LayoutMenuItemProps): React.ReactElement {
  return (
    <div className="layout-menu-item" onClick={onToggle}>
      <div className="layout-menu-item-left">
        <span className={`layout-menu-check ${checked ? 'visible' : ''}`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="layout-menu-label">{label}</span>
      </div>
      <div className="layout-menu-item-right">
        {canReset && onReset && (
          <button className="layout-menu-reset" onClick={onReset} title="Reset to default size">
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2.5 8a5.5 5.5 0 1 1 1.5 3.8L1 14" />
              <path d="M1 9.5V14h4.5" />
            </svg>
          </button>
        )}
        {shortcut && <kbd className="layout-menu-kbd">{shortcut}</kbd>}
      </div>
    </div>
  );
}
