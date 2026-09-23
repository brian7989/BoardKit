import { describe, expect, it } from 'vitest';
import { exceedsCapacity } from './exceedsCapacity.js';
import { tileId } from '../../shared/ids/TileId.js';
import { cell } from '../../shared/units/Cell.js';
import { Direction } from './cost/Direction.js';
import type { Tile } from '../../model/Tile.js';
import type { RelocationInput } from './RelocationInput.js';

const OPTIONS = { maxNodes: 20_000, directions: [Direction.Down], nudgeOnResize: true };

function makeTile(id: string, size: { w: number; h: number } = { w: 1, h: 1 }): Tile {
  return { id: tileId(id), col: cell(0), row: cell(0), size: { w: cell(size.w), h: cell(size.h) }, items: [], active: 0 };
}

function makeInput(overrides: Partial<RelocationInput>): RelocationInput {
  return {
    tiles: [],
    pinnedTileId: tileId('pinned'),
    pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
    grid: { cols: 4, rows: 4 },
    sizeOf: (tile) => tile.size,
    options: OPTIONS,
    ...overrides,
  };
}

describe('exceedsCapacity', () => {
  it('is false when the tiles plus the pinned rect fit within the grid', () => {
    const tiles = Array.from({ length: 15 }, (_, index) => makeTile(`t${index}`));
    expect(exceedsCapacity(makeInput({ tiles, grid: { cols: 4, rows: 4 } }))).toBe(false);
  });

  it('is true when the total area, including the pinned rect, exceeds cols*rows', () => {
    const tiles = Array.from({ length: 16 }, (_, index) => makeTile(`t${index}`));
    expect(exceedsCapacity(makeInput({ tiles, grid: { cols: 4, rows: 4 } }))).toBe(true);
  });

  it('excludes the pinned tile from the tile sum, even if present in tiles', () => {
    const tiles = [makeTile('pinned', { w: 4, h: 4 })];
    expect(exceedsCapacity(makeInput({ tiles, pinnedTileId: tileId('pinned'), grid: { cols: 4, rows: 4 } }))).toBe(false);
  });

  it('accounts for the pinned rect at its resized/moved size, not any prior size', () => {
    const tiles = Array.from({ length: 15 }, (_, index) => makeTile(`t${index}`));
    const grown = makeInput({ tiles, pinnedRect: { x: cell(0), y: cell(0), w: cell(2), h: cell(1) }, grid: { cols: 4, rows: 4 } });
    expect(exceedsCapacity(grown)).toBe(true);
  });
});
