import type { Point } from '../../shared/geometry/Point.js';
import type { Rect } from '../../shared/geometry/Rect.js';
import type { Px } from '../../shared/units/Px.js';

export interface FractionalCell {
  readonly x: number;
  readonly y: number;
}

// The continuous (pre-rounding, pre-hysteresis) cell position of a pixel point within the
// board's rect — no DOM measurement here, just the arithmetic.
export function pxToFractionalCell(point: Point<Px>, boardRectPx: Rect<Px>, grid: { readonly cols: number; readonly rows: number }): FractionalCell {
  return {
    x: ((point.x - boardRectPx.x) / boardRectPx.w) * grid.cols,
    y: ((point.y - boardRectPx.y) / boardRectPx.h) * grid.rows,
  };
}
