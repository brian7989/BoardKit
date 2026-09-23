import { describe, expect, it } from 'vitest';
import { findDisplaced } from './findDisplaced.js';
import { tileId } from '../../../shared/ids/TileId.js';
import { cell } from '../../../shared/units/Cell.js';
import type { Tile } from '../../../model/Tile.js';

function makeTile(id: string, col: number, row: number): Tile {
  return { id: tileId(id), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [], active: 0 };
}

const PINNED_RECT = { x: cell(0), y: cell(0), w: cell(2), h: cell(2) };

describe('findDisplaced', () => {
  it('names only the tiles that collide with the pinned rect', () => {
    const tiles = [makeTile('near', 1, 1), makeTile('far', 3, 3)];
    const result = findDisplaced({ tiles, pinnedTileId: tileId('pinned'), pinnedRect: PINNED_RECT, sizeOf: (tile) => tile.size });
    expect(result).toEqual([tileId('near')]);
  });

  it('excludes the pinned tile itself even if its own rect overlaps', () => {
    const tiles = [makeTile('pinned', 0, 0)];
    const result = findDisplaced({ tiles, pinnedTileId: tileId('pinned'), pinnedRect: PINNED_RECT, sizeOf: (tile) => tile.size });
    expect(result).toEqual([]);
  });

  it('orders ties by row, then column, then id for determinism', () => {
    const tiles = [makeTile('b', 1, 0), makeTile('a', 0, 0), makeTile('below', 0, 1)];
    const result = findDisplaced({ tiles, pinnedTileId: tileId('pinned'), pinnedRect: PINNED_RECT, sizeOf: (tile) => tile.size });
    expect(result).toEqual([tileId('a'), tileId('b'), tileId('below')]);
  });
});
