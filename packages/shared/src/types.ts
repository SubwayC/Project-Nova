// ─── Primitive Types ──────────────────────────────────────────────────────────

/** Unique identifier string */
export type ID = string;

/** 2D point */
export interface Vector2 {
  x: number;
  y: number;
}

/** Axis-aligned bounding box */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Full transform matrix representation */
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
}

/** RGBA color */
export interface Color {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
  a: number; // 0–1
}

// ─── Utility Types ────────────────────────────────────────────────────────────

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

// ─── Event System ─────────────────────────────────────────────────────────────

export type EventHandler<T = void> = (payload: T) => void;

export interface EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void;
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
}

// ─── Result Type ──────────────────────────────────────────────────────────────

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}
