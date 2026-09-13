// ─── Application Constants ────────────────────────────────────────────────────

export const APP_NAME = 'Project Nova';
export const APP_VERSION = '0.1.0';
export const PROJECT_FILE_EXTENSION = '.nova';
export const PROJECT_MANIFEST_NAME = 'project.json';

// ─── Canvas Defaults ─────────────────────────────────────────────────────────

export const DEFAULT_CANVAS_WIDTH = 1920;
export const DEFAULT_CANVAS_HEIGHT = 1080;
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
export const DEFAULT_GRID_SIZE = 8;
export const DEFAULT_MAJOR_GRID_MULTIPLIER = 10;

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 50;
export const ZOOM_STEP = 0.1;
export const DEFAULT_ZOOM = 1;

// ─── Object Defaults ──────────────────────────────────────────────────────────

export const MIN_OBJECT_SIZE = 1;
export const DEFAULT_OBJECT_WIDTH = 200;
export const DEFAULT_OBJECT_HEIGHT = 100;
export const DEFAULT_TEXT_SIZE = 16;
export const DEFAULT_FONT_FAMILY = 'Inter, system-ui, sans-serif';

// ─── History ──────────────────────────────────────────────────────────────────

export const MAX_HISTORY_SIZE = 200;

// ─── Snapping ─────────────────────────────────────────────────────────────────

export const DEFAULT_SNAP_THRESHOLD = 6; // pixels at zoom=1

// ─── Keyboard ─────────────────────────────────────────────────────────────────

export const KEYS = {
  ESCAPE: 'Escape',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  Z: 'z',
  Y: 'y',
  C: 'c',
  V: 'v',
  X: 'x',
  D: 'd',
  A: 'a',
  S: 's',
  G: 'g',
  L: 'l',
  R: 'r',
  T: 't',
  K: 'k',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;
