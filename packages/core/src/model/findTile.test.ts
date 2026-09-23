import { describe, expect, it } from 'vitest';
import { findTile } from './findTile.js';
import { markValid } from './BoardsState.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';

function makeState() {
  const tile = { id: tileId('t0'), col: cell(0), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId('w0'), type: 'a' }], active: 0 };
  const board = { id: boardId('b0'), tiles: [tile] };
  return { state: markValid({ grid: { cols: 1, rows: 1 }, boards: [board] }), tile };
}

describe('findTile', () => {
  it('returns the tile with a matching id on a matching board', () => {
    const { state, tile } = makeState();
    expect(findTile(state, boardId('b0'), tileId('t0'))).toBe(tile);
  });

  it('returns undefined when the board is missing', () => {
    const { state } = makeState();
    expect(findTile(state, boardId('missing'), tileId('t0'))).toBeUndefined();
  });

  it('returns undefined when the tile is missing from the board', () => {
    const { state } = makeState();
    expect(findTile(state, boardId('b0'), tileId('missing'))).toBeUndefined();
  });
});
