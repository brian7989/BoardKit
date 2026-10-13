import { clampRectToBoard } from '../shared/geometry/Rect.js';
import { cell } from '../shared/units/Cell.js';
import { sizesEqual, type Size } from '../shared/sizes/Size.js';
import { isFree, layerOf, TileLayer, type Tile } from '../model/index.js';
import { findFreeSpace } from '../solver/index.js';
import { fitSize } from './fitSize.js';
import { ReflowChangeKind } from './ReflowChangeKind.js';
import type { ReflowPlacementInput } from './ReflowPlacementInput.js';
import type { Page } from './Page.js';

// Grounds the last grid position too, so an un-float later has somewhere sane to land, and
// clamps the float itself into the new grid's bounds.
function clampToFree(tile: Tile, size: Size, grid: { readonly cols: number; readonly rows: number }): Tile {
  const grounded = clampRectToBoard({ x: tile.col, y: tile.row, w: size.w, h: size.h }, grid);
  const float = tile.float ?? { x: tile.col, y: tile.row };
  const floating = clampRectToBoard({ x: cell(Math.round(float.x)), y: cell(Math.round(float.y)), w: size.w, h: size.h }, grid);
  return { ...tile, size, col: grounded.x, row: grounded.y, float: { x: floating.x, y: floating.y, free: true } };
}

// An Overlay tile's real spot lives in float.x/y (always set); findFreeSpace reads col/row.
function withFloatAsColRow(tile: Tile): Tile {
  return { ...tile, col: cell(tile.float!.x), row: cell(tile.float!.y) };
}

interface PlaceInOverlayInput {
  readonly page: Page;
  readonly tile: Tile;
  readonly size: Size;
  readonly ctx: ReflowPlacementInput['ctx'];
}

// A free Overlay spot among the page's Overlay tiles placed so far, at the tile's grown size.
function placeInOverlay(input: PlaceInOverlayInput): Tile | null {
  const { page, tile, size, ctx } = input;
  const overlayOthers = page.tiles.filter((candidate) => layerOf(candidate) === TileLayer.Overlay).map(withFloatAsColRow);
  const spot = findFreeSpace({ tiles: overlayOthers, size, grid: ctx.grid, sizeOf: (candidate) => candidate.size });
  return spot ? { ...tile, size, float: { x: spot.x, y: spot.y } } : null;
}

// Floating tiles sit outside grid occupancy, so they stay on their own page: a Free tile is just
// clamped, and a snapped Overlay tile falls back to Free (clamped) if it can't fit in the Overlay layer.
export function placeFloatingTile(input: ReflowPlacementInput): void {
  const { entry, ctx, pages, changes, parked } = input;
  // A restored layout may not have this tile's page; the first page stands in rather than losing it.
  const page = pages.find((candidate) => candidate.id === entry.board) ?? pages[0];
  const size = page ? fitSize(entry.tile, ctx) : null;
  if (!page || !size) {
    parked.push(entry.tile);
    changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Dropped });
    return;
  }
  if (!sizesEqual(size, entry.tile.size)) changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Resized });
  const overlay = isFree(entry.tile) ? null : placeInOverlay({ page, tile: entry.tile, size, ctx });
  page.tiles.push(overlay ?? clampToFree(entry.tile, size, ctx.grid));
}
