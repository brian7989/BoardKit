import { rectOfTile, type Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import type { Size } from '../../../shared/sizes/Size.js';
import type { Tile } from '../../../model/Tile.js';
import type { TileId } from '../../../shared/ids/TileId.js';
import type { Direction } from '../cost/Direction.js';
import type { RelocationBoard } from './RelocationBoard.js';

export interface BuildRelocationBoardInput {
  readonly tiles: readonly Tile[];
  readonly pinnedTileId: TileId;
  readonly pinnedRect: Rect<Cell>;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly sizeOf: (tile: Tile) => Size;
  readonly displaced: readonly TileId[];
  readonly order: readonly Direction[];
}

export function buildRelocationBoard(input: BuildRelocationBoardInput): RelocationBoard {
  const tiles = input.tiles.filter((tile) => tile.id !== input.pinnedTileId);
  const { queue, resolved } = buildQueue(tiles, input.displaced);
  return {
    cols: input.grid.cols,
    rows: input.grid.rows,
    owner: buildOwner(tiles, input.sizeOf, input.grid),
    blocked: buildBlocked(input.pinnedRect, input.grid),
    resolved,
    placedRect: tiles.map(() => null),
    queue,
    head: 0,
    tiles,
    tileIds: tiles.map((tile) => tile.id),
    size: tiles.map((tile) => input.sizeOf(tile)),
    order: input.order,
  };
}

function buildOwner(tiles: readonly Tile[], sizeOf: (tile: Tile) => Size, grid: { readonly cols: number; readonly rows: number }): Int32Array {
  const owner = new Int32Array(grid.cols * grid.rows);
  tiles.forEach((tile, index) => {
    const rect = rectOfTile({ x: tile.col, y: tile.row }, sizeOf(tile));
    markCells(owner, { grid, rect, value: index + 1 });
  });
  return owner;
}

function buildBlocked(pinnedRect: Rect<Cell>, grid: { readonly cols: number; readonly rows: number }): Uint8Array {
  const blocked = new Uint8Array(grid.cols * grid.rows);
  markCells(blocked, { grid, rect: pinnedRect, value: 1 });
  return blocked;
}

interface MarkCellsInput {
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly rect: Rect<Cell>;
  readonly value: number;
}

// Writes `value` into every cell `rect` covers, clipped to the grid.
function markCells(cells: Int32Array | Uint8Array, input: MarkCellsInput): void {
  const { grid, rect, value } = input;
  const maxRow = Math.min(rect.y + rect.h, grid.rows);
  const maxCol = Math.min(rect.x + rect.w, grid.cols);
  for (let row: number = rect.y; row < maxRow; row += 1) {
    for (let col: number = rect.x; col < maxCol; col += 1) cells[row * grid.cols + col] = value;
  }
}

function buildQueue(tiles: readonly Tile[], displaced: readonly TileId[]): { queue: number[]; resolved: Uint8Array } {
  const indexOf = new Map(tiles.map((tile, index) => [tile.id, index]));
  const resolved = new Uint8Array(tiles.length);
  const queue = displaced.map((id) => requireIndex(indexOf, id));
  for (const index of queue) resolved[index] = 1;
  return { queue, resolved };
}

function requireIndex(indexOf: ReadonlyMap<TileId, number>, id: TileId): number {
  const index = indexOf.get(id);
  if (index === undefined) throw new Error('Displaced tile id not found among relocation tiles.');
  return index;
}
