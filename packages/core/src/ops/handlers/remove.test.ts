import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

// Builds a 3-item stack directly through parse, so `active` can start at any index without
// depending on stack/unstack's own placement behavior.
function seedStack(engine: Engine, active: number): BoardsState {
  const raw = {
    version: 1,
    grid: GRID,
    boards: [
      {
        id: 'default',
        tiles: [
          {
            id: 't0',
            col: 0,
            row: 0,
            size: SIZE_SMALL,
            active,
            items: [
              { id: 'w0', type: WIDGET_TYPE },
              { id: 'w1', type: WIDGET_TYPE },
              { id: 'w2', type: WIDGET_TYPE },
            ],
          },
        ],
      },
    ],
  };
  const parsed = engine.parse(raw);
  if (!parsed.ok) throw new Error('fixture stack should parse');
  return parsed.value;
}

describe('remove', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 0);
    expect(engine.apply(state, { type: OpType.Remove, board: boardId('nope'), tile: tileId('t0') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.Remove, board: BOARD, tile: tileId('nope') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects UnknownTarget for a widget that is not on the tile', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 0);
    const result = engine.apply(state, { type: OpType.Remove, board: BOARD, tile: tileId('t0'), widget: widgetId('nope') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('removes the whole tile when no widget is named', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 0);
    const result = engine.apply(state, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles).toEqual([]);
    expect(result.value.changes).toEqual([{ tile: tileId('t0'), board: BOARD, kind: ChangeKind.Removed }]);
  });

  it('decrements active when the removed item sat before it', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 2);
    const result = engine.apply(state, { type: OpType.Remove, board: BOARD, tile: tileId('t0'), widget: widgetId('w0') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles[0];
    expect(tile?.items.map((item) => item.id)).toEqual([widgetId('w1'), widgetId('w2')]);
    expect(tile?.active).toBe(1);
  });

  it('clamps active into range when the removed item sat at or after it', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 2);
    const result = engine.apply(state, { type: OpType.Remove, board: BOARD, tile: tileId('t0'), widget: widgetId('w2') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles[0];
    expect(tile?.items.map((item) => item.id)).toEqual([widgetId('w0'), widgetId('w1')]);
    expect(tile?.active).toBe(1);
  });
});
