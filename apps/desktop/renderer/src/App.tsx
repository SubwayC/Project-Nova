import React, { useEffect } from 'react';
import { Workbench } from './workbench/Workbench';
import { useEngineStore } from './stores/useEngineStore';
import { useWorkbenchStore } from './stores/useWorkbenchStore';
import { useProjectStore } from './stores/useProjectStore';
import { useHistoryStore } from './stores/useHistoryStore';

export function App(): React.ReactElement {
  const { initEngine } = useEngineStore();
  const { setMaximized } = useWorkbenchStore();
  const { setProject } = useProjectStore();
  const { setHistoryState } = useHistoryStore();

  useEffect(() => {
    // Initialize the core engine
    const engine = initEngine();

    // Sync project to store
    const unsubProject = engine.on('project:changed', ({ project }) => {
      setProject(project);
    });

    // Sync history to store
    const unsubHistory = engine.on('history:changed', ({ canUndo, canRedo }) => {
      setHistoryState(canUndo, canRedo);
    });

    // Initialize project in store
    setProject(engine.document.project);

    // Listen for window state changes from Electron
    const isElectron = typeof window.nova !== 'undefined';
    let unsubWindow: (() => void) | null = null;
    if (isElectron) {
      unsubWindow = window.nova.window.onStateChanged(({ maximized }) => {
        setMaximized(maximized);
      });
      // Get initial maximized state
      window.nova.window.isMaximized().then(setMaximized).catch(() => {});
    }

    return () => {
      unsubProject();
      unsubHistory();
      unsubWindow?.();
    };
  }, []);

  return <Workbench />;
}
