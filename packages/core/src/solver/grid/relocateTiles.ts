import { branchAndBound } from '../search/index.js';
import { findDisplaced } from './occupancy/findDisplaced.js';
import { buildRelocationBoard } from './search/buildRelocationBoard.js';
import { toSearchProblem } from './toSearchProblem.js';
import { toRelocation } from './toRelocation.js';
import { exceedsCapacity } from './exceedsCapacity.js';
import { err } from '../../shared/index.js';
import type { RelocationInput } from './RelocationInput.js';
import type { Relocation } from './Relocation.js';

export function relocateTiles(input: RelocationInput): Relocation {
  const shared = { tiles: input.tiles, pinnedTileId: input.pinnedTileId, pinnedRect: input.pinnedRect, sizeOf: input.sizeOf };
  const displaced = findDisplaced(shared);
  if (exceedsCapacity(input)) return err({ blockedBy: displaced });
  const board = buildRelocationBoard({ ...shared, grid: input.grid, displaced, order: input.options.directions });
  const problem = toSearchProblem(board);
  const outcome = branchAndBound(problem, { maxNodes: input.options.maxNodes });
  return toRelocation(outcome, displaced);
}
