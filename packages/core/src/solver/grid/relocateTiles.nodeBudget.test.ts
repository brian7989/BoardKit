import { describe, expect, it } from 'vitest';
import { branchAndBound } from '../search/branchAndBound.js';
import { SearchStatus } from '../search/SearchStatus.js';
import { findDisplaced } from './occupancy/findDisplaced.js';
import { buildRelocationBoard } from './search/buildRelocationBoard.js';
import { toSearchProblem } from './toSearchProblem.js';
import { Direction } from './cost/Direction.js';
import { cell } from '../../shared/units/Cell.js';
import { tileId } from '../../shared/ids/TileId.js';
import type { Tile } from '../../model/Tile.js';

const GRID = { cols: 6, rows: 6 };
const ORDER = [Direction.Down, Direction.Right, Direction.Up, Direction.Left];

// A fully packed 6x6 board: one 2x2 tile plus 1x1 tiles elsewhere, so freeing a single
// 1x1 cell can't fit the 2x2 tile and displacing it forces a multi-step cascade.
function unitTile(row: number, col: number): Tile {
  return { id: tileId(`t${row}-${col}`), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [], active: 0 };
}

function unitTilesForRow(row: number): readonly Tile[] {
  const cols = Array.from({ length: GRID.cols }, (_, col) => col);
  return cols.filter((col) => row >= 2 || col >= 2).map((col) => unitTile(row, col));
}

function denseFixtureTiles(): readonly Tile[] {
  const big: Tile = { id: tileId('big'), col: cell(0), row: cell(0), size: { w: cell(2), h: cell(2) }, items: [], active: 0 };
  const rows = Array.from({ length: GRID.rows }, (_, row) => row);
  return [big, ...rows.flatMap(unitTilesForRow)];
}

// Regression guard: catches an accidental blow-up in explored nodes (e.g. a lost pruning
// check or a bad ordering) without depending on wall-clock timing, which would be flaky in CI.
describe('relocateTiles node budget', () => {
  it('keeps explored nodes on a fixed dense board under a fixed ceiling', () => {
    const tiles = denseFixtureTiles();
    // Mirrors a real Move op: the moved tile itself is excluded from the relocation set (its
    // old cell becomes free), and "pinned" at a target overlapping the 2x2 tile's corner.
    const pinnedTileId = tileId('t5-5');
    const pinnedRect = { x: cell(1), y: cell(1), w: cell(1), h: cell(1) };
    const shared = { tiles, pinnedTileId, pinnedRect, sizeOf: (tile: Tile) => tile.size };
    const displaced = findDisplaced(shared);
    const board = buildRelocationBoard({ ...shared, grid: GRID, displaced, order: ORDER });
    const problem = toSearchProblem(board);

    let nodes = 0;
    const outcome = branchAndBound(problem, {
      maxNodes: 50_000,
      trace: () => {
        nodes += 1;
      },
    });

    expect(outcome.status).toBe(SearchStatus.Solved);
    expect(nodes).toBeLessThan(500);
  });
});
