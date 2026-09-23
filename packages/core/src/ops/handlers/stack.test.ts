import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };
const SIZE_BIG = { w: cell(2), h: cell(2) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_BIG] } } });
}

function seedTwo(engine: Engine, sizeA = SIZE_SMALL, sizeB = SIZE_SMALL): BoardsState {
  const a = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('a'),
    widget: { id: widgetId('wa'), type: WIDGET_TYPE },
    size: sizeA,
    at: { x: cell(0), y: cell(0) },
  });
  if (!a.ok) throw new Error('fixture add should succeed');
  const b = engine.apply(a.value.state, {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('b'),
    widget: { id: widgetId('wb'), type: WIDGET_TYPE },
    size: sizeB,
    at: { x: cell(1), y: cell(0) },
  });
  if (!b.ok) throw new Error('fixture add should succeed');
  return b.value.state;
}

describe('stack', () => {
  it('rejects UnknownTarget for a missing board, from, or onto tile', () => {
    const engine = makeEngine();
    const state = seedTwo(engine);
    expect(engine.apply(state, { type: OpType.Stack, board: boardId('nope'), from: tileId('a'), onto: tileId('b') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.Stack, board: BOARD, from: tileId('nope'), onto: tileId('b') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.Stack, board: BOARD, from: tileId('a'), onto: tileId('nope') })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects UnknownTarget when from and onto name the same tile', () => {
    const engine = makeEngine();
    const state = seedTwo(engine);
    const result = engine.apply(state, { type: OpType.Stack, board: BOARD, from: tileId('a'), onto: tileId('a') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('rejects StackIncompatible for tiles of different sizes', () => {
    const engine = makeEngine();
    const state = seedTwo(engine, SIZE_SMALL, SIZE_BIG);
    const result = engine.apply(state, { type: OpType.Stack, board: BOARD, from: tileId('a'), onto: tileId('b') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.StackIncompatible } });
  });

  it('merges the source items onto the target, making the incoming item active, and drops the source tile', () => {
    const engine = makeEngine();
    const state = seedTwo(engine);
    const result = engine.apply(state, { type: OpType.Stack, board: BOARD, from: tileId('a'), onto: tileId('b') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.map((tile) => tile.id)).toEqual([tileId('b')]);
    const merged = tiles[0];
    expect(merged?.items.map((item) => item.id)).toEqual([widgetId('wb'), widgetId('wa')]);
    expect(merged?.active).toBe(1);
    expect(result.value.changes).toEqual([
      { tile: tileId('a'), board: BOARD, kind: ChangeKind.Removed },
      { tile: tileId('b'), board: BOARD, kind: ChangeKind.Stacked },
    ]);
  });
});
