import type { ID, Color, Transform } from '@nova/shared';

// ─── Object Types ─────────────────────────────────────────────────────────────

export type NovaObjectType =
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'image'
  | 'svg'
  | 'group'
  | 'component-instance'
  | 'line'
  | 'path';

// ─── Fill & Stroke ────────────────────────────────────────────────────────────

export type FillType = 'solid' | 'gradient' | 'none';

export interface SolidFill {
  type: 'solid';
  color: Color;
}

export interface GradientStop {
  offset: number; // 0–1
  color: Color;
}

export interface LinearGradientFill {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  stops: GradientStop[];
  angle: number; // degrees, for linear
}

export type Fill = SolidFill | LinearGradientFill | { type: 'none' };

export interface Stroke {
  color: Color;
  width: number;
  alignment: 'inside' | 'center' | 'outside';
  dashArray?: number[];
}

// ─── Text Style ───────────────────────────────────────────────────────────────

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  color: Color;
  lineHeight: number; // multiplier
  letterSpacing: number; // px
  textDecoration: 'none' | 'underline' | 'line-through';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// ─── Object Style ─────────────────────────────────────────────────────────────

export interface ObjectStyle {
  fill: Fill;
  stroke?: Stroke;
  cornerRadius?: number; // for rectangles
  shadow?: Shadow;
  blur?: number;
}

export interface Shadow {
  color: Color;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  inset: boolean;
}

// ─── Base Object ──────────────────────────────────────────────────────────────

export interface NovaObjectBase {
  id: ID;
  type: NovaObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0–1
  visible: boolean;
  locked: boolean;
  parentId: ID | null;
  style: ObjectStyle;
  /** Extra metadata for extensibility */
  meta?: Record<string, unknown>;
}

// ─── Concrete Object Types ────────────────────────────────────────────────────

export interface RectangleObject extends NovaObjectBase {
  type: 'rectangle';
}

export interface CircleObject extends NovaObjectBase {
  type: 'circle';
}

export interface TextObject extends NovaObjectBase {
  type: 'text';
  content: string;
  textStyle: TextStyle;
  autoResize: boolean; // if true, height grows with content
}

export interface ImageObject extends NovaObjectBase {
  type: 'image';
  assetId: ID;
  preserveAspectRatio: boolean;
  fit: 'fill' | 'contain' | 'cover' | 'none';
}

export interface SvgObject extends NovaObjectBase {
  type: 'svg';
  assetId: ID;
  svgContent?: string; // inline SVG fallback
}

export interface GroupObject extends NovaObjectBase {
  type: 'group';
  children: ID[]; // ordered list of child object IDs
}

export interface LineObject extends NovaObjectBase {
  type: 'line';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

export interface ComponentInstanceObject extends NovaObjectBase {
  type: 'component-instance';
  componentId: ID;
  overrides: Record<string, unknown>;
}

/** Union of all object types */
export type NovaObject =
  | RectangleObject
  | CircleObject
  | TextObject
  | ImageObject
  | SvgObject
  | GroupObject
  | LineObject
  | ComponentInstanceObject;

// ─── Page ─────────────────────────────────────────────────────────────────────

export interface PageBackground {
  type: 'color' | 'image' | 'none';
  color?: Color;
  assetId?: ID;
}

export interface PageGrid {
  enabled: boolean;
  size: number;
  color: Color;
  majorEvery: number;
}

export interface Page {
  id: ID;
  name: string;
  width: number;
  height: number;
  background: PageBackground;
  grid: PageGrid;
  /** Ordered list of top-level object IDs (bottom to top) */
  objectIds: ID[];
  /** All objects on this page, keyed by ID */
  objects: Record<ID, NovaObject>;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface ProjectMetadata {
  id: ID;
  name: string;
  description: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  version: string; // app version that saved this
  author?: string;
  tags: string[];
}

export interface ProjectSettings {
  defaultPageWidth: number;
  defaultPageHeight: number;
  defaultBackgroundColor: string;
  snapToGrid: boolean;
  snapToObjects: boolean;
  gridSize: number;
  showGrid: boolean;
  showGuides: boolean;
  autoSave: boolean;
  autoSaveIntervalMs: number;
}

export interface Project {
  metadata: ProjectMetadata;
  pages: Page[];
  /** Currently active page ID */
  activePageId: ID;
  settings: ProjectSettings;
  /** Asset IDs referenced by this project */
  assetIds: ID[];
  /** Component definitions (reusable) */
  components: Record<ID, ComponentDefinition>;
  /** Shared styles */
  styles: Record<ID, SharedStyle>;
}

// ─── Components ───────────────────────────────────────────────────────────────

export interface ComponentDefinition {
  id: ID;
  name: string;
  description: string;
  rootObjectId: ID;
  objects: Record<ID, NovaObject>;
  properties: ComponentProperty[];
}

export interface ComponentProperty {
  name: string;
  type: 'text' | 'color' | 'boolean' | 'number' | 'image';
  defaultValue: unknown;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

export interface SharedStyle {
  id: ID;
  name: string;
  style: Partial<ObjectStyle>;
}
