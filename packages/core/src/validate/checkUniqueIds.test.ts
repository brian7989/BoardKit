import { describe, expect, it } from 'vitest';
import { checkUniqueIds } from './checkUniqueIds.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { Tile } from '../model/Tile.js';

function makeTile(id: string, widget: string): Tile {
  return { id: tileId(id), col: cell(0), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId(widget), type: 'x' }], active: 0 };
}

describe('checkUniqueIds', () => {
  it('reports nothing when every board, tile, and widget id is unique', () => {
    const candidate: ValidCandidate = {
      grid: { cols: 4, rows: 4 },
      boards: [{ id: boardId('a'), tiles: [makeTile('t0', 'w0')] }, { id: boardId('b'), tiles: [makeTile('t1', 'w1')] }],
    };
    expect(checkUniqueIds(candidate)).toEqual([]);
  });

  it('reports DuplicateId for two boards sharing an id', () => {
    const candidate: ValidCandidate = { grid: { cols: 4, rows: 4 }, boards: [{ id: boardId('a'), tiles: [] }, { id: boardId('a'), tiles: [] }] };
    expect(checkUniqueIds(candidate)).toEqual([{ kind: IssueKind.DuplicateId, message: 'Duplicate board id a.' }]);
  });

  it('reports DuplicateId for two tiles sharing an id, even across different boards', () => {
    const candidate: ValidCandidate = {
      grid: { cols: 4, rows: 4 },
      boards: [{ id: boardId('a'), tiles: [makeTile('shared', 'w0')] }, { id: boardId('b'), tiles: [makeTile('shared', 'w1')] }],
    };
    const issues = checkUniqueIds(candidate);
    expect(issues).toEqual([{ kind: IssueKind.DuplicateId, message: 'Duplicate tile id shared.', board: boardId('b'), tile: tileId('shared') }]);
  });

  it('reports DuplicateId for two widgets sharing an id, even across different tiles', () => {
    const candidate: ValidCandidate = {
      grid: { cols: 4, rows: 4 },
      boards: [{ id: boardId('a'), tiles: [makeTile('t0', 'shared'), makeTile('t1', 'shared')] }],
    };
    const issues = checkUniqueIds(candidate);
    expect(issues).toEqual([{ kind: IssueKind.DuplicateId, message: 'Duplicate widget id shared.', board: boardId('a'), tile: tileId('t1') }]);
  });
});
