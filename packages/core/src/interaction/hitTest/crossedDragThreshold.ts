import type { Point } from '../../shared/geometry/Point.js';
import type { Px } from '../../shared/units/Px.js';

// Squared-distance comparison, so no square root on the pointer path.
export function crossedDragThreshold(origin: Point<Px>, at: Point<Px>, thresholdPx: number): boolean {
  const dx = at.x - origin.x;
  const dy = at.y - origin.y;
  return dx * dx + dy * dy >= thresholdPx * thresholdPx;
}
