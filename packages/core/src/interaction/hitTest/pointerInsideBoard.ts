import type { Point } from '../../shared/geometry/Point.js';
import type { Rect } from '../../shared/geometry/Rect.js';
import type { Px } from '../../shared/units/Px.js';

// A release past the board's edge cancels rather than drops, even though the target
// cell itself is always clamped inside the board.
export function pointerInsideBoard(pointer: Point<Px>, boardRectPx: Rect<Px>): boolean {
  return (
    pointer.x >= boardRectPx.x &&
    pointer.x <= boardRectPx.x + boardRectPx.w &&
    pointer.y >= boardRectPx.y &&
    pointer.y <= boardRectPx.y + boardRectPx.h
  );
}
