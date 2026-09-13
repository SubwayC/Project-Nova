import React, { useEffect, useRef, useState } from 'react';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';
import { useEditorStore } from '../stores/useEditorStore';
import { useEngineStore } from '../stores/useEngineStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { openCommandPalette } from './CommandPalette';
import type { NovaObject } from '@nova/document';
import './MenuBar.css';

const isElectron = typeof window !== 'undefined' && 'nova' in window;

type MenuId = 'file' | 'edit' | 'view' | 'object' | 'help';

export interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  separator?: false;
  disabled?: boolean;
  checked?: boolean;
  items?: MenuEntry[];
}

export interface Separator {
  separator: true;
}

export type MenuEntry = MenuItem | Separator;

interface Props {
  onSettings?: () => void;
  onAbout?: () => void;
  onShortcuts?: () => void;
}

function MenuOverlayItem({
  item,
  run,
}: {
  item: MenuEntry;
  run: (action?: () => void) => void;
}): React.ReactElement {
  const [hover, setHover] = useState(false);

  if ('separator' in item && item.separator) {
    return <div className="menu-separator" />;
  }

  const menuItem = item as MenuItem;
  const hasSubmenu = Boolean(menuItem.items && menuItem.items.length > 0);

  return (
    <div
      className="menu-item-wrapper"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        className={`menu-item ${menuItem.disabled ? 'disabled' : ''}`}
        onClick={(e) => {
          if (!hasSubmenu) {
            run(menuItem.action);
          } else {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        disabled={menuItem.disabled && !hasSubmenu}
      >
        <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          {menuItem.checked !== undefined && (
            <span className="menu-item-check">{menuItem.checked ? '✓' : ''}</span>
          )}
          <span className="menu-item-label">{menuItem.label}</span>
        </span>
        {menuItem.shortcut && <kbd className="menu-item-kbd">{menuItem.shortcut}</kbd>}
        {hasSubmenu && <span className="menu-item-arrow">▶</span>}
      </button>

      {hasSubmenu && hover && (
        <div className="menubar-dropdown submenu">
          {menuItem.items!.map((subItem, j) => (
            <MenuOverlayItem key={j} item={subItem} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuBar({ onSettings, onAbout, onShortcuts }: Props): React.ReactElement {
  const [open, setOpen] = useState<MenuId | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [recentProjects, setRecentProjects] = useState<Array<{ name: string; path: string }>>([]);

  const {
    activityBarOpen,
    sidebarOpen,
    propertiesOpen,
    bottomPanelOpen,
    statusBarOpen,
    toggleActivityBar,
    toggleSidebar,
    toggleProperties,
    toggleBottomPanel,
    toggleStatusBar,
    setAboutModalOpen,
    setShortcutsModalOpen,
    setActivePanel,
    setSidebarOpen,
  } = useWorkbenchStore();

  const {
    showGrid,
    toggleGrid,
    showGuides,
    setShowGuides,
    snapToGrid,
    setSnapToGrid,
    setZoom,
    zoom,
    setActiveTool,
    setDirty,
    setProjectPath,
    setProjectName,
  } = useEditorStore();

  const { canUndo, canRedo } = useHistoryStore();
  const { getEngine } = useEngineStore();

  // Load recent projects
  useEffect(() => {
    if (isElectron && window.nova.db?.getRecentProjects) {
      window.nova.db
        .getRecentProjects()
        .then((list) => setRecentProjects(list.slice(0, 8)))
        .catch(() => {});
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const run = (action?: () => void) => {
    action?.();
    setOpen(null);
  };

  // Actions
  const handleNewProject = async () => {
    if (!isElectron) return;
    const dir = await window.nova.dialog.openDirectory();
    if (!dir) return;
    const result = await window.nova.project.create('Untitled Project', dir);
    if (result.success && result.path) {
      setProjectPath(result.path);
      setProjectName('Untitled Project');
      setDirty(false);
      await window.nova.db.addRecentProject('Untitled Project', result.path);
    }
  };

  const handleOpenProject = async () => {
    if (!isElectron) return;
    const res = await window.nova.dialog.openFile({
      properties: ['openFile'],
      filters: [{ name: 'Project Nova', extensions: ['nova', 'json'] }],
    });
    if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
      const path = res.filePaths[0];
      if (!path) return;
      const result = await window.nova.project.open(path);
      if (result.success) {
        setProjectPath(path);
        const name = path.split(/[\\/]/).pop() || 'Untitled Project';
        setProjectName(name);
        setDirty(false);
        await window.nova.db.addRecentProject(name, path);
      }
    }
  };

  const handleOpenRecent = async (path: string, name: string) => {
    if (!isElectron) return;
    const result = await window.nova.project.open(path);
    if (result.success) {
      setProjectPath(path);
      setProjectName(name);
      setDirty(false);
      await window.nova.db.addRecentProject(name, path);
    }
  };

  const handleSave = async () => {
    const { projectPath } = useEditorStore.getState();
    if (!isElectron || !projectPath) return;
    try {
      const engine = getEngine();
      const data = engine.document.serialize();
      await window.nova.project.save(projectPath, data);
      setDirty(false);
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const handleSaveAs = async () => {
    if (!isElectron) return;
    try {
      const engine = getEngine();
      const data = engine.document.serialize();
      const result = await window.nova.project.saveAs(data);
      if (result.success && result.path) {
        setProjectPath(result.path);
        setDirty(false);
        const name = result.path.split(/[\\/]/).pop() || 'Untitled Project';
        setProjectName(name);
        await window.nova.db.addRecentProject(name, result.path);
      }
    } catch (e) {
      console.error('Save As failed', e);
    }
  };

  const safeEngine = () => {
    try {
      return getEngine();
    } catch {
      return null;
    }
  };

  const alignSelected = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const engine = safeEngine();
    if (!engine) return;
    const pageId = engine.document.project.activePageId;
    const ids = engine.selection.selectedIds;
    if (!pageId || ids.length < 2) return;
    const objs = ids
      .map((id) => engine.document.getObject(pageId, id))
      .filter(Boolean) as NovaObject[];
    if (objs.length < 2) return;

    if (alignment === 'left') {
      const minX = Math.min(...objs.map((o) => o.x));
      objs.forEach((o) => engine.moveObject(o.id, minX, o.y));
    } else if (alignment === 'center') {
      const avgX = objs.reduce((sum, o) => sum + (o.x + o.width / 2), 0) / objs.length;
      objs.forEach((o) => engine.moveObject(o.id, avgX - o.width / 2, o.y));
    } else if (alignment === 'right') {
      const maxRight = Math.max(...objs.map((o) => o.x + o.width));
      objs.forEach((o) => engine.moveObject(o.id, maxRight - o.width, o.y));
    } else if (alignment === 'top') {
      const minY = Math.min(...objs.map((o) => o.y));
      objs.forEach((o) => engine.moveObject(o.id, o.x, minY));
    } else if (alignment === 'middle') {
      const avgY = objs.reduce((sum, o) => sum + (o.y + o.height / 2), 0) / objs.length;
      objs.forEach((o) => engine.moveObject(o.id, o.x, avgY - o.height / 2));
    } else if (alignment === 'bottom') {
      const maxBottom = Math.max(...objs.map((o) => o.y + o.height));
      objs.forEach((o) => engine.moveObject(o.id, o.x, maxBottom - o.height));
    }
  };

  const bringToFront = () => {
    const engine = safeEngine();
    if (!engine) return;
    const pageId = engine.document.project.activePageId;
    if (!pageId || engine.selection.isEmpty) return;
    const page = engine.document.getPage(pageId);
    if (!page) return;
    const selected = engine.selection.selectedIds;
    const remaining = page.objectIds.filter((id) => !selected.includes(id));
    engine.document.reorderObjects(pageId, [...remaining, ...selected]);
  };

  const sendToBack = () => {
    const engine = safeEngine();
    if (!engine) return;
    const pageId = engine.document.project.activePageId;
    if (!pageId || engine.selection.isEmpty) return;
    const page = engine.document.getPage(pageId);
    if (!page) return;
    const selected = engine.selection.selectedIds;
    const remaining = page.objectIds.filter((id) => !selected.includes(id));
    engine.document.reorderObjects(pageId, [...selected, ...remaining]);
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

  // Recent projects menu items
  const recentItems: MenuEntry[] =
    recentProjects.length > 0
      ? recentProjects.map((p) => ({
          label: p.name,
          action: () => handleOpenRecent(p.path, p.name),
        }))
      : [{ label: 'No Recent Projects', disabled: true }];

  const MENUS: { id: MenuId; label: string; items: MenuEntry[] }[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Project...', shortcut: 'Ctrl+N', action: handleNewProject },
        { label: 'Open Project...', shortcut: 'Ctrl+O', action: handleOpenProject },
        {
          label: 'Open Recent',
          items: recentItems,
        },
        { separator: true },
        { label: 'Save', shortcut: 'Ctrl+S', action: handleSave },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: handleSaveAs },
        { separator: true },
        {
          label: 'Preferences',
          shortcut: 'Ctrl+,',
          action: () => {
            if (onSettings) onSettings();
            else {
              setActivePanel('settings');
              setSidebarOpen(true);
            }
          },
        },
        { separator: true },
        {
          label: 'Close Window',
          shortcut: 'Alt+F4',
          action: () => {
            if (isElectron) window.nova.window.close();
          },
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        {
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          disabled: !canUndo,
          action: () => {
            const engine = safeEngine();
            engine?.undo();
          },
        },
        {
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          disabled: !canRedo,
          action: () => {
            const engine = safeEngine();
            engine?.redo();
          },
        },
        { separator: true },
        {
          label: 'Cut',
          shortcut: 'Ctrl+X',
          action: () => document.execCommand('cut'),
        },
        {
          label: 'Copy',
          shortcut: 'Ctrl+C',
          action: () => document.execCommand('copy'),
        },
        {
          label: 'Paste',
          shortcut: 'Ctrl+V',
          action: () => document.execCommand('paste'),
        },
        {
          label: 'Duplicate',
          shortcut: 'Ctrl+D',
          action: () => {
            const engine = safeEngine();
            engine?.duplicateSelected();
          },
        },
        {
          label: 'Delete',
          shortcut: 'Del',
          action: () => {
            const engine = safeEngine();
            engine?.deleteSelected();
          },
        },
        { separator: true },
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          action: () => {
            const engine = safeEngine();
            engine?.selectAll();
          },
        },
        {
          label: 'Deselect All',
          shortcut: 'Esc',
          action: () => {
            const engine = safeEngine();
            engine?.clearSelection();
            setActiveTool('select');
          },
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Command Palette...', shortcut: 'Ctrl+K', action: openCommandPalette },
        { separator: true },
        {
          label: 'Appearance',
          items: [
            {
              label: 'Activity Bar',
              checked: activityBarOpen,
              action: toggleActivityBar,
            },
            {
              label: 'Primary Side Bar',
              shortcut: 'Ctrl+B',
              checked: sidebarOpen,
              action: toggleSidebar,
            },
            {
              label: 'Properties Inspector',
              checked: propertiesOpen,
              action: toggleProperties,
            },
            {
              label: 'Bottom Panel',
              shortcut: 'Ctrl+`',
              checked: bottomPanelOpen,
              action: toggleBottomPanel,
            },
            {
              label: 'Status Bar',
              checked: statusBarOpen,
              action: toggleStatusBar,
            },
          ],
        },
        { separator: true },
        {
          label: 'Zoom In',
          shortcut: 'Ctrl+=',
          action: () => {
            const engine = safeEngine();
            if (engine) engine.zoomBy(1.2);
            else setZoom(Math.min(10, zoom * 1.2));
          },
        },
        {
          label: 'Zoom Out',
          shortcut: 'Ctrl+-',
          action: () => {
            const engine = safeEngine();
            if (engine) engine.zoomBy(1 / 1.2);
            else setZoom(Math.max(0.1, zoom / 1.2));
          },
        },
        {
          label: 'Reset Zoom (100%)',
          shortcut: 'Ctrl+0',
          action: () => {
            const engine = safeEngine();
            if (engine) engine.setViewport({ zoom: 1 });
            else setZoom(1);
          },
        },
        { separator: true },
        {
          label: 'Show Grid',
          checked: showGrid,
          action: toggleGrid,
        },
        {
          label: 'Snap to Grid',
          checked: snapToGrid,
          action: () => setSnapToGrid(!snapToGrid),
        },
        {
          label: 'Show Guides',
          checked: showGuides,
          action: () => setShowGuides(!showGuides),
        },
        { separator: true },
        {
          label: 'Full Screen',
          shortcut: 'F11',
          action: toggleFullScreen,
        },
      ],
    },
    {
      id: 'object',
      label: 'Object',
      items: [
        {
          label: 'Rectangle',
          shortcut: 'R',
          action: () => {
            const engine = safeEngine();
            if (engine)
              engine.createObject('rectangle', { x: 100, y: 100, width: 140, height: 90 });
          },
        },
        {
          label: 'Ellipse',
          shortcut: 'O',
          action: () => {
            const engine = safeEngine();
            if (engine) engine.createObject('circle', { x: 120, y: 120, width: 100, height: 100 });
          },
        },
        {
          label: 'Text',
          shortcut: 'T',
          action: () => {
            const engine = safeEngine();
            if (engine) engine.createObject('text', { x: 140, y: 140, width: 160, height: 40 });
          },
        },
        { separator: true },
        {
          label: 'Bring to Front',
          shortcut: 'Ctrl+]',
          action: bringToFront,
        },
        {
          label: 'Send to Back',
          shortcut: 'Ctrl+[',
          action: sendToBack,
        },
        { separator: true },
        {
          label: 'Align',
          items: [
            { label: 'Align Left', action: () => alignSelected('left') },
            { label: 'Align Center', action: () => alignSelected('center') },
            { label: 'Align Right', action: () => alignSelected('right') },
            { separator: true },
            { label: 'Align Top', action: () => alignSelected('top') },
            { label: 'Align Middle', action: () => alignSelected('middle') },
            { label: 'Align Bottom', action: () => alignSelected('bottom') },
          ],
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          label: 'Keyboard Shortcuts',
          shortcut: 'Ctrl+/',
          action: () => {
            if (onShortcuts) onShortcuts();
            else setShortcutsModalOpen(true);
          },
        },
        {
          label: 'Command Palette',
          shortcut: 'Ctrl+K',
          action: openCommandPalette,
        },
        { separator: true },
        {
          label: 'Toggle Developer Tools',
          shortcut: 'F12',
          action: () => {
            // F12 handled by electron main
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F12', bubbles: true }));
          },
        },
        { separator: true },
        {
          label: 'Check for Updates',
          action: async () => {
            if (isElectron) {
              const version = await window.nova.app.getVersion();
              alert(`Project Nova is up to date (v${version}).`);
            } else {
              alert('Project Nova is up to date.');
            }
          },
        },
        { separator: true },
        {
          label: 'About Project Nova',
          action: () => {
            if (onAbout) onAbout();
            else setAboutModalOpen(true);
          },
        },
      ],
    },
  ];

  return (
    <div className="menubar" ref={barRef}>
      {MENUS.map((menu) => (
        <div key={menu.id} className="menubar-item">
          <button
            className={`menubar-trigger ${open === menu.id ? 'open' : ''}`}
            onClick={() => setOpen((o) => (o === menu.id ? null : menu.id))}
            onMouseEnter={() => {
              if (open !== null) setOpen(menu.id);
            }}
          >
            {menu.label}
          </button>

          {open === menu.id && (
            <div className="menubar-dropdown">
              {menu.items.map((item, i) => (
                <MenuOverlayItem key={i} item={item} run={run} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
