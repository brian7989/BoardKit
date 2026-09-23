import type { Board } from '../../model/index.js';
import type { TileId } from '../../shared/ids/TileId.js';

// Appends the source tile's items onto the target's and drops the source tile. The first
// incoming (source) item becomes active, matching the iOS stacking convention.
export function merge(board: Board, sourceId: TileId, targetId: TileId): Board {
  const source = board.tiles.find((tile) => tile.id === sourceId);
  const target = board.tiles.find((tile) => tile.id === targetId);
  if (!source || !target) return board;

  const items = [...target.items, ...source.items];
  const tiles = board.tiles
    .filter((tile) => tile.id !== sourceId)
    .map((tile) => (tile.id === targetId ? { ...tile, items, active: target.items.length } : tile));
  return { ...board, tiles };
}
