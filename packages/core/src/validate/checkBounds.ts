import { rectContains, rectOfTile, type Rect } from '../shared/index.js';
import { IssueKind, type Issue } from '../issues/index.js';
import { layerOf, TileLayer, type Board, type Tile, type ValidCandidate } from '../model/index.js';
import { cell, type Cell } from '../shared/units/Cell.js';
import type { EngineContext } from '../engine/index.js';

// Grid tiles must lie inside the board, and so must a snapped Overlay tile's integer cell —
// a Free tile is exempt, free to sit anywhere, on or off the board, independent of the grid.
export function checkBounds(state: ValidCandidate, ctx: EngineContext): readonly Issue[] {
  const boardRect: Rect<Cell> = { x: cell(0), y: cell(0), w: cell(ctx.grid.cols), h: cell(ctx.grid.rows) };
  return state.boards.flatMap((board) => issuesForBoard(board, boardRect));
}

function issuesForBoard(board: Board, boardRect: Rect<Cell>): readonly Issue[] {
  const issues: Issue[] = [];
  for (const tile of board.tiles) {
    if (!inBoundsRect(tile, boardRect)) {
      issues.push({ kind: IssueKind.OutOfBounds, board: board.id, tile: tile.id, message: `Tile ${tile.id} lies outside the board.` });
    }
  }
  return issues;
}

function inBoundsRect(tile: Tile, boardRect: Rect<Cell>): boolean {
  const layer = layerOf(tile);
  if (layer === TileLayer.Free) return true;
  if (layer === TileLayer.Grid) return rectContains(boardRect, rectOfTile({ x: tile.col, y: tile.row }, tile.size));

  const float = tile.float;
  if (!float || !Number.isInteger(float.x) || !Number.isInteger(float.y)) return false;
  return rectContains(boardRect, rectOfTile({ x: cell(float.x), y: cell(float.y) }, tile.size));
}
