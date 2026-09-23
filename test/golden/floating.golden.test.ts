import { describe, expect, it } from 'vitest';
import {
  cell,
  OpType,
  RejectReason,
  tileId,
  widgetId,
  type MoveFloatingOp,
  type SetFloatingOp,
} from '../../packages/core/src/index.ts';
import { DEFAULT_BOARD, GRID_COLS, GRID_ROWS, SIZE_SMALL, WIDGET_TYPE, makeTestEngine, rawState } from '../property/fixtures.ts';

describe('setFloating / moveFloating (golden fixtures)', () => {
  it('anchors float at the tile\'s current grid position when turning floating on', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 1, row: 2 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: SetFloatingOp = { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]).toMatchObject({ col: 1, row: 2, float: { x: 1, y: 2 } });
  });

  it('turning floating on twice is idempotent', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 1, row: 2 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const first = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!first.ok) throw new Error('fixture setFloating should succeed');

    const result = engine.apply(first.value.state, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]).toMatchObject({ float: { x: 1, y: 2 } });
  });

  it('turning floating off when not floating is a no-op success', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: SetFloatingOp = { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: false };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]).not.toHaveProperty('float');
  });

  it('moveFloating repositions a floating tile freely, even right on top of another tile', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 2, row: 2 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');

    const op: MoveFloatingOp = { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('t0'), to: { x: 2.4, y: 1.7 } };
    const result = engine.apply(floated.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]).toMatchObject({ float: { x: 2.4, y: 1.7 } });
    expect(engine.check(result.value.state)).toEqual([]);
  });

  it('clamps a floating tile to the board rather than letting it be dragged off the edge', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');

    const op: MoveFloatingOp = { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('t0'), to: { x: -1.7, y: 99 } };
    const result = engine.apply(floated.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // A 1x1 tile on a 4x4 grid: the furthest its origin can sit is (3, 3).
    expect(result.value.state.boards[0]?.tiles[0]).toMatchObject({ float: { x: 0, y: GRID_ROWS - 1 } });
  });

  it('clamps along one axis while leaving the other free, so an edge drag slides instead of sticking', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');

    const op: MoveFloatingOp = { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('t0'), to: { x: 12, y: 1.25 } };
    const result = engine.apply(floated.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]).toMatchObject({ float: { x: GRID_COLS - 1, y: 1.25 } });
  });

  it('rejects moveFloating on a tile that is not floating', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: MoveFloatingOp = { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('t0'), to: { x: 1, y: 1 } };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NotFloating } });
  });

  it('rejects moveFloating on an unknown tile', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: MoveFloatingOp = { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('does-not-exist'), to: { x: 1, y: 1 } };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('turning floating off rounds position and rejoins the grid, displacing whatever is there', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 2, row: 2 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');
    const moved = engine.apply(floated.value.state, { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('t0'), to: { x: 2.1, y: 1.8 } });
    if (!moved.ok) throw new Error('fixture moveFloating should succeed');

    const op: SetFloatingOp = { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: false };
    const result = engine.apply(moved.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const t0 = result.value.state.boards[0]?.tiles.find((tile) => tile.id === 't0');
    expect(t0).toMatchObject({ col: 2, row: 2 });
    expect(t0).not.toHaveProperty('float');
    expect(engine.check(result.value.state)).toEqual([]);
  });

  it('grounds a float dragged hard against the edge onto the last cell, never out of bounds', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');
    const moved = engine.apply(floated.value.state, { type: OpType.MoveFloating, board: DEFAULT_BOARD, tile: tileId('t0'), to: { x: 99, y: 99 } });
    if (!moved.ok) throw new Error('fixture moveFloating should succeed');

    const op: SetFloatingOp = { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: false };
    const result = engine.apply(moved.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]).toMatchObject({ col: GRID_COLS - 1, row: GRID_ROWS - 1 });
    expect(engine.check(result.value.state)).toEqual([]);
  });

  // Bounds are enforced by moveFloating, not by validation (a float is exempt from the
  // bounds check), so state handed in from outside can still carry an off-board float. Grounding
  // one is the same rejection any out-of-bounds placement gets.
  it('rejects turning floating off when host-supplied state puts the float outside the grid', () => {
    const engine = makeTestEngine();
    const tile = { id: 't0', col: 0, row: 0, size: SIZE_SMALL, items: [{ id: 't0-w', type: WIDGET_TYPE }], active: 0, float: { x: 99, y: 99 } };
    const parsed = engine.parse({ version: 1, grid: { cols: GRID_COLS, rows: GRID_ROWS }, boards: [{ id: DEFAULT_BOARD, tiles: [tile] }] });
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: SetFloatingOp = { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: false };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.OutOfBounds } });
  });

  it('does not let a floating tile\'s stale grid slot block auto-placement of a new tile', () => {
    const engine = makeTestEngine();
    const tiles = Array.from({ length: GRID_COLS * GRID_ROWS }, (_unused, index) => ({
      id: `t${index}`,
      col: index % GRID_COLS,
      row: Math.floor(index / GRID_COLS),
    }));
    const parsed = engine.parse(rawState(tiles));
    if (!parsed.ok) throw new Error('fixture should parse');

    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t15'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');

    const result = engine.apply(floated.value.state, {
      type: OpType.Add,
      board: DEFAULT_BOARD,
      tileId: tileId('new'),
      widget: { id: widgetId('new-widget'), type: WIDGET_TYPE, props: {} },
      size: SIZE_SMALL,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const added = result.value.state.boards[0]?.tiles.find((tile) => tile.id === 'new');
    expect(added).toMatchObject({ col: cell(3), row: cell(3) });
  });

  it('does not displace a floating tile when another tile is pinned onto its stale grid slot', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const floated = engine.apply(parsed.value, { type: OpType.SetFloating, board: DEFAULT_BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture setFloating should succeed');

    const result = engine.apply(floated.value.state, {
      type: OpType.Add,
      board: DEFAULT_BOARD,
      tileId: tileId('new'),
      widget: { id: widgetId('new-widget'), type: WIDGET_TYPE, props: {} },
      size: SIZE_SMALL,
      at: { x: cell(0), y: cell(0) },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.changes).toHaveLength(1);
    const t0 = result.value.state.boards[0]?.tiles.find((tile) => tile.id === 't0');
    expect(t0).toMatchObject({ col: 0, row: 0, float: { x: 0, y: 0 } });
    const added = result.value.state.boards[0]?.tiles.find((tile) => tile.id === 'new');
    expect(added).toMatchObject({ col: cell(0), row: cell(0) });
    expect(engine.check(result.value.state)).toEqual([]);
  });
});
