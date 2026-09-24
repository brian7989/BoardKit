import type { Point } from '../shared/geometry/Point.js';
import { cell, type Cell } from '../shared/units/Cell.js';
import type { Tile } from './Tile.js';

/** Top-left cell of a tile in its own layer: `float` while floating, `col`/`row` otherwise. */
export function cellOriginOf(tile: Tile): Point<Cell> {
  return tile.float ? { x: cell(tile.float.x), y: cell(tile.float.y) } : { x: tile.col, y: tile.row };
}
