import { generateId } from '@nova/shared';
import type { ID } from '@nova/shared';
import type {
  NovaObject,
  RectangleObject,
  CircleObject,
  TextObject,
  ImageObject,
  GroupObject,
  ObjectStyle,
  TextStyle,
} from './types';
import { createDefaultStyle } from './DocumentEngine';
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_SIZE,
  DEFAULT_OBJECT_WIDTH,
  DEFAULT_OBJECT_HEIGHT,
} from '@nova/shared';

// ─── Object Factories ─────────────────────────────────────────────────────────

export interface ObjectCreateOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  parentId?: ID | null;
}

export function createRectangle(opts: ObjectCreateOptions = {}): RectangleObject {
  return {
    id: generateId('rect'),
    type: 'rectangle',
    name: opts.name ?? 'Rectangle',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: opts.width ?? DEFAULT_OBJECT_WIDTH,
    height: opts.height ?? DEFAULT_OBJECT_HEIGHT,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    parentId: opts.parentId ?? null,
    style: createDefaultStyle(),
  };
}

export function createCircle(opts: ObjectCreateOptions = {}): CircleObject {
  return {
    id: generateId('circle'),
    type: 'circle',
    name: opts.name ?? 'Ellipse',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: opts.width ?? DEFAULT_OBJECT_WIDTH,
    height: opts.height ?? DEFAULT_OBJECT_HEIGHT,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    parentId: opts.parentId ?? null,
    style: {
      fill: { type: 'solid', color: { r: 255, g: 100, b: 100, a: 1 } },
    },
  };
}

export function createDefaultTextStyle(): TextStyle {
  return {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_TEXT_SIZE,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    verticalAlign: 'top',
    color: { r: 30, g: 30, b: 30, a: 1 },
    lineHeight: 1.4,
    letterSpacing: 0,
    textDecoration: 'none',
    textTransform: 'none',
  };
}

export function createText(opts: ObjectCreateOptions & { content?: string } = {}): TextObject {
  return {
    id: generateId('text'),
    type: 'text',
    name: opts.name ?? 'Text',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: opts.width ?? 200,
    height: opts.height ?? 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    parentId: opts.parentId ?? null,
    style: { fill: { type: 'none' } },
    content: opts.content ?? 'Text',
    textStyle: createDefaultTextStyle(),
    autoResize: true,
  };
}

export function createImage(
  opts: ObjectCreateOptions & { assetId: ID; name?: string }
): ImageObject {
  return {
    id: generateId('img'),
    type: 'image',
    name: opts.name ?? 'Image',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: opts.width ?? 400,
    height: opts.height ?? 300,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    parentId: opts.parentId ?? null,
    style: { fill: { type: 'none' } },
    assetId: opts.assetId,
    preserveAspectRatio: true,
    fit: 'contain',
  };
}

export function createGroup(opts: ObjectCreateOptions & { children?: ID[] } = {}): GroupObject {
  return {
    id: generateId('group'),
    type: 'group',
    name: opts.name ?? 'Group',
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    width: opts.width ?? 0,
    height: opts.height ?? 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    parentId: opts.parentId ?? null,
    style: { fill: { type: 'none' } },
    children: opts.children ?? [],
  };
}
