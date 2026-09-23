import { describe, expect, it } from 'vitest';
import { checkItems } from './checkItems.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { Tile } from '../model/Tile.js';

function candidateWith(tile: Partial<Tile>): ValidCandidate {
  return {
    grid: { cols: 4, rows: 4 },
    boards: [
      { id: boardId('default'), tiles: [{ id: tileId('t0'), col: cell(0), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId('w0'), type: 'x' }], active: 0, ...tile }] },
    ],
  };
}

describe('checkItems', () => {
  it('reports nothing for a tile with items and an active index in range', () => {
    expect(checkItems(candidateWith({}))).toEqual([]);
  });

  it('reports EmptyTile for a tile with no items', () => {
    const issues = checkItems(candidateWith({ items: [] }));
    expect(issues).toEqual([{ kind: IssueKind.EmptyTile, board: boardId('default'), tile: tileId('t0'), message: 'Tile t0 has no items.' }]);
  });

  it('reports BadActiveIndex for a negative active index', () => {
    const issues = checkItems(candidateWith({ active: -1 }));
    expect(issues).toEqual([{ kind: IssueKind.BadActiveIndex, board: boardId('default'), tile: tileId('t0'), message: 'Tile t0 has an out-of-range active index.' }]);
  });

  it('reports BadActiveIndex for an active index at or past items.length', () => {
    const issues = checkItems(candidateWith({ active: 1 }));
    expect(issues).toEqual([{ kind: IssueKind.BadActiveIndex, board: boardId('default'), tile: tileId('t0'), message: 'Tile t0 has an out-of-range active index.' }]);
  });
});
