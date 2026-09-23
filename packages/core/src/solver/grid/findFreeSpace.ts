import type { Point } from '../../shared/geometry/Point.js';
import { cell, type Cell } from '../../shared/units/Cell.js';
import type { Size } from '../../shared/sizes/Size.js';
import type { Tile } from '../../model/Tile.js';

export interface FindFreeSpaceInput {
  readonly tiles: readonly Tile[];
  readonly size: Size;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly sizeOf: (tile: Tile) => Size;
}

// Occupancy is built once (O(cells + tiles*area)), then each position is a grid lookup
// instead of a check against every tile.
export function findFreeSpace(input: FindFreeSpaceInput): Point<Cell> | null {
  const occupied = buildOccupied(input.tiles, input.sizeOf, input.grid);
  const maxX = input.grid.cols - input.size.w;
  for (let y = 0; y <= input.grid.rows - input.size.h; y += 1) {
    const found = firstFreeInRow({ occupied, y, size: input.size, maxX });
    if (found) return found;
  }
  return null;
}

interface OccupiedGrid {
  readonly cells: Uint8Array;
  readonly cols: number;
  readonly rows: number;
}

function buildOccupied(tiles: readonly Tile[], sizeOf: (tile: Tile) => Size, grid: { readonly cols: number; readonly rows: number }): OccupiedGrid {
  const occupied: OccupiedGrid = { cells: new Uint8Array(grid.cols * grid.rows), cols: grid.cols, rows: grid.rows };
  for (const tile of tiles) markOccupied(occupied, tile, sizeOf(tile));
  return occupied;
}

function markOccupied(grid: OccupiedGrid, tile: Tile, size: Size): void {
  const maxRow = Math.min(tile.row + size.h, grid.rows);
  const maxCol = Math.min(tile.col + size.w, grid.cols);
  for (let row: number = tile.row; row < maxRow; row += 1) {
    for (let col: number = tile.col; col < maxCol; col += 1) grid.cells[row * grid.cols + col] = 1;
  }
}

interface FirstFreeInRowInput {
  readonly occupied: OccupiedGrid;
  readonly y: number;
  readonly size: Size;
  readonly maxX: number;
}

function firstFreeInRow(input: FirstFreeInRowInput): Point<Cell> | null {
  const rect = { y: input.y, w: input.size.w, h: input.size.h };
  for (let x = 0; x <= input.maxX; x += 1) {
    if (isFree(input.occupied, { x, ...rect })) return { x: cell(x), y: cell(input.y) };
  }
  return null;
}

interface PlainRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

function isFree(grid: OccupiedGrid, rect: PlainRect): boolean {
  for (let row: number = rect.y; row < rect.y + rect.h; row += 1) {
    if (!isRowFree(grid, row, rect)) return false;
  }
  return true;
}

function isRowFree(grid: OccupiedGrid, row: number, rect: { readonly x: number; readonly w: number }): boolean {
  for (let col: number = rect.x; col < rect.x + rect.w; col += 1) {
    if (grid.cells[row * grid.cols + col]) return false;
  }
  return true;
}
