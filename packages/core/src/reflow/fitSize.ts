import type { Size } from '../shared/sizes/Size.js';
import type { Tile } from '../model/Tile.js';
import type { EngineContext } from '../engine/EngineContext.js';
import { allowedSizes } from './allowedSizes.js';

function fitsGrid(size: Size, grid: { readonly cols: number; readonly rows: number }): boolean {
  return size.w <= grid.cols && size.h <= grid.rows;
}

// The tile's own size when it still fits; otherwise the largest catalog size that does.
// Null means none of its widget's sizes fit the new grid at all — the caller drops it.
export function fitSize(tile: Tile, ctx: EngineContext): Size | null {
  if (fitsGrid(tile.size, ctx.grid)) return tile.size;
  const candidates = allowedSizes(tile, ctx).filter((size) => fitsGrid(size, ctx.grid));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, size) => (size.w * size.h > best.w * best.h ? size : best));
}
