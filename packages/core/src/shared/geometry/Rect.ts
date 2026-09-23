import type { Point } from './Point.js';
import type { Size } from '../sizes/Size.js';
import { cell, type Cell } from '../units/Cell.js';

export interface Rect<U> {
  readonly x: U;
  readonly y: U;
  readonly w: U;
  readonly h: U;
}

// Generic so geometry doesn't depend on the model.
export function rectOfTile(origin: Point<Cell>, size: Size): Rect<Cell> {
  return { x: origin.x, y: origin.y, w: size.w, h: size.h };
}

// Two rects intersect when their spans overlap on both axes. Touching edges do not count.
export function rectsIntersect<U extends number>(a: Rect<U>, b: Rect<U>): boolean {
  const separateOnX = a.x + a.w <= b.x || b.x + b.w <= a.x;
  const separateOnY = a.y + a.h <= b.y || b.y + b.h <= a.y;
  return !separateOnX && !separateOnY;
}

export function rectsEqual<U extends number>(a: Rect<U>, b: Rect<U>): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

export function rectContains<U extends number>(outer: Rect<U>, inner: Rect<U>): boolean {
  const fitsX = inner.x >= outer.x && inner.x + inner.w <= outer.x + outer.w;
  const fitsY = inner.y >= outer.y && inner.y + inner.h <= outer.y + outer.h;
  return fitsX && fitsY;
}

// Never resizes; oversized rects stay out of bounds (caller rejects).
export function clampRectToBoard(rect: Rect<Cell>, grid: { cols: number; rows: number }): Rect<Cell> {
  const x = cell(Math.min(Math.max(rect.x, 0), Math.max(grid.cols - rect.w, 0)));
  const y = cell(Math.min(Math.max(rect.y, 0), Math.max(grid.rows - rect.h, 0)));
  return { x, y, w: rect.w, h: rect.h };
}
