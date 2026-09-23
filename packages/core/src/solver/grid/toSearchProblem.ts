import type { SearchProblem } from '../search/index.js';
import type { RelocationBoard } from './search/RelocationBoard.js';
import type { RelocationState } from './search/RelocationState.js';
import { relocationChildren } from './search/relocationChildren.js';
import { relocationCostOf } from './search/relocationCostOf.js';
import { relocationSnapshot } from './search/relocationSnapshot.js';

// No `hash`: two placements can share a placed-tile set yet still differ in queue order,
// which would change which of several equal-cost layouts is picked, so dedup is skipped here.
export function toSearchProblem(board: RelocationBoard): SearchProblem<RelocationState> {
  const initial: RelocationState = {
    board,
    remaining: board.queue.length - board.head,
    tilesMoved: 0,
    totalDistance: 0,
    directionPenalty: 0,
  };
  return {
    initial,
    isGoal: (state) => state.remaining === 0,
    costOf: relocationCostOf,
    snapshot: relocationSnapshot,
    children: relocationChildren,
  };
}
