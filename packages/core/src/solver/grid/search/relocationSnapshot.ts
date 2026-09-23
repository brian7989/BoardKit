import type { Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import type { TileId } from '../../../shared/ids/TileId.js';
import type { RelocationState } from './RelocationState.js';

// Freezes the board's current placements into an independent map, before further
// backtracking mutates the shared board out from under a recorded best solution.
export function relocationSnapshot(state: RelocationState): RelocationState {
  const placed = new Map<TileId, Rect<Cell>>();
  const { placedRect, tileIds } = state.board;
  for (let index = 0; index < placedRect.length; index += 1) {
    const rect = placedRect[index];
    const id = tileIds[index];
    if (rect && id !== undefined) placed.set(id, rect);
  }
  return { ...state, placed };
}
