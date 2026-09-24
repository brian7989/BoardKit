import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seedFree(engine: Engine): BoardsState {
  const added = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    float: { x: 0, y: 0, free: true },
  });
  if (!added.ok) throw new Error('fixture add should succeed');
  return added.value.state;
}

function seedOverlay(engine: Engine, at: { readonly x: number; readonly y: number }): BoardsState {
  const added = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    float: at,
  });
  if (!added.ok) throw new Error('fixture add should succeed');
  return added.value.state;
}

describe('moveFloating', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seedFree(engine);
    expect(engine.apply(state, { type: OpType.MoveFloating, board: boardId('nope'), tile: tileId('t0'), to: { x: 1, y: 1 } })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('nope'), to: { x: 1, y: 1 } })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects NotFloating for a tile that is grounded', () => {
    const engine = makeEngine();
    const added = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(0), y: cell(0) },
    });
    if (!added.ok) throw new Error('fixture add should succeed');
    const result = engine.apply(added.value.state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 1, y: 1 } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NotFloating } });
  });

  it('follows the pointer to fractional coordinates, with no collision check, for a Free tile', () => {
    const engine = makeEngine();
    const state = seedFree(engine);
    const result = engine.apply(state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 1.5, y: 2.25 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 1.5, y: 2.25, free: true });
    expect(result.value.changes[0]).toMatchObject({ kind: ChangeKind.Moved });
  });

  it('clamps a Free tile to the board edges rather than rejecting a target that would leave them', () => {
    const engine = makeEngine();
    const state = seedFree(engine);
    const result = engine.apply(state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: -5, y: 100 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 0, y: GRID.rows - 1, free: true });
  });

  it('rounds a snapped Overlay tile to the nearest cell and commits', () => {
    const engine = makeEngine();
    const state = seedOverlay(engine, { x: 0, y: 0 });
    const result = engine.apply(state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 2.4, y: 1.6 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 2, y: 2 });
  });

  it('pushes another Overlay tile out of the way like a grid Move', () => {
    const engine = makeEngine();
    const withOther = engine.apply(seedOverlay(engine, { x: 0, y: 0 }), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t1'),
      widget: { id: widgetId('w1'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 2, y: 0 },
    });
    if (!withOther.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(withOther.value.state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 2, y: 0 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t0'))?.float).toEqual({ x: 2, y: 0 });
    expect(tiles.find((tile) => tile.id === tileId('t1'))?.float).not.toEqual({ x: 2, y: 0 });
  });

  it('snaps a snapped Overlay tile back to its own cell when the target is impossible', () => {
    const engine = createEngine({ grid: { cols: 2, rows: 1 }, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
    const withOther = engine.apply(seedOverlay(engine, { x: 0, y: 0 }), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t1'),
      widget: { id: widgetId('w1'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 1, y: 0 },
    });
    if (!withOther.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(withOther.value.state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 5, y: 5 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 0, y: 0 });
  });
});
