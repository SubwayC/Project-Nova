import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  action?: () => void;
}

interface ContextMenuState {
  items: ContextMenuItem[];
  x: number;
  y: number;
}

interface ContextMenuContextValue {
  showMenu: (items: ContextMenuItem[], x: number, y: number) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue>({
  showMenu: () => {},
  hideMenu: () => {},
});

export function useContextMenu(): ContextMenuContextValue {
  return useContext(ContextMenuContext);
}

export function ContextMenuProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const showMenu = useCallback((items: ContextMenuItem[], x: number, y: number) => {
    setMenu({ items, x, y });
  }, []);

  const hideMenu = useCallback(() => {
    setMenu(null);
  }, []);

  return (
    <ContextMenuContext.Provider value={{ showMenu, hideMenu }}>
      {children}
      {menu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={hideMenu}
            onContextMenu={(e) => { e.preventDefault(); hideMenu(); }}
          />
          <div
            style={{
              position: 'fixed',
              left: menu.x,
              top: menu.y,
              minWidth: 180,
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 9999,
              padding: '4px 0',
              animation: 'scaleIn 0.1s ease-out',
            }}
          >
            {menu.items.map((item, i) =>
              item.separator ? (
                <div
                  key={`sep-${i}`}
                  style={{
                    height: 1,
                    background: 'var(--color-border)',
                    margin: '3px 0',
                  }}
                />
              ) : (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    item.action?.();
                    hideMenu();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: item.disabled ? 'default' : 'pointer',
                    textAlign: 'left',
                    color: item.disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => {
                    if (!item.disabled)
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {item.icon && (
                    <span style={{ color: 'var(--color-text-tertiary)', display: 'flex' }}>{item.icon}</span>
                  )}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.shortcut && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{item.shortcut}</span>
                  )}
                </button>
              )
            )}
          </div>
        </>
      )}
    </ContextMenuContext.Provider>
  );
}
