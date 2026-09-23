import { rectOfTile, rectsIntersect, type Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import type { Size } from '../../../shared/sizes/Size.js';
import type { Tile } from '../../../model/Tile.js';
import type { TileId } from '../../../shared/ids/TileId.js';

export interface FindDisplacedInput {
  readonly tiles: readonly Tile[];
  readonly pinnedTileId: TileId;
  readonly pinnedRect: Rect<Cell>;
  readonly sizeOf: (tile: Tile) => Size;
}

// Tiles whose rect collides with the pinned rect, in deterministic (row, col, id) order
// so the search explores candidates in a stable sequence.
export function findDisplaced(input: FindDisplacedInput): readonly TileId[] {
  const collides = input.tiles.filter((tile) => {
    if (tile.id === input.pinnedTileId) return false;
    const rect = rectOfTile({ x: tile.col, y: tile.row }, input.sizeOf(tile));
    return rectsIntersect(rect, input.pinnedRect);
  });
  return collides
    .slice()
    .sort((a, b) => a.row - b.row || a.col - b.col || a.id.localeCompare(b.id))
    .map((tile) => tile.id);
}
