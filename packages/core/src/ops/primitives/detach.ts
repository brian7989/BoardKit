import type { Board } from '../../model/index.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { WidgetId } from '../../shared/ids/WidgetId.js';

export function detach(board: Board, tileId: TileId, widget?: WidgetId): Board {
  if (!widget) {
    return { ...board, tiles: board.tiles.filter((tile) => tile.id !== tileId) };
  }
  const tiles = board.tiles.map((tile) => {
    if (tile.id !== tileId) return tile;
    const removedIndex = tile.items.findIndex((item) => item.id === widget);
    const items = tile.items.filter((item) => item.id !== widget);
    const active = removedIndex < tile.active ? tile.active - 1 : Math.min(tile.active, items.length - 1);
    return { ...tile, items, active };
  });
  return { ...board, tiles };
}
