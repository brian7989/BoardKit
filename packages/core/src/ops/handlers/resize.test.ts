import { describe, expect, it, vi } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';
import * as search from '../../solver/search/index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };
const SIZE_BIG = { w: cell(2), h: cell(2) };

function makeEngine(nudgeOnResize?: boolean): Engine {
  return createEngine({
    grid: GRID,
    catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_BIG] } },
    ...(nudgeOnResize === undefined ? {} : { solver: { nudgeOnResize } }),
  });
}

function seed(engine: Engine, col: number, row: number): BoardsState {
  const result = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    at: { x: cell(col), y: cell(row) },
  });
  if (!result.ok) throw new Error('fixture add should succeed');
  return result.value.state;
}

describe('resize', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seed(engine, 0, 0);
    expect(engine.apply(state, { type: OpType.Resize, board: boardId('nope'), tile: tileId('t0'), size: SIZE_BIG })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.Resize, board: BOARD, tile: tileId('nope'), size: SIZE_BIG })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects SizeNotAllowed when the tile holds a widget that does not support the new size', () => {
    const engine = makeEngine();
    const state = seed(engine, 0, 0);
    const result = engine.apply(state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: { w: cell(3), h: cell(3) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.SizeNotAllowed } });
  });

  it('grows in place and reports the from/to rects', () => {
    const engine = makeEngine();
    const state = seed(engine, 0, 0);
    const result = engine.apply(state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: SIZE_BIG });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.changes[0]).toMatchObject({
      kind: ChangeKind.Resized,
      from: { x: 0, y: 0, w: 1, h: 1 },
      to: { x: 0, y: 0, w: 2, h: 2 },
    });
  });

  it('rejects OutOfBounds when nudgeOnResize is off and growth would leave the board', () => {
    const engine = makeEngine(false);
    const state = seed(engine, 3, 3);
    const result = engine.apply(state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: SIZE_BIG });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.OutOfBounds } });
  });

  it('nudges inward to stay on the board when nudgeOnResize is on (the default)', () => {
    const engine = makeEngine(true);
    const state = seed(engine, 3, 3);
    const result = engine.apply(state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: SIZE_BIG });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t0'));
    expect(tile).toMatchObject({ col: 2, row: 2 });
  });

  it('displaces whatever the grown rect now overlaps', () => {
    const engine = makeEngine();
    const added = engine.apply(seed(engine, 0, 0), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t1'),
      widget: { id: widgetId('w1'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(1), y: cell(0) },
    });
    if (!added.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(added.value.state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: SIZE_BIG });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t1'))).not.toMatchObject({ col: 1, row: 0 });
    expect(result.value.changes.some((change) => change.tile === tileId('t1') && change.kind === ChangeKind.Moved)).toBe(true);
  });

  it('rejects NoValidArrangement immediately, without running the search, when growing would overflow a full board', () => {
    const engine = createEngine({
      grid: { cols: 6, rows: 4 },
      catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, { w: cell(2), h: cell(1) }] } },
    });
    let state = engine.empty();
    for (let index = 0; index < 24; index += 1) {
      const result = engine.apply(state, {
        type: OpType.Add,
        board: BOARD,
        tileId: tileId(`t${index}`),
        widget: { id: widgetId(`w${index}`), type: WIDGET_TYPE },
        size: SIZE_SMALL,
        at: { x: cell(index % 6), y: cell(Math.floor(index / 6)) },
      });
      if (!result.ok) throw new Error('fixture fill should succeed');
      state = result.value.state;
    }

    const searchSpy = vi.spyOn(search, 'branchAndBound');
    const result = engine.apply(state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: { w: cell(2), h: cell(1) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoValidArrangement, blockedBy: [tileId('t1')] } });
    expect(searchSpy).not.toHaveBeenCalled();
    searchSpy.mockRestore();
  });

  it('grows a snapped Overlay tile in place, pushing another Overlay tile out of the way', () => {
    const engine = makeEngine();
    const first = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 0, y: 0 },
    });
    if (!first.ok) throw new Error('fixture add should succeed');
    const second = engine.apply(first.value.state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t1'),
      widget: { id: widgetId('w1'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 1, y: 0 },
    });
    if (!second.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(second.value.state, { type: OpType.Resize, board: BOARD, tile: tileId('t0'), size: SIZE_BIG });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t0'))?.float).toEqual({ x: 0, y: 0 });
    expect(tiles.find((tile) => tile.id === tileId('t1'))?.float).not.toEqual({ x: 1, y: 0 });
  });
});
