import type { Point } from '../shared/geometry/Point.js';
import type { Cell } from '../shared/units/Cell.js';
import type { Size } from '../shared/sizes/Size.js';
import { isFloating } from '../model/Tile.js';
import { findFreeSpace } from '../solver/index.js';
import type { Page } from './Page.js';

// A floating tile's col/row is stale, not real occupancy, so it never blocks a spot here.
export function findSpot(page: Page, size: Size, grid: { readonly cols: number; readonly rows: number }): Point<Cell> | null {
  return findFreeSpace({ tiles: page.tiles.filter((tile) => !isFloating(tile)), size, grid, sizeOf: (tile) => tile.size });
}
