import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seedStack(engine: Engine, active = 0): BoardsState {
  const raw = {
    version: 1,
    grid: GRID,
    boards: [
      {
        id: 'default',
        tiles: [{ id: 'stack', col: 0, row: 0, size: SIZE_SMALL, active, items: [{ id: 'a', type: WIDGET_TYPE }, { id: 'b', type: WIDGET_TYPE }] }],
      },
    ],
  };
  const parsed = engine.parse(raw);
  if (!parsed.ok) throw new Error('fixture stack should parse');
  return parsed.value;
}

describe('unstack', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seedStack(engine);
    expect(engine.apply(state, { type: OpType.Unstack, board: boardId('nope'), tile: tileId('stack'), newTile: tileId('new') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.Unstack, board: BOARD, tile: tileId('nope'), newTile: tileId('new') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects StackIncompatible for a tile that is not a stack', () => {
    const engine = makeEngine();
    const single = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('single'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(0), y: cell(0) },
    });
    if (!single.ok) throw new Error('fixture add should succeed');
    const result = engine.apply(single.value.state, { type: OpType.Unstack, board: BOARD, tile: tileId('single'), newTile: tileId('new') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.StackIncompatible } });
  });

  it('rejects UnknownTarget for a named widget that is not on the tile', () => {
    const engine = makeEngine();
    const state = seedStack(engine);
    const result = engine.apply(state, { type: OpType.Unstack, board: BOARD, tile: tileId('stack'), newTile: tileId('new'), widget: widgetId('nope') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('pops the active item into its own tile at the first free space by default', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 1);
    const result = engine.apply(state, { type: OpType.Unstack, board: BOARD, tile: tileId('stack'), newTile: tileId('new') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    const remaining = tiles.find((tile) => tile.id === tileId('stack'));
    const popped = tiles.find((tile) => tile.id === tileId('new'));
    expect(remaining?.items.map((item) => item.id)).toEqual([widgetId('a')]);
    expect(popped?.items.map((item) => item.id)).toEqual([widgetId('b')]);
    expect(popped).toMatchObject({ col: 1, row: 0 });
    expect(result.value.changes).toEqual([
      { tile: tileId('stack'), board: BOARD, kind: ChangeKind.Unstacked },
      { tile: tileId('new'), board: BOARD, kind: ChangeKind.Added, to: { x: 1, y: 0, w: 1, h: 1 } },
    ]);
  });

  it('pops a specifically named item instead of the active one', () => {
    const engine = makeEngine();
    const state = seedStack(engine, 1);
    const result = engine.apply(state, { type: OpType.Unstack, board: BOARD, tile: tileId('stack'), newTile: tileId('new'), widget: widgetId('a') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const popped = result.value.state.boards[0]?.tiles.find((tile) => tile.id === tileId('new'));
    expect(popped?.items.map((item) => item.id)).toEqual([widgetId('a')]);
  });

  it('rejects NoFreeSpace when the board is completely full', () => {
    const engine = makeEngine();
    let state = seedStack(engine, 0);
    for (let index = 1; index < GRID.cols * GRID.rows; index += 1) {
      const added = engine.apply(state, {
        type: OpType.Add,
        board: BOARD,
        tileId: tileId(`t${index}`),
        widget: { id: widgetId(`w${index}`), type: WIDGET_TYPE },
        size: SIZE_SMALL,
      });
      if (!added.ok) throw new Error('fixture fill should succeed');
      state = added.value.state;
    }

    const result = engine.apply(state, { type: OpType.Unstack, board: BOARD, tile: tileId('stack'), newTile: tileId('new') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoFreeSpace } });
  });
});
