import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, withSavedLayout, type Engine } from '../index.js';

const catalog = { w: { sizes: [{ w: cell(1), h: cell(1) }] } };
const wide = createEngine({ grid: { cols: 4, rows: 1 }, catalog });
const narrow = createEngine({ grid: { cols: 1, rows: 4 }, catalog });

function withTile(engine: Engine, at: { readonly x: number; readonly y: number }) {
  const added = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: boardId('default'),
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: 'w' },
    size: { w: cell(1), h: cell(1) },
    at: { x: cell(at.x), y: cell(at.y) },
  });
  if (!added.ok) throw new Error('fixture add should succeed');
  return added.value.state;
}

describe('withSavedLayout', () => {
  it('stores another grid layout so a reflow onto that grid restores it, leaving the live tiles alone', () => {
    const base = withTile(wide, { x: 3, y: 0 });
    const state = withSavedLayout(base, withTile(narrow, { x: 0, y: 2 }));
    expect(state.boards).toBe(base.boards);
    expect(narrow.reflow(state).state.boards[0]?.tiles[0]).toMatchObject({ col: 0, row: 2 });
  });
});
