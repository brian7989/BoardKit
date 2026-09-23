import { cell, type Cell } from '../shared/units/Cell.js';
import { sizesEqual, type Size } from '../shared/sizes/Size.js';
import type { Point } from '../shared/geometry/Point.js';
import type { Tile } from '../model/Tile.js';
import { fitSize } from './fitSize.js';
import { findSpot } from './findSpot.js';
import { openPage } from './openPage.js';
import { ReflowChangeKind } from './ReflowChangeKind.js';
import type { ReflowPlacementInput } from './ReflowPlacementInput.js';
import type { ReflowChange } from './ReflowChange.js';
import type { Page } from './Page.js';

interface FirstFitInput {
  readonly pages: Page[];
  readonly size: Size;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly changes: ReflowChange[];
}

interface FirstFitResult {
  readonly page: Page;
  readonly spot: Point<Cell>;
}

// A freshly opened page is always empty, and `size` already fits the grid (fitSize's job), so it
// always has room at the origin — no need to search it.
function firstFit(input: FirstFitInput): FirstFitResult {
  const { pages, size, grid, changes } = input;
  for (const page of pages) {
    const spot = findSpot(page, size, grid);
    if (spot) return { page, spot };
  }
  return { page: openPage(pages, changes), spot: { x: cell(0), y: cell(0) } };
}

// First-fit across existing pages in reading order, opening a fresh one only once none has room.
export function placeGridTile(input: ReflowPlacementInput): void {
  const { entry, ctx, pages, changes } = input;
  const size = fitSize(entry.tile, ctx);
  if (!size) {
    changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Dropped });
    return;
  }
  if (!sizesEqual(size, entry.tile.size)) changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Resized });

  const tile: Tile = { ...entry.tile, size };
  const { page, spot } = firstFit({ pages, size, grid: ctx.grid, changes });
  page.tiles.push({ ...tile, col: spot.x, row: spot.y });
  if (page.id !== entry.board) changes.push({ tile: entry.tile.id, board: page.id, kind: ReflowChangeKind.Moved });
}
