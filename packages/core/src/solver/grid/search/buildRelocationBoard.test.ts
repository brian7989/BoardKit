import { describe, expect, it } from 'vitest';
import { buildRelocationBoard } from './buildRelocationBoard.js';
import { Direction } from '../cost/Direction.js';
import { tileId } from '../../../shared/ids/TileId.js';
import { cell } from '../../../shared/units/Cell.js';
import type { Tile } from '../../../model/Tile.js';

const ORDER = [Direction.Down];

function makeTile(id: string, col: number, row: number): Tile {
  return { id: tileId(id), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [], active: 0 };
}

function withSize(tile: Tile, size: { readonly w: number; readonly h: number }): Tile {
  return { ...tile, size: { w: cell(size.w), h: cell(size.h) } };
}

describe('buildRelocationBoard', () => {
  it('marks every non-pinned tile footprint into the owner grid, indexed by array position', () => {
    const board = buildRelocationBoard({
      tiles: [withSize(makeTile('a', 0, 0), { w: 2, h: 1 })],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(3), y: cell(3), w: cell(1), h: cell(1) },
      grid: { cols: 4, rows: 4 },
      sizeOf: (tile) => tile.size,
      displaced: [],
      order: ORDER,
    });

    expect(Array.from(board.owner.slice(0, 4))).toEqual([1, 1, 0, 0]);
  });

  it('excludes the pinned tile from the board entirely, even if present in tiles', () => {
    const board = buildRelocationBoard({
      tiles: [makeTile('pinned', 0, 0)],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
      grid: { cols: 2, rows: 2 },
      sizeOf: (tile) => tile.size,
      displaced: [],
      order: ORDER,
    });

    expect(board.tiles).toHaveLength(0);
    expect(board.owner[0]).toBe(0);
  });

  it('marks the pinned rect as blocked', () => {
    const board = buildRelocationBoard({
      tiles: [],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(1), y: cell(1), w: cell(1), h: cell(1) },
      grid: { cols: 2, rows: 2 },
      sizeOf: (tile) => tile.size,
      displaced: [],
      order: ORDER,
    });

    expect(board.blocked[1 * 2 + 1]).toBe(1);
    expect(board.blocked[0]).toBe(0);
  });

  it('seeds the queue and resolved flags from the initially displaced tiles', () => {
    const board = buildRelocationBoard({
      tiles: [makeTile('a', 0, 0), makeTile('b', 1, 0)],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
      grid: { cols: 4, rows: 4 },
      sizeOf: (tile) => tile.size,
      displaced: [tileId('a')],
      order: ORDER,
    });

    expect(board.queue).toEqual([0]);
    expect(Array.from(board.resolved)).toEqual([1, 0]);
    expect(board.head).toBe(0);
    expect(board.placedRect).toEqual([null, null]);
  });

  it('carries size and tile-id lookups aligned with the owner-grid indices', () => {
    const board = buildRelocationBoard({
      tiles: [withSize(makeTile('a', 0, 0), { w: 2, h: 1 })],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(3), y: cell(3), w: cell(1), h: cell(1) },
      grid: { cols: 4, rows: 4 },
      sizeOf: (tile) => tile.size,
      displaced: [],
      order: ORDER,
    });

    expect(board.tileIds).toEqual([tileId('a')]);
    expect(board.size).toEqual([{ w: cell(2), h: cell(1) }]);
    expect(board.order).toBe(ORDER);
  });

  it('throws if a displaced id names a tile that is not in the relocation set', () => {
    expect(() =>
      buildRelocationBoard({
        tiles: [makeTile('a', 0, 0)],
        pinnedTileId: tileId('pinned'),
        pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
        grid: { cols: 2, rows: 2 },
        sizeOf: (tile) => tile.size,
        displaced: [tileId('missing')],
        order: ORDER,
      }),
    ).toThrow('Displaced tile id not found among relocation tiles.');
  });
});
