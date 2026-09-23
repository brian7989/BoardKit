import { describe, expect, it } from 'vitest';
import { relocateTiles } from './relocateTiles.js';
import { Direction } from './cost/Direction.js';
import { tileId } from '../../shared/ids/TileId.js';
import { cell } from '../../shared/units/Cell.js';
import type { Tile } from '../../model/Tile.js';
import type { SolverOptions } from './SolverOptions.js';

const OPTIONS: SolverOptions = { maxNodes: 20_000, directions: [Direction.Down, Direction.Right, Direction.Up, Direction.Left], nudgeOnResize: true };

function makeTile(id: string, col: number, row: number): Tile {
  return { id: tileId(id), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [], active: 0 };
}

describe('relocateTiles', () => {
  it('resolves instantly when nothing collides with the pinned rect', () => {
    const result = relocateTiles({
      tiles: [makeTile('a', 3, 3)],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
      grid: { cols: 4, rows: 4 },
      sizeOf: (tile) => tile.size,
      options: OPTIONS,
    });

    expect(result).toEqual({ ok: true, value: new Map() });
  });

  it('displaces one colliding tile to the nearest free cell', () => {
    const result = relocateTiles({
      tiles: [makeTile('a', 0, 0)],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
      grid: { cols: 4, rows: 4 },
      sizeOf: (tile) => tile.size,
      options: OPTIONS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.get(tileId('a'))).toEqual({ x: cell(0), y: cell(1), w: cell(1), h: cell(1) });
  });

  it('reports NoValidArrangement, naming the initially colliding tiles, when the board has no room', () => {
    const tiles = Array.from({ length: 3 }, (_, index) => makeTile(`t${index}`, index, 0));
    const result = relocateTiles({
      tiles,
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
      grid: { cols: 3, rows: 1 },
      sizeOf: (tile) => tile.size,
      options: OPTIONS,
    });

    expect(result).toEqual({ ok: false, error: { blockedBy: [tileId('t0')] } });
  });

  it('reports the same rejection shape when the node budget runs out before a solution is found', () => {
    // A solution exists (the free cell at (0,1)) but a budget of 1 is spent entering the search
    // tree and exhausted on its very first successor, before a solution can ever be recorded.
    const result = relocateTiles({
      tiles: [makeTile('a', 0, 0)],
      pinnedTileId: tileId('pinned'),
      pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
      grid: { cols: 4, rows: 4 },
      sizeOf: (tile) => tile.size,
      options: { ...OPTIONS, maxNodes: 1 },
    });

    expect(result).toEqual({ ok: false, error: { blockedBy: [tileId('a')] } });
  });
});
