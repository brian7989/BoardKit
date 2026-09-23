import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine, type Size } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };
const SIZE_BIG = { w: cell(2), h: cell(2) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_BIG] } } });
}

function seed(
  engine: Engine,
  tiles: readonly { readonly id: string; readonly col: number; readonly row: number; readonly size?: Size }[],
): BoardsState {
  return tiles.reduce((state, tile) => {
    const result = engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId(tile.id),
      widget: { id: widgetId(`${tile.id}-w`), type: WIDGET_TYPE },
      size: tile.size ?? SIZE_SMALL,
      at: { x: cell(tile.col), y: cell(tile.row) },
    });
    if (!result.ok) throw new Error('fixture seed failed');
    return result.value.state;
  }, engine.empty());
}

describe('move', () => {
  it('rejects UnknownTarget for a missing board', () => {
    const engine = makeEngine();
    const state = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const result = engine.apply(state, { type: OpType.Move, board: boardId('nope'), tile: tileId('t0'), to: { x: cell(1), y: cell(1) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('rejects UnknownTarget for a missing tile', () => {
    const engine = makeEngine();
    const state = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const result = engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('nope'), to: { x: cell(1), y: cell(1) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('rejects OutOfBounds for a target off the grid', () => {
    const engine = makeEngine();
    const state = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const result = engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(10), y: cell(10) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.OutOfBounds } });
  });

  it('moves to an empty cell and reports the from/to rects', () => {
    const engine = makeEngine();
    const state = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const result = engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(2), y: cell(2) } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.changes[0]).toMatchObject({
      kind: ChangeKind.Moved,
      from: { x: 0, y: 0, w: 1, h: 1 },
      to: { x: 2, y: 2, w: 1, h: 1 },
    });
  });

  it('displaces whatever occupies the target cell', () => {
    const engine = makeEngine();
    const state = seed(engine, [{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]);
    const result = engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(1), y: cell(0) } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t0'))).toMatchObject({ col: 1, row: 0 });
    expect(tiles.find((tile) => tile.id === tileId('t1'))).not.toMatchObject({ col: 1, row: 0 });
    expect(result.value.changes.some((change) => change.tile === tileId('t1') && change.kind === ChangeKind.Moved)).toBe(true);
  });

  it('rejects NoValidArrangement, naming the blocked tile, when the solver cannot find a fitting arrangement in its node budget', () => {
    // A solution may well exist in principle, but a budget this tight is spent entering the
    // search tree and exhausted on the very first candidate, before one can ever be recorded.
    const engine = createEngine({
      grid: GRID,
      catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_BIG] } },
      solver: { maxNodes: 1 },
    });
    const state = seed(engine, [{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]);

    const result = engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(1), y: cell(0) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoValidArrangement, blockedBy: [tileId('t1')] } });
  });
});
