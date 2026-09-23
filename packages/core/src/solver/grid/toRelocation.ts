import { err, ok } from '../../shared/index.js';
import { assertNever } from '../../shared/unions/assertNever.js';
import { SearchStatus, type SearchOutcome } from '../search/index.js';
import type { RelocationState } from './search/RelocationState.js';
import type { Relocation } from './Relocation.js';
import type { TileId } from '../../shared/ids/TileId.js';

// None and BudgetExhausted both mean no relocation was found; the search never yields a
// best-effort partial answer, so preview and commit always agree.
export function toRelocation(outcome: SearchOutcome<RelocationState>, initiallyDisplaced: readonly TileId[]): Relocation {
  switch (outcome.status) {
    case SearchStatus.Solved:
      return ok(outcome.solution.placed ?? new Map());
    case SearchStatus.None:
    case SearchStatus.BudgetExhausted:
      return err({ blockedBy: initiallyDisplaced });
    default:
      return assertNever(outcome);
  }
}
