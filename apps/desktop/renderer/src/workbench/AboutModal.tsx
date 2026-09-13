import React, { useEffect, useState } from 'react';
import './AboutModal.css';

const isElectron = typeof window !== 'undefined' && 'nova' in window;

export function AboutModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const [version, setVersion] = useState('0.1.0');

  useEffect(() => {
    if (isElectron && window.nova?.app?.getVersion) {
      window.nova.app
        .getVersion()
        .then(setVersion)
        .catch(() => {});
    }
  }, []);

  return (
    <div
      className="about-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="about-modal">
        <button className="about-close" onClick={onClose} title="Close">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
        <div className="about-content">
          <div className="about-logo">
            <svg width="28" height="28" viewBox="0 0 12 12" fill="none">
              <polygon points="6,1 11,10 1,10" fill="white" />
            </svg>
          </div>
          <h2>Project Nova</h2>
          <p>Version {version}</p>
          <p className="about-os">Offline-first Visual Canvas & Design Engine</p>
          <div className="about-description">
            <p>Built with React, PixiJS, SQLite, and Electron.</p>
            <p>High-performance rendering with infinite canvas workspace.</p>
          </div>
          <div className="about-copyright">© 2026 Project Nova. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}
