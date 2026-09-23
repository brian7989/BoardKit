import { px, type Px } from '../../shared/units/Px.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Rect } from '../../shared/geometry/Rect.js';
import type { Size } from '../../shared/sizes/Size.js';
import { pxToFractionalCell, type FractionalCell } from './pxToFractionalCell.js';

export interface FractionalOriginInput {
  readonly pointer: Point<Px>;
  readonly grabOffset: Point<Px>;
  readonly boardRectPx: Rect<Px>;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly size: Size;
}

const MIN = 0;

export function fractionalOrigin(input: FractionalOriginInput): FractionalCell {
  const originPx: Point<Px> = {
    x: px(input.pointer.x - input.grabOffset.x),
    y: px(input.pointer.y - input.grabOffset.y),
  };
  const raw = pxToFractionalCell(originPx, input.boardRectPx, input.grid);
  return {
    x: Math.min(Math.max(raw.x, MIN), Math.max(input.grid.cols - input.size.w, MIN)),
    y: Math.min(Math.max(raw.y, MIN), Math.max(input.grid.rows - input.size.h, MIN)),
  };
}
