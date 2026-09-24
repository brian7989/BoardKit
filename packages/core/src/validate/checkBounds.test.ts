import { describe, expect, it } from 'vitest';
import { checkBounds } from './checkBounds.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { Tile } from '../model/Tile.js';
import type { EngineContext } from '../engine/EngineContext.js';

const CTX: EngineContext = { grid: { cols: 4, rows: 4, cellAspect: 1 }, catalog: {}, solver: { maxNodes: 1000, directions: [], nudgeOnResize: true } };

function candidateWith(tile: Partial<Tile>): ValidCandidate {
  return {
    grid: { cols: 4, rows: 4 },
    boards: [
      {
        id: boardId('default'),
        tiles: [{ id: tileId('t0'), col: cell(0), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId('w0'), type: 'x' }], active: 0, ...tile }],
      },
    ],
  };
}

describe('checkBounds', () => {
  it('reports nothing for a tile fully inside the board', () => {
    expect(checkBounds(candidateWith({}), CTX)).toEqual([]);
  });

  it('reports OutOfBounds for a tile whose rect extends past the board edge', () => {
    const issues = checkBounds(candidateWith({ col: cell(3), size: { w: cell(2), h: cell(1) } }), CTX);
    expect(issues).toEqual([{ kind: IssueKind.OutOfBounds, board: boardId('default'), tile: tileId('t0'), message: 'Tile t0 lies outside the board.' }]);
  });

  it('reports OutOfBounds for a negative origin', () => {
    const issues = checkBounds(candidateWith({ col: cell(-1) }), CTX);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe(IssueKind.OutOfBounds);
  });

  it('exempts a Free tile, even one entirely off the board', () => {
    const issues = checkBounds(candidateWith({ col: cell(-50), row: cell(-50), float: { x: -50, y: -50, free: true } }), CTX);
    expect(issues).toEqual([]);
  });

  it('reports OutOfBounds for a snapped Overlay tile off the board', () => {
    const issues = checkBounds(candidateWith({ col: cell(0), row: cell(0), float: { x: -1, y: 0 } }), CTX);
    expect(issues).toEqual([{ kind: IssueKind.OutOfBounds, board: boardId('default'), tile: tileId('t0'), message: 'Tile t0 lies outside the board.' }]);
  });

  it('reports OutOfBounds for a snapped Overlay tile at a non-integer position', () => {
    const issues = checkBounds(candidateWith({ col: cell(0), row: cell(0), float: { x: 1.5, y: 0 } }), CTX);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe(IssueKind.OutOfBounds);
  });

  it('reports nothing for a snapped Overlay tile inside the board', () => {
    const issues = checkBounds(candidateWith({ col: cell(0), row: cell(0), float: { x: 1, y: 1 } }), CTX);
    expect(issues).toEqual([]);
  });
});
