import React from 'react';
import { TitleBar } from './TitleBar';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { BottomPanel } from './BottomPanel';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { AboutModal } from './AboutModal';
import { ShortcutsModal } from './ShortcutsModal';
import { ContextMenuProvider } from '../ui/ContextMenu';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';
import { KeyboardShortcutHandler } from '../editor/KeyboardShortcutHandler';

export function Workbench(): React.ReactElement {
  const {
    activityBarOpen,
    sidebarOpen,
    propertiesOpen,
    bottomPanelOpen,
    bottomPanelHeight,
    statusBarOpen,
    aboutModalOpen,
    setAboutModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
  } = useWorkbenchStore();

  return (
    <ContextMenuProvider>
      <KeyboardShortcutHandler />
      <div
        className="workbench-root"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--color-bg)',
        }}
      >
        {/* Title Bar */}
        <TitleBar />

        {/* Main Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Activity Bar */}
          {activityBarOpen && <ActivityBar />}

          {/* Sidebar */}
          {sidebarOpen && <Sidebar />}

          {/* Editor Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            {/* Canvas + Bottom Panel */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              {/* Canvas area */}
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <EditorArea />
              </div>

              {/* Bottom Panel */}
              {bottomPanelOpen && (
                <div
                  style={{
                    height: bottomPanelHeight,
                    minHeight: 80,
                    borderTop: '1px solid var(--color-border)',
                    background: 'var(--color-panel)',
                    flexShrink: 0,
                  }}
                >
                  <BottomPanel />
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          {propertiesOpen && <PropertiesPanel />}
        </div>

        {/* Status Bar */}
        {statusBarOpen && <StatusBar />}

        {/* Command Palette (overlay) */}
        <CommandPalette />

        {/* About Dialog Modal */}
        {aboutModalOpen && <AboutModal onClose={() => setAboutModalOpen(false)} />}

        {/* Keyboard Shortcuts Modal */}
        {shortcutsModalOpen && <ShortcutsModal onClose={() => setShortcutsModalOpen(false)} />}
      </div>
    </ContextMenuProvider>
  );
}
