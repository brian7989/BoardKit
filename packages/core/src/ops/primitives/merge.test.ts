import { describe, expect, it } from 'vitest';
import { merge } from './merge.js';
import { boardId } from '../../shared/ids/BoardId.js';
import { tileId } from '../../shared/ids/TileId.js';
import { widgetId } from '../../shared/ids/WidgetId.js';
import { cell } from '../../shared/units/Cell.js';
import type { Board } from '../../model/Board.js';

function makeBoard(): Board {
  return {
    id: boardId('default'),
    tiles: [
      { id: tileId('source'), col: cell(0), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId('a'), type: 'x' }], active: 0 },
      { id: tileId('target'), col: cell(1), row: cell(0), size: { w: cell(1), h: cell(1) }, items: [{ id: widgetId('b'), type: 'x' }], active: 0 },
    ],
  };
}

describe('merge', () => {
  it('appends the source items onto the target, drops the source tile, and makes the incoming item active', () => {
    const board = makeBoard();
    const result = merge(board, tileId('source'), tileId('target'));
    expect(result.tiles.map((tile) => tile.id)).toEqual([tileId('target')]);
    const merged = result.tiles[0];
    expect(merged?.items.map((item) => item.id)).toEqual([widgetId('b'), widgetId('a')]);
    expect(merged?.active).toBe(1);
  });

  it('returns the board unchanged when the source tile does not exist', () => {
    const board = makeBoard();
    expect(merge(board, tileId('nope'), tileId('target'))).toBe(board);
  });

  it('returns the board unchanged when the target tile does not exist', () => {
    const board = makeBoard();
    expect(merge(board, tileId('source'), tileId('nope'))).toBe(board);
  });
});
