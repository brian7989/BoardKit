import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seed(engine: Engine): BoardsState {
  const result = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: WIDGET_TYPE, props: { color: 'red' } },
    size: SIZE_SMALL,
    at: { x: cell(0), y: cell(0) },
  });
  if (!result.ok) throw new Error('fixture add should succeed');
  return result.value.state;
}

describe('renameWidget', () => {
  it('rejects UnknownTarget for a missing board, tile, or widget', () => {
    const engine = makeEngine();
    const state = seed(engine);
    expect(engine.apply(state, { type: OpType.RenameWidget, board: boardId('nope'), tile: tileId('t0'), widget: widgetId('w0'), name: 'x' })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.RenameWidget, board: BOARD, tile: tileId('nope'), widget: widgetId('w0'), name: 'x' })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.RenameWidget, board: BOARD, tile: tileId('t0'), widget: widgetId('nope'), name: 'x' })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('sets a trimmed display name, keeping other fields intact', () => {
    const engine = makeEngine();
    const state = seed(engine);
    const result = engine.apply(state, { type: OpType.RenameWidget, board: BOARD, tile: tileId('t0'), widget: widgetId('w0'), name: '  My Widget  ' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const item = result.value.state.boards[0]?.tiles[0]?.items[0];
    expect(item).toEqual({ id: widgetId('w0'), type: WIDGET_TYPE, props: { color: 'red' }, displayName: 'My Widget' });
    expect(result.value.changes).toEqual([{ tile: tileId('t0'), board: BOARD, kind: ChangeKind.Renamed }]);
  });

  it('clears a custom name back to the manifest default when given an empty (or blank) name', () => {
    const engine = makeEngine();
    const named = engine.apply(seed(engine), { type: OpType.RenameWidget, board: BOARD, tile: tileId('t0'), widget: widgetId('w0'), name: 'Custom' });
    if (!named.ok) throw new Error('fixture rename should succeed');

    const result = engine.apply(named.value.state, { type: OpType.RenameWidget, board: BOARD, tile: tileId('t0'), widget: widgetId('w0'), name: '   ' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const item = result.value.state.boards[0]?.tiles[0]?.items[0];
    expect(item).toEqual({ id: widgetId('w0'), type: WIDGET_TYPE, props: { color: 'red' } });
    expect(item).not.toHaveProperty('displayName');
  });
});
