import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(grid = GRID): Engine {
  return createEngine({ grid, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seed(engine: Engine, id: string, float: { readonly x: number; readonly y: number; readonly free?: boolean }): BoardsState {
  const result = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId(id),
    widget: { id: widgetId(`${id}-w`), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    float,
  });
  if (!result.ok) throw new Error('fixture add should succeed');
  return result.value.state;
}

describe('setFloatFree', () => {
  it('rejects UnknownTarget for a missing board, tile, or a grounded tile', () => {
    const engine = makeEngine();
    const state = seed(engine, 't0', { x: 0, y: 0 });
    expect(engine.apply(state, { type: OpType.SetFloatFree, board: boardId('nope'), tile: tileId('t0'), free: true })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.SetFloatFree, board: BOARD, tile: tileId('nope'), free: true })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('is a no-op when the tile is already in the requested state', () => {
    const engine = makeEngine();
    const state = seed(engine, 't0', { x: 1, y: 1 });
    const result = engine.apply(state, { type: OpType.SetFloatFree, board: BOARD, tile: tileId('t0'), free: false });
    expect(result).toEqual({ ok: true, value: { state, changes: [] } });
  });

  it('moves a snapped Overlay tile to Free by just setting the flag', () => {
    const engine = makeEngine();
    const state = seed(engine, 't0', { x: 1, y: 1 });
    const result = engine.apply(state, { type: OpType.SetFloatFree, board: BOARD, tile: tileId('t0'), free: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 1, y: 1, free: true });
    expect(result.value.changes).toEqual([{ tile: tileId('t0'), board: BOARD, kind: ChangeKind.Freed }]);
  });

  it('moves a Free tile to snapped Overlay, rounding its position and solving', () => {
    const engine = makeEngine();
    const state = seed(engine, 't0', { x: 1.4, y: 1.6, free: true });
    const result = engine.apply(state, { type: OpType.SetFloatFree, board: BOARD, tile: tileId('t0'), free: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile?.float).toEqual({ x: 1, y: 2 });
    expect(result.value.changes[0]).toMatchObject({ kind: ChangeKind.Snapped });
  });

  it('pushes an existing Overlay tile out of the way when a Free tile snaps on top of it', () => {
    const engine = makeEngine();
    const withOverlay = seed(engine, 'occupant', { x: 1, y: 1 });
    const added = engine.apply(withOverlay, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('t0-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 1.1, y: 1.1, free: true },
    });
    if (!added.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(added.value.state, { type: OpType.SetFloatFree, board: BOARD, tile: tileId('t0'), free: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t0'))?.float).toEqual({ x: 1, y: 1 });
    expect(tiles.find((tile) => tile.id === tileId('occupant'))?.float).not.toEqual({ x: 1, y: 1 });
  });

  it('rejects NoFreeSpace snapping a Free tile once the Overlay layer is completely full', () => {
    const engine = makeEngine({ cols: 1, rows: 1 });
    const occupant = seed(engine, 'occupant', { x: 0, y: 0 });
    const added = engine.apply(occupant, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('t0-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 5, y: 5, free: true },
    });
    if (!added.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(added.value.state, { type: OpType.SetFloatFree, board: BOARD, tile: tileId('t0'), free: false });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoFreeSpace } });
  });
});
