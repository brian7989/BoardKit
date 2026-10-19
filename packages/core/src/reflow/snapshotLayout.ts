import type { Board } from '../model/Board.js';
import type { Tile } from '../model/Tile.js';
import type { LayoutTile } from '../model/LayoutTile.js';
import type { BoardId } from '../shared/ids/BoardId.js';

function toLayoutTile(tile: Tile, board: BoardId): LayoutTile {
  return { tile: tile.id, board, col: tile.col, row: tile.row, size: tile.size, ...(tile.float ? { float: tile.float } : {}) };
}

// A breakpoint's saved layout is just enough to restore it later: page, position, size and float,
// plus which tiles were parked there, so they stay parked when the board comes back to this grid.
export function snapshotLayout(boards: readonly Board[], parked: readonly Tile[], firstPage: BoardId): readonly LayoutTile[] {
  const shown = boards.flatMap((board) => board.tiles.map((tile) => toLayoutTile(tile, board.id)));
  return [...shown, ...parked.map((tile): LayoutTile => ({ ...toLayoutTile(tile, firstPage), hidden: true }))];
}
