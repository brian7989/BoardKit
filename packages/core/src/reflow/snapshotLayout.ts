import type { Board } from '../model/Board.js';
import type { Tile } from '../model/Tile.js';
import type { LayoutTile } from '../model/LayoutTile.js';
import type { BoardId } from '../shared/ids/BoardId.js';

function toLayoutTile(tile: Tile, board: BoardId): LayoutTile {
  return { tile: tile.id, board, col: tile.col, row: tile.row, size: tile.size, ...(tile.float ? { float: tile.float } : {}) };
}

// A breakpoint's saved layout is just enough to restore it later: page, position, size and float.
export function snapshotLayout(boards: readonly Board[]): readonly LayoutTile[] {
  return boards.flatMap((board) => board.tiles.map((tile) => toLayoutTile(tile, board.id)));
}
