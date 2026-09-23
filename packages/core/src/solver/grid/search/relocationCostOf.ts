import type { RelocationState } from './RelocationState.js';

export const TILES_MOVED_WEIGHT = 1_000_000;
export const DISTANCE_WEIGHT = 10;

// Lexicographic priority: fewest tiles moved, then shortest total distance, then direction.
export function relocationCostOf(state: RelocationState): number {
  return state.tilesMoved * TILES_MOVED_WEIGHT + state.totalDistance * DISTANCE_WEIGHT + state.directionPenalty;
}
