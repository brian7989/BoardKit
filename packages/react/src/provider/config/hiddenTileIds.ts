import type { Tile, TileId } from 'boardkit-core';
import { warnOnce } from '../../shared/dev/warnOnce.js';

function warnPartlyHidden(tile: Tile, breakpoint: string): void {
  const types = tile.items.map((item) => item.type).join(' + ');
  warnOnce(`partly-hidden:${breakpoint}:${tile.id}`, `Boards: "${breakpoint}" hides only part of the ${types} stack; hide every widget in it to hide the tile.`);
}

/** The tiles a breakpoint's `hide` list leaves off it: those whose every widget it names. */
export function hiddenTileIds(tiles: readonly Tile[], hide: readonly string[], breakpoint: string): ReadonlySet<TileId> {
  const hidden = new Set<TileId>();
  for (const tile of tiles) {
    const named = tile.items.filter((item) => hide.includes(item.type)).length;
    if (named === tile.items.length) hidden.add(tile.id);
    else if (named > 0) warnPartlyHidden(tile, breakpoint);
  }
  return hidden;
}
