import { clampRectToBoard } from '../shared/geometry/Rect.js';
import { cell } from '../shared/units/Cell.js';
import type { Size } from '../shared/sizes/Size.js';
import type { Tile } from '../model/Tile.js';
import { fitSize } from './fitSize.js';
import { ReflowChangeKind } from './ReflowChangeKind.js';
import type { ReflowPlacementInput } from './ReflowPlacementInput.js';

function clampFloating(tile: Tile, size: Size, grid: { readonly cols: number; readonly rows: number }): Tile {
  const grounded = clampRectToBoard({ x: tile.col, y: tile.row, w: size.w, h: size.h }, grid);
  const float = tile.float ?? { x: tile.col, y: tile.row };
  const floating = clampRectToBoard({ x: cell(Math.round(float.x)), y: cell(Math.round(float.y)), w: size.w, h: size.h }, grid);
  return { ...tile, size, col: grounded.x, row: grounded.y, float: { x: floating.x, y: floating.y } };
}

// Floating tiles sit outside grid occupancy, so they stay on their own page — only clamped
// back into bounds, never repacked onto a different one.
export function placeFloatingTile(input: ReflowPlacementInput): void {
  const { entry, ctx, pages, changes } = input;
  const page = pages.find((candidate) => candidate.id === entry.board);
  if (!page) return;

  const size = fitSize(entry.tile, ctx);
  if (!size) {
    changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Dropped });
    return;
  }
  if (size.w !== entry.tile.size.w || size.h !== entry.tile.size.h) {
    changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Resized });
  }
  page.tiles.push(clampFloating(entry.tile, size, ctx.grid));
}
