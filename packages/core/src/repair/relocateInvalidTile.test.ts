import { describe, expect, it } from 'vitest';
import { relocateInvalidTile } from './relocateInvalidTile.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import { SolverDefaults } from '../solver/index.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { EngineContext } from '../engine/EngineContext.js';

const CTX: EngineContext = { grid: { cols: 2, rows: 1, cellAspect: 1 }, catalog: {}, solver: SolverDefaults };

function tile(id: string, col: number, row: number) {
  return { id: tileId(id), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId(`${id}-w`), type: 'x' }], active: 0 };
}

describe('relocateInvalidTile', () => {
  it('returns null when the tile does not exist on any board', () => {
    const candidate: ValidCandidate = { grid: { cols: 2, rows: 1 }, boards: [{ id: boardId('default'), tiles: [] }] };
    expect(relocateInvalidTile(candidate, tileId('nope'), CTX)).toBeNull();
  });

  it('returns null when there is no free space among the tile\'s siblings', () => {
    // A 1x1 grid whose only cell is already taken by 'b': there is nowhere at all for 'a' to go.
    const oneCell: EngineContext = { ...CTX, grid: { ...CTX.grid, cols: 1, rows: 1 } };
    const candidate: ValidCandidate = { grid: { cols: 1, rows: 1 }, boards: [{ id: boardId('default'), tiles: [tile('a', 0, 0), tile('b', 0, 0)] }] };
    expect(relocateInvalidTile(candidate, tileId('a'), oneCell)).toBeNull();
  });

  it('moves the tile to the first free cell among its siblings, leaving other boards untouched', () => {
    const other = { id: boardId('other'), tiles: [tile('z', 0, 0)] };
    const candidate: ValidCandidate = { grid: { cols: 2, rows: 1 }, boards: [{ id: boardId('default'), tiles: [tile('a', 1, 0)] }, other] };
    const result = relocateInvalidTile(candidate, tileId('a'), CTX);
    expect(result?.boards.find((board) => board.id === boardId('default'))?.tiles[0]).toMatchObject({ col: 0, row: 0 });
    expect(result?.boards.find((board) => board.id === boardId('other'))).toBe(other);
  });
});
