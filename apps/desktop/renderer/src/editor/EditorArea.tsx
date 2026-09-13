import React from 'react';
import { Toolbar } from './Toolbar';
import { CanvasContainer } from './CanvasContainer';
import { FileViewer } from './FileViewer';
import { useWorkbenchStore } from '../stores/useWorkbenchStore';

export function EditorArea(): React.ReactElement {
  const openFilePath = useWorkbenchStore((state) => state.openFilePath);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {openFilePath ? <FileViewer /> : <Toolbar />}

      {/* Canvas */}
      {!openFilePath && (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <CanvasContainer />
        </div>
      )}
    </div>
  );
}
