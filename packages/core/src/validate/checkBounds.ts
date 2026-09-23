import { rectContains, rectOfTile, type Rect } from '../shared/index.js';
import { IssueKind, type Issue } from '../issues/index.js';
import { isFloating, type Board, type ValidCandidate } from '../model/index.js';
import { cell, type Cell } from '../shared/units/Cell.js';
import type { EngineContext } from '../engine/index.js';

// Every tile's rect must lie inside the board — except a floating one, which is free
// to sit anywhere, on or off the board, independent of the grid entirely.
export function checkBounds(state: ValidCandidate, ctx: EngineContext): readonly Issue[] {
  const boardRect: Rect<Cell> = { x: cell(0), y: cell(0), w: cell(ctx.grid.cols), h: cell(ctx.grid.rows) };
  return state.boards.flatMap((board) => issuesForBoard(board, boardRect));
}

function issuesForBoard(board: Board, boardRect: Rect<Cell>): readonly Issue[] {
  const issues: Issue[] = [];
  for (const tile of board.tiles) {
    if (isFloating(tile)) continue;
    const rect = rectOfTile({ x: tile.col, y: tile.row }, tile.size);
    if (!rectContains(boardRect, rect)) {
      issues.push({ kind: IssueKind.OutOfBounds, board: board.id, tile: tile.id, message: `Tile ${tile.id} lies outside the board.` });
    }
  }
  return issues;
}
