import React from 'react';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';

export function FileViewer(): React.ReactElement {
  const filePath = useWorkbenchStore((state) => state.openFilePath);
  const content = useWorkbenchStore((state) => state.openFileContent);
  const closeOpenFile = useWorkbenchStore((state) => state.closeOpenFile);
  const fileName = filePath?.split(/[\\/]/).pop() || 'File';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--color-panel)', flexShrink: 0 }}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRight: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-primary)' }}>
          <span style={{ color: 'var(--color-accent)' }}>□</span>{fileName}
          <button title="Close file" onClick={closeOpenFile} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <pre style={{ margin: 0, padding: '16px 20px', overflow: 'auto', flex: 1, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace", fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', userSelect: 'text' }}>
        {content}
      </pre>
    </div>
  );
}
