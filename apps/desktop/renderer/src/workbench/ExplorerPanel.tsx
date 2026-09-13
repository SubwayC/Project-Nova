import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';

type FileEntry = { name: string; path: string; isDirectory: boolean };

export function ExplorerPanel(): React.ReactElement {
  const projectPath = useEditorStore((state) => state.projectPath);
  const projectName = useEditorStore((state) => state.projectName);
  const setProjectPath = useEditorStore((state) => state.setProjectPath);
  const setProjectName = useEditorStore((state) => state.setProjectName);
  const setOpenFile = useWorkbenchStore((state) => state.setOpenFile);
  const [entries, setEntries] = React.useState<FileEntry[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadDirectory = React.useCallback(async (directoryPath: string) => {
    if (typeof window.nova === 'undefined') return;
    try {
      setIsLoading(true);
      setError(null);
      setEntries(await window.nova.fs.readDirectory(directoryPath));
    } catch (cause) {
      setError('Unable to read this folder');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (projectPath) void loadDirectory(projectPath);
    else setEntries([]);
  }, [projectPath, loadDirectory]);

  const handleOpenFolder = async () => {
    if (typeof window.nova === 'undefined') return;
    const directory = await window.nova.dialog.openDirectory();
    if (!directory) return;
    setProjectPath(directory);
    setProjectName(directory.split(/[\\/]/).pop() || 'Project');
  };

  const handleEntryClick = async (entry: FileEntry, parentPath: string) => {
    const entryPath = entry.path;
    if (entry.isDirectory) {
      const isOpen = expanded[entryPath] ?? false;
      setExpanded((current) => ({ ...current, [entryPath]: !isOpen }));
      return;
    }
    try {
      const content = await window.nova.fs.readFile(entryPath);
      setOpenFile(entryPath, content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to preview this file');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 14px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>EXPLORER</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {projectPath && <button title="Refresh Explorer" onClick={() => void loadDirectory(projectPath)} style={iconButtonStyle} disabled={isLoading}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M13 5a5 5 0 1 0 1 5" /><path d="M13 2v3h-3" /></svg>
          </button>}
          <button title="Open Folder" onClick={handleOpenFolder} style={iconButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 4.5h4l1.3 1.5H14v6.5H2z" /><path d="M2 4.5V3h4l1.3 1.5" /></svg>
          </button>
        </div>
      </div>

      {!projectPath ? (
        <div style={emptyStyle}>
          <span>No folder opened</span>
          <button className="nova-btn nova-btn-secondary" onClick={handleOpenFolder}>Open Folder</button>
        </div>
      ) : (
        <div style={{ overflow: 'auto', padding: '2px 6px 12px' }}>
          <div style={sectionStyle}>{projectName.toUpperCase()}</div>
          {entries.map((entry) => (
            <TreeEntry key={entry.name} entry={entry} parentPath={projectPath} depth={0} expanded={expanded} onClick={handleEntryClick} />
          ))}
          {entries.length === 0 && !error && <div style={messageStyle}>Folder is empty</div>}
          {error && <div style={{ ...messageStyle, color: '#b42318' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

function TreeEntry({ entry, parentPath, depth, expanded, onClick }: { entry: FileEntry; parentPath: string; depth: number; expanded: Record<string, boolean>; onClick: (entry: FileEntry, parentPath: string) => void }): React.ReactElement {
  const entryPath = entry.path;
  const isExpanded = expanded[entryPath] ?? false;
  const [children, setChildren] = React.useState<FileEntry[]>([]);

  React.useEffect(() => {
    if (!entry.isDirectory || !isExpanded || typeof window.nova === 'undefined') return;
    window.nova.fs.readDirectory(entryPath).then(setChildren).catch(() => setChildren([]));
  }, [entry.isDirectory, entryPath, isExpanded]);

  return (
    <>
      <button onClick={() => onClick(entry, parentPath)} style={{ ...treeButtonStyle, paddingLeft: 8 + depth * 14 }}>
        <span style={{ width: 14, color: 'var(--color-text-tertiary)', display: 'inline-flex' }}>
          {entry.isDirectory && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d={isExpanded ? 'M3 4.5l3 3 3-3' : 'M4.5 3l3 3-3 3'} /></svg>}
        </span>
        <span style={{ color: entry.isDirectory ? '#b47b18' : 'var(--color-text-secondary)', display: 'inline-flex' }}>{entry.isDirectory ? '▰' : '□'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
      </button>
      {isExpanded && children.map((child) => <TreeEntry key={child.name} entry={child} parentPath={entryPath} depth={depth + 1} expanded={expanded} onClick={onClick} />)}
    </>
  );
}

const iconButtonStyle: React.CSSProperties = { border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', padding: 4 };
const sectionStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', padding: '8px 6px 5px', letterSpacing: '0.04em' };
const treeButtonStyle: React.CSSProperties = { width: '100%', height: 26, display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 12, textAlign: 'left' };
const emptyStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1, color: 'var(--color-text-tertiary)', fontSize: 12 };
const messageStyle: React.CSSProperties = { padding: '12px 8px', color: 'var(--color-text-tertiary)', fontSize: 12 };

