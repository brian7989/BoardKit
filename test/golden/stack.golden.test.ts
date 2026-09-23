import { describe, expect, it } from 'vitest';
import {
  cell,
  createEngine,
  OpType,
  RejectReason,
  tileId,
  widgetId,
  type Engine,
  type ReorderStackOp,
  type SetActiveOp,
  type StackOp,
  type UnstackOp,
} from '../../packages/core/src/index.ts';
import { DEFAULT_BOARD, GRID_COLS, GRID_ROWS, SIZE_SMALL, WIDGET_TYPE, makeTestEngine, rawState } from '../property/fixtures.ts';

const SIZE_WIDE = { w: cell(2), h: cell(1) };

// A widget type with two distinct, both-reachable sizes — the shared fixture's WIDGET_TYPE
// only has SIZE_SMALL and an always-out-of-bounds SIZE_HUGE, so it can't produce two tiles
// that are each validly sized but different from each other.
function makeTwoSizeEngine(): Engine {
  return createEngine({
    grid: { cols: GRID_COLS, rows: GRID_ROWS },
    catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_WIDE] } },
  });
}

describe('stack / unstack / setActive / reorderStack (golden fixtures)', () => {
  it('stacks one tile onto another, removing the source and activating its item', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: StackOp = { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t1'), onto: tileId('t0') };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.map((tile) => tile.id)).toEqual(['t0']);
    expect(tiles[0]?.items.map((item) => item.id)).toEqual(['t0-widget', 't1-widget']);
    expect(tiles[0]?.active).toBe(1);
  });

  it('rejects stacking tiles of different sizes', () => {
    const engine = makeTwoSizeEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 2, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const widened = engine.apply(parsed.value, { type: OpType.Resize, board: DEFAULT_BOARD, tile: tileId('t1'), size: SIZE_WIDE });
    if (!widened.ok) throw new Error('fixture resize should succeed');

    const op: StackOp = { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t1'), onto: tileId('t0') };
    const result = engine.apply(widened.value.state, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.StackIncompatible } });
  });

  it('rejects an unknown stack target', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: StackOp = { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t0'), onto: tileId('does-not-exist') };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('unstacks the active item into a new tile at a free space', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const stacked = engine.apply(parsed.value, { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t1'), onto: tileId('t0') });
    if (!stacked.ok) throw new Error('fixture stack should succeed');

    const op: UnstackOp = { type: OpType.Unstack, board: DEFAULT_BOARD, tile: tileId('t0'), newTile: tileId('t2') };
    const result = engine.apply(stacked.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tiles = result.value.state.boards[0]?.tiles ?? [];
    const remaining = tiles.find((tile) => tile.id === 't0');
    const popped = tiles.find((tile) => tile.id === 't2');
    expect(remaining?.items.map((item) => item.id)).toEqual(['t0-widget']);
    expect(popped?.items.map((item) => item.id)).toEqual(['t1-widget']);
    expect(popped?.size).toEqual(SIZE_SMALL);
  });

  it('rejects unstacking a tile that is not a stack', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: UnstackOp = { type: OpType.Unstack, board: DEFAULT_BOARD, tile: tileId('t0'), newTile: tileId('t1') };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.StackIncompatible } });
  });

  it('setActive cycles which stack member is active', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const stacked = engine.apply(parsed.value, { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t1'), onto: tileId('t0') });
    if (!stacked.ok) throw new Error('fixture stack should succeed');

    const op: SetActiveOp = { type: OpType.SetActive, board: DEFAULT_BOARD, tile: tileId('t0'), index: 0 };
    const result = engine.apply(stacked.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]?.active).toBe(0);
  });

  it('rejects setActive with an out-of-range index', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: SetActiveOp = { type: OpType.SetActive, board: DEFAULT_BOARD, tile: tileId('t0'), index: 5 };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('reorderStack moves an item to an adjacent position and follows the active index', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const stacked = engine.apply(parsed.value, { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t1'), onto: tileId('t0') });
    if (!stacked.ok) throw new Error('fixture stack should succeed');
    // Stacked state: items = [t0-widget, t1-widget], active = 1 (t1-widget).

    const op: ReorderStackOp = { type: OpType.ReorderStack, board: DEFAULT_BOARD, tile: tileId('t0'), from: 0, to: 1 };
    const result = engine.apply(stacked.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tile = result.value.state.boards[0]?.tiles[0];
    expect(tile?.items.map((item) => item.id)).toEqual(['t1-widget', 't0-widget']);
    expect(tile?.active).toBe(0); // the active item (t1-widget) moved from index 1 to index 0
  });

  function makeThreeItemStack(engine: Engine) {
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }, { id: 't2', col: 2, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const first = engine.apply(parsed.value, { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t1'), onto: tileId('t0') });
    if (!first.ok) throw new Error('fixture stack should succeed');
    const second = engine.apply(first.value.state, { type: OpType.Stack, board: DEFAULT_BOARD, from: tileId('t2'), onto: tileId('t0') });
    if (!second.ok) throw new Error('fixture stack should succeed');
    // items = [t0-widget, t1-widget, t2-widget], active = 2 (t2-widget).
    return second.value.state;
  }

  it('reorderStack moving an item across a distant position shifts the rest, not swaps', () => {
    const engine = makeTestEngine();
    const state = makeThreeItemStack(engine);

    const op: ReorderStackOp = { type: OpType.ReorderStack, board: DEFAULT_BOARD, tile: tileId('t0'), from: 0, to: 2 };
    const result = engine.apply(state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tile = result.value.state.boards[0]?.tiles[0];
    // t0-widget moves to the end; t1-widget and t2-widget each shift down one, not swap places.
    expect(tile?.items.map((item) => item.id)).toEqual(['t1-widget', 't2-widget', 't0-widget']);
    expect(tile?.active).toBe(1); // the active item (t2-widget) shifted from index 2 to index 1
  });

  it('unstacks a specific, non-active item and keeps the active item pointing at the same one', () => {
    const engine = makeTestEngine();
    const state = makeThreeItemStack(engine);

    const op: UnstackOp = { type: OpType.Unstack, board: DEFAULT_BOARD, tile: tileId('t0'), newTile: tileId('t3'), widget: widgetId('t0-widget') };
    const result = engine.apply(state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tiles = result.value.state.boards[0]?.tiles ?? [];
    const remaining = tiles.find((tile) => tile.id === 't0');
    const popped = tiles.find((tile) => tile.id === 't3');
    expect(remaining?.items.map((item) => item.id)).toEqual(['t1-widget', 't2-widget']);
    expect(remaining?.active).toBe(1); // still t2-widget, now at index 1 instead of 2
    expect(popped?.items.map((item) => item.id)).toEqual(['t0-widget']);
  });
});
