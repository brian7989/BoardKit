import type { Board } from '../model/Board.js';
import type { Tile } from '../model/Tile.js';
import type { LayoutTile } from '../model/LayoutTile.js';
import type { BoardId } from '../shared/ids/BoardId.js';

function toLayoutTile(tile: Tile, board: BoardId): LayoutTile {
  const float = tile.float ? { float: tile.float } : {};
  return { tile: tile.id, board, col: tile.col, row: tile.row, size: tile.size, ...float, items: tile.items.map((item) => item.id), active: tile.active };
}

// A breakpoint's saved layout is just enough to restore it later: each tile's page, position, size,
// float and widgets, plus which tiles were parked there, so they stay parked when the board comes back.
export function snapshotLayout(boards: readonly Board[], parked: readonly Tile[], firstPage: BoardId): readonly LayoutTile[] {
  const shown = boards.flatMap((board) => board.tiles.map((tile) => toLayoutTile(tile, board.id)));
  return [...shown, ...parked.map((tile): LayoutTile => ({ ...toLayoutTile(tile, firstPage), hidden: true }))];
}
