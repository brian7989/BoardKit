import type { RelocationInput } from './RelocationInput.js';

// O(tiles) infeasibility check: no arrangement can fit more cell area than the grid has.
export function exceedsCapacity(input: RelocationInput): boolean {
  const pinnedArea = input.pinnedRect.w * input.pinnedRect.h;
  const tilesArea = input.tiles.reduce((sum, tile) => {
    if (tile.id === input.pinnedTileId) return sum;
    const size = input.sizeOf(tile);
    return sum + size.w * size.h;
  }, pinnedArea);
  return tilesArea > input.grid.cols * input.grid.rows;
}
