import { cell, type Cell } from '../../shared/units/Cell.js';
import type { Px } from '../../shared/units/Px.js';
import type { Point } from '../../shared/geometry/Point.js';
import { clampRectToBoard, type Rect } from '../../shared/geometry/Rect.js';
import type { Size } from '../../shared/sizes/Size.js';
import { fractionalOrigin } from './fractionalOrigin.js';
import { applyHysteresis } from './applyHysteresis.js';

export interface TargetFromPointerInput {
  readonly pointer: Point<Px>;
  readonly grabOffset: Point<Px>;
  readonly boardRectPx: Rect<Px>;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly size: Size;
  readonly previous: Point<Cell>;
  readonly hysteresisFraction: number;
}

// Pointer minus grab offset, converted to a cell with hysteresis, then clamped so the dragged
// tile can never end up off-board — overflow can only come from a push or resize.
export function targetFromPointer(input: TargetFromPointerInput): Point<Cell> {
  const raw = fractionalOrigin(input);
  const x = applyHysteresis(input.previous.x, raw.x, input.hysteresisFraction);
  const y = applyHysteresis(input.previous.y, raw.y, input.hysteresisFraction);
  const clamped = clampRectToBoard({ x: cell(x), y: cell(y), w: input.size.w, h: input.size.h }, input.grid);
  return { x: clamped.x, y: clamped.y };
}
