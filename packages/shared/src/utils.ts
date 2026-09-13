import { nanoid } from 'nanoid';
import type { Bounds, Color, Vector2 } from './types';

// ─── ID ────────────────────────────────────────────────────────────────────────

/** Generate a short unique ID */
export function generateId(prefix?: string): string {
  const id = nanoid(12);
  return prefix ? `${prefix}_${id}` : id;
}

// ─── Math ─────────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

export function boundsContainPoint(bounds: Bounds, point: Vector2): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getBoundingBox(rects: Bounds[]): Bounds | null {
  if (rects.length === 0) return null;
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const maxY = Math.max(...rects.map((r) => r.y + r.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ─── Color ────────────────────────────────────────────────────────────────────

export function colorToHex(color: Color): string {
  const r = Math.round(clamp(color.r, 0, 255))
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(clamp(color.g, 0, 255))
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(clamp(color.b, 0, 255))
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function hexToColor(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: parseInt(result[1] ?? '0', 16),
    g: parseInt(result[2] ?? '0', 16),
    b: parseInt(result[3] ?? '0', 16),
    a: 1,
  };
}

export function colorToRgba(color: Color): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
}

export function colorToNumber(color: Color): number {
  return (Math.round(color.r) << 16) | (Math.round(color.g) << 8) | Math.round(color.b);
}

// ─── Deep Clone ───────────────────────────────────────────────────────────────

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ─── Logging ──────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PREFIX = '[Nova]';

export const logger = {
  debug: (msg: string, ...args: unknown[]) =>
    console.info(`${LOG_PREFIX} [DEBUG] ${msg}`, ...args),
  info: (msg: string, ...args: unknown[]) =>
    console.info(`${LOG_PREFIX} [INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`${LOG_PREFIX} [WARN] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`${LOG_PREFIX} [ERROR] ${msg}`, ...args),
};
