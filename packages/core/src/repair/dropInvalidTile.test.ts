import { describe, expect, it } from 'vitest';
import { dropInvalidTile } from './dropInvalidTile.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import type { ValidCandidate } from '../model/BoardsState.js';

function tile(id: string) {
  return { id: tileId(id), col: cell(0), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId(`${id}-w`), type: 'x' }], active: 0 };
}

describe('dropInvalidTile', () => {
  it('removes the named tile from its board', () => {
    const candidate: ValidCandidate = { grid: { cols: 4, rows: 4 }, boards: [{ id: boardId('default'), tiles: [tile('a'), tile('b')] }] };
    const result = dropInvalidTile(candidate, tileId('a'));
    expect(result.boards[0]?.tiles.map((t) => t.id)).toEqual([tileId('b')]);
  });

  it('leaves a board untouched, by identity, when it does not contain the tile', () => {
    const untouched = { id: boardId('other'), tiles: [tile('z')] };
    const candidate: ValidCandidate = { grid: { cols: 4, rows: 4 }, boards: [{ id: boardId('default'), tiles: [tile('a')] }, untouched] };
    const result = dropInvalidTile(candidate, tileId('a'));
    expect(result.boards.find((board) => board.id === boardId('other'))).toBe(untouched);
  });
});
