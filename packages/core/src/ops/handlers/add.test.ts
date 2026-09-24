import { describe, expect, it, vi } from 'vitest';
import {
  createEngine,
  boardId,
  tileId,
  widgetId,
  cell,
  OpType,
  RejectReason,
  ChangeKind,
  type BoardsState,
  type Engine,
} from '../../index.js';
import * as search from '../../solver/search/index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

interface AddTileOptions {
  readonly id: string;
  readonly at?: { readonly x: number; readonly y: number };
}

function addTile(engine: Engine, state: BoardsState, options: AddTileOptions) {
  return engine.apply(state, {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId(options.id),
    widget: { id: widgetId(`${options.id}-w`), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    ...(options.at ? { at: { x: cell(options.at.x), y: cell(options.at.y) } } : {}),
  });
}

describe('add', () => {
  it('rejects UnknownTarget for a board that does not exist', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: boardId('nope'),
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
    });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('rejects SizeNotAllowed for an unregistered widget type', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: 'unregistered.widget' },
      size: SIZE_SMALL,
    });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.SizeNotAllowed } });
  });

  it('rejects SizeNotAllowed for a size the widget does not support', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: { w: cell(3), h: cell(3) },
    });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.SizeNotAllowed } });
  });

  it('places into the first free cell, row-major, when no position is given', () => {
    const engine = makeEngine();
    const first = addTile(engine, engine.empty(), { id: 't0' });
    if (!first.ok) throw new Error('fixture add should succeed');
    const result = addTile(engine, first.value.state, { id: 't1' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('t1'));
    expect(tile).toMatchObject({ col: 1, row: 0 });
    expect(result.value.changes[0]).toMatchObject({ kind: ChangeKind.Added, tile: tileId('t1') });
  });

  it('pins at the given position, displacing whatever is there', () => {
    const engine = makeEngine();
    const seeded = addTile(engine, engine.empty(), { id: 't0', at: { x: 0, y: 0 } });
    if (!seeded.ok) throw new Error('fixture add should succeed');

    const result = addTile(engine, seeded.value.state, { id: 't1', at: { x: 0, y: 0 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t1'))).toMatchObject({ col: 0, row: 0 });
    expect(tiles.find((tile) => tile.id === tileId('t0'))).not.toMatchObject({ col: 0, row: 0 });
    expect(result.value.changes.some((change) => change.tile === tileId('t0') && change.kind === ChangeKind.Moved)).toBe(true);
  });

  it('rejects NoFreeSpace when the board is completely full', () => {
    const engine = makeEngine();
    let state = engine.empty();
    for (let index = 0; index < GRID.cols * GRID.rows; index += 1) {
      const result = addTile(engine, state, { id: `t${index}` });
      if (!result.ok) throw new Error('fixture fill should succeed');
      state = result.value.state;
    }
    const result = addTile(engine, state, { id: 'overflow' });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoFreeSpace } });
  });

  it('ignores a floating tile as an obstacle when placing into free space', () => {
    const engine = makeEngine();
    const seeded = addTile(engine, engine.empty(), { id: 't0', at: { x: 0, y: 0 } });
    if (!seeded.ok) throw new Error('fixture add should succeed');
    const floated = engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture float should succeed');

    // t0's stale col/row (0,0) would normally block that cell; floating must exempt it.
    const result = addTile(engine, floated.value.state, { id: 't1' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const placed = result.value.state.boards[0]?.tiles.find((tile) => tile.id === tileId('t1'));
    expect(placed).toMatchObject({ col: 0, row: 0 });
  });

  it('rejects a pinned add with NoValidArrangement immediately, without running the search, when the board is full', () => {
    const engine = createEngine({ grid: { cols: 6, rows: 4 }, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
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
    const result = engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('overflow'),
      widget: { id: widgetId('overflow-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(0), y: cell(0) },
    });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoValidArrangement, blockedBy: [tileId('t0')] } });
    expect(searchSpy).not.toHaveBeenCalled();
    searchSpy.mockRestore();
  });

  it('adds a Free tile already floating, even on a completely full board', () => {
    const engine = makeEngine();
    let state = engine.empty();
    for (let index = 0; index < GRID.cols * GRID.rows; index += 1) {
      const result = addTile(engine, state, { id: `t${index}` });
      if (!result.ok) throw new Error('fixture fill should succeed');
      state = result.value.state;
    }

    const result = engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('floater'),
      widget: { id: widgetId('floater-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 1.5, y: 2.5, free: true },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('floater'));
    expect(tile?.float).toEqual({ x: 1.5, y: 2.5, free: true });
  });

  it('clamps an out-of-range Free float position into the board', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('floater'),
      widget: { id: widgetId('floater-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 99, y: -5, free: true },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('floater'));
    expect(tile?.float).toEqual({ x: GRID.cols - 1, y: 0, free: true });
  });

  it('adds a tile snapped into the Overlay layer at the rounded position, even on a full grid', () => {
    const engine = makeEngine();
    let state = engine.empty();
    for (let index = 0; index < GRID.cols * GRID.rows; index += 1) {
      const result = addTile(engine, state, { id: `t${index}` });
      if (!result.ok) throw new Error('fixture fill should succeed');
      state = result.value.state;
    }

    const result = engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('floater'),
      widget: { id: widgetId('floater-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 1.4, y: 2.6 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('floater'));
    expect(tile?.float).toEqual({ x: 1, y: 3 });
  });

  it('pushes an existing Overlay tile out of the way when adding a snapped one on top', () => {
    const engine = makeEngine();
    const first = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('a'),
      widget: { id: widgetId('a-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 0, y: 0 },
    });
    if (!first.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(first.value.state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('b'),
      widget: { id: widgetId('b-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 0, y: 0 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('b'))?.float).toEqual({ x: 0, y: 0 });
    expect(tiles.find((tile) => tile.id === tileId('a'))?.float).not.toEqual({ x: 0, y: 0 });
  });

  it('falls back to a free Overlay spot when the requested cell is out of bounds', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('floater'),
      widget: { id: widgetId('floater-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 99, y: -5 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('floater'));
    expect(tile?.float).toEqual({ x: 0, y: 0 });
  });

  it('rejects NoFreeSpace adding a snapped tile once the Overlay layer is completely full', () => {
    const engine = createEngine({ grid: { cols: 1, rows: 1 }, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
    const first = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('a'),
      widget: { id: widgetId('a-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 0, y: 0 },
    });
    if (!first.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(first.value.state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('b'),
      widget: { id: widgetId('b-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 0, y: 0 },
    });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoFreeSpace } });
  });

  it('un-floating a tile added floating re-places it via the normal solver', () => {
    const engine = makeEngine();
    const added = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('floater'),
      widget: { id: widgetId('floater-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 1.4, y: 1.6 },
    });
    if (!added.ok) throw new Error('fixture float-add should succeed');

    const grounded = engine.apply(added.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('floater'), floating: false });
    expect(grounded.ok).toBe(true);
    if (!grounded.ok) return;
    const tile = grounded.value.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('floater'));
    expect(tile).toMatchObject({ col: 1, row: 2 });
    expect(tile?.float).toBeUndefined();
  });
});
