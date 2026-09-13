import React from 'react';
import './ShortcutsModal.css';

export function ShortcutsModal({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <div
      className="shortcuts-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <h3>Keyboard Shortcuts</h3>
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
        </div>
        <div className="shortcuts-body">
          {/* Tools Section */}
          <div className="shortcuts-section">
            <div className="shortcuts-section-title">Tools</div>
            <div className="shortcuts-grid">
              <div className="shortcuts-row">
                <span>Select Tool</span>
                <kbd>V</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Rectangle Tool</span>
                <kbd>R</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Ellipse Tool</span>
                <kbd>O</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Text Tool</span>
                <kbd>T</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Pan / Hand Tool</span>
                <kbd>H</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Image Tool</span>
                <kbd>I</kbd>
              </div>
            </div>
          </div>

          {/* Canvas & Edit Section */}
          <div className="shortcuts-section">
            <div className="shortcuts-section-title">Editing & Selection</div>
            <div className="shortcuts-grid">
              <div className="shortcuts-row">
                <span>Undo</span>
                <kbd>Ctrl+Z</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Redo</span>
                <kbd>Ctrl+Y / Ctrl+Shift+Z</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Duplicate Selection</span>
                <kbd>Ctrl+D</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Delete Selection</span>
                <kbd>Del / Backspace</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Select All</span>
                <kbd>Ctrl+A</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Deselect</span>
                <kbd>Esc</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Bring to Front</span>
                <kbd>Ctrl+]</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Send to Back</span>
                <kbd>Ctrl+[</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Nudge 1px</span>
                <kbd>Arrow Keys</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Nudge 10px</span>
                <kbd>Shift + Arrow</kbd>
              </div>
            </div>
          </div>

          {/* View & Panels */}
          <div className="shortcuts-section">
            <div className="shortcuts-section-title">View & Navigation</div>
            <div className="shortcuts-grid">
              <div className="shortcuts-row">
                <span>Command Palette</span>
                <kbd>Ctrl+K</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Toggle Primary Sidebar</span>
                <kbd>Ctrl+B</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Toggle Bottom Panel</span>
                <kbd>Ctrl+`</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Zoom In</span>
                <kbd>Ctrl+=</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Zoom Out</span>
                <kbd>Ctrl+-</kbd>
              </div>
              <div className="shortcuts-row">
                <span>Reset Zoom (100%)</span>
                <kbd>Ctrl+0</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
