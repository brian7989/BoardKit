import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seedFloating(engine: Engine): BoardsState {
  const added = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    at: { x: cell(0), y: cell(0) },
  });
  if (!added.ok) throw new Error('fixture add should succeed');
  const floated = engine.apply(added.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
  if (!floated.ok) throw new Error('fixture float should succeed');
  return floated.value.state;
}

describe('moveFloating', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seedFloating(engine);
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

  it('follows the pointer to fractional coordinates, with no collision check', () => {
    const engine = makeEngine();
    const state = seedFloating(engine);
    const result = engine.apply(state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 1.5, y: 2.25 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 1.5, y: 2.25 });
    expect(result.value.changes[0]).toMatchObject({ kind: ChangeKind.Moved });
  });

  it('clamps to the board edges rather than rejecting a target that would leave them', () => {
    const engine = makeEngine();
    const state = seedFloating(engine);
    const result = engine.apply(state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: -5, y: 100 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 0, y: GRID.rows - 1 });
  });
});
