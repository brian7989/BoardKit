import { rectOfTile, rectsIntersect } from '../shared/index.js';
import type { Rect } from '../shared/geometry/Rect.js';
import type { Cell } from '../shared/units/Cell.js';
import { IssueKind, type Issue } from '../issues/index.js';
import { isFloating, type Board, type Tile, type ValidCandidate } from '../model/index.js';

export function checkOverlap(state: ValidCandidate): readonly Issue[] {
  return state.boards.flatMap((board) => issuesForBoard(board));
}

// A floating tile is independent of the grid: it never collides with anything, and
// nothing else needs to avoid it either.
function issuesForBoard(board: Board): readonly Issue[] {
  const tiles = board.tiles.filter((tile) => !isFloating(tile));
  const rects = tiles.map((tile) => rectOfTile({ x: tile.col, y: tile.row }, tile.size));
  const issues: Issue[] = [];
  for (let index = 0; index < tiles.length; index += 1) {
    issues.push(...overlapsWithLater({ tiles, rects, index, boardId: board.id }));
  }
  return issues;
}

interface OverlapsInput {
  readonly tiles: readonly Tile[];
  readonly rects: readonly Rect<Cell>[];
  readonly index: number;
  readonly boardId: Board['id'];
}

function overlapsWithLater(input: OverlapsInput): readonly Issue[] {
  const { tiles, rects, index, boardId } = input;
  const tile = tiles[index];
  const rect = rects[index];
  if (!tile || !rect) return [];

  const issues: Issue[] = [];
  for (let j = index + 1; j < tiles.length; j += 1) {
    const other = tiles[j];
    const otherRect = rects[j];
    if (other && otherRect && rectsIntersect(rect, otherRect)) {
      issues.push({ kind: IssueKind.Overlap, board: boardId, tile: tile.id, message: `Tile ${tile.id} overlaps ${other.id}.` });
    }
  }
  return issues;
}
