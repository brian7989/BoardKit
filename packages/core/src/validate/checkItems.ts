import { IssueKind, type Issue } from '../issues/index.js';
import type { ValidCandidate } from '../model/index.js';

export function checkItems(state: ValidCandidate): readonly Issue[] {
  const issues: Issue[] = [];
  for (const board of state.boards) {
    for (const tile of board.tiles) {
      issues.push(...issuesForTile(tile, board.id));
    }
  }
  return issues;
}

function issuesForTile(
  tile: ValidCandidate['boards'][number]['tiles'][number],
  boardId: ValidCandidate['boards'][number]['id'],
): readonly Issue[] {
  if (tile.items.length === 0) {
    return [{ kind: IssueKind.EmptyTile, board: boardId, tile: tile.id, message: `Tile ${tile.id} has no items.` }];
  }
  if (tile.active < 0 || tile.active >= tile.items.length) {
    return [{ kind: IssueKind.BadActiveIndex, board: boardId, tile: tile.id, message: `Tile ${tile.id} has an out-of-range active index.` }];
  }
  return [];
}
