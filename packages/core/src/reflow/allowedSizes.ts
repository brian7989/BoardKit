import { isSizeAllowed, type Size } from '../shared/sizes/Size.js';
import { firstItem } from '../model/Tile.js';
import type { Tile } from '../model/Tile.js';
import type { EngineContext } from '../engine/EngineContext.js';

function sizesOf(type: string, ctx: EngineContext): readonly Size[] {
  return ctx.catalog[type]?.sizes ?? [];
}

// A stack's tile can only take a size every one of its widgets' manifests allows. A tile's items
// are never empty (checkItems enforces it), so there is always a first widget to anchor on.
export function allowedSizes(tile: Tile, ctx: EngineContext): readonly Size[] {
  const rest = tile.items.slice(1).map((item) => sizesOf(item.type, ctx));
  return sizesOf(firstItem(tile).type, ctx).filter((size) => rest.every((sizes) => isSizeAllowed(size, sizes)));
}
