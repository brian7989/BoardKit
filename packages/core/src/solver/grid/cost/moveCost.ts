import type { Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import { Direction } from './Direction.js';

const UNRANKED = 4;
const NOT_FOUND = -1;

function directionRank(direction: Direction, order: readonly Direction[]): number {
  const index = order.indexOf(direction);
  return index === NOT_FOUND ? UNRANKED : index;
}

export interface MoveCost {
  readonly distance: number;
  readonly direction: Direction;
  readonly rank: number;
}

// L1 distance from a tile's original rect to a candidate rect, plus the dominant-axis
// direction of that move (used only to break ties between equal-distance candidates).
export function moveCost(from: Rect<Cell>, to: Rect<Cell>, order: readonly Direction[]): MoveCost {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  const direction = directionOf(dx, dy);
  return { distance, direction, rank: directionRank(direction, order) };
}

function directionOf(dx: number, dy: number): Direction {
  if (dy > 0) return Direction.Down;
  if (dy < 0) return Direction.Up;
  if (dx > 0) return Direction.Right;
  if (dx < 0) return Direction.Left;
  return Direction.Down;
}
