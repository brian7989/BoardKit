import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

// Four items [a,b,c,d] so every moveActive branch (active === from, from < to, from > to,
// unaffected) can be exercised from one fixture shape.
function seed(engine: Engine, active: number): BoardsState {
  const raw = {
    version: 1,
    grid: GRID,
    boards: [
      {
        id: 'default',
        tiles: [
          {
            id: 't0',
            col: 0,
            row: 0,
            size: SIZE_SMALL,
            active,
            items: ['a', 'b', 'c', 'd'].map((id) => ({ id, type: WIDGET_TYPE })),
          },
        ],
      },
    ],
  };
  const parsed = engine.parse(raw);
  if (!parsed.ok) throw new Error('fixture stack should parse');
  return parsed.value;
}

function itemIds(state: BoardsState): readonly string[] {
  return state.boards[0]?.tiles[0]?.items.map((item) => item.id) ?? [];
}

describe('reorderStack', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seed(engine, 0);
    expect(engine.apply(state, { type: OpType.ReorderStack, board: boardId('nope'), tile: tileId('t0'), from: 0, to: 1 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.ReorderStack, board: BOARD, tile: tileId('nope'), from: 0, to: 1 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects UnknownTarget for an out-of-range from or to index', () => {
    const engine = makeEngine();
    const state = seed(engine, 0);
    expect(engine.apply(state, { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: -1, to: 1 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: 0, to: 4 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('moves the item at from to to, shifting the rest', () => {
    const engine = makeEngine();
    const result = engine.apply(seed(engine, 0), { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: 0, to: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemIds(result.value.state)).toEqual(['b', 'c', 'a', 'd']);
    expect(result.value.changes).toEqual([{ tile: tileId('t0'), board: BOARD, kind: ChangeKind.Reordered }]);
  });

  it('moves active along with its item when active is the one moved', () => {
    const engine = makeEngine();
    // active starts on 'a' (index 0); after moving it to index 2, active must follow it there.
    const result = engine.apply(seed(engine, 0), { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: 0, to: 2 });
    if (!result.ok) throw new Error('expected reorder to succeed');
    expect(result.value.state.boards[0]?.tiles[0]?.active).toBe(2);
  });

  it('shifts active back by one when an earlier item moves past it (from < to)', () => {
    const engine = makeEngine();
    // active on 'c' (index 2); moving 'a' (index 0) to index 3 shifts c left to index 1.
    const result = engine.apply(seed(engine, 2), { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: 0, to: 3 });
    if (!result.ok) throw new Error('expected reorder to succeed');
    expect(itemIds(result.value.state)).toEqual(['b', 'c', 'd', 'a']);
    expect(result.value.state.boards[0]?.tiles[0]?.active).toBe(1);
  });

  it('shifts active forward by one when a later item moves before it (from > to)', () => {
    const engine = makeEngine();
    // active on 'b' (index 1); moving 'd' (index 3) to index 0 shifts b right to index 2.
    const result = engine.apply(seed(engine, 1), { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: 3, to: 0 });
    if (!result.ok) throw new Error('expected reorder to succeed');
    expect(itemIds(result.value.state)).toEqual(['d', 'a', 'b', 'c']);
    expect(result.value.state.boards[0]?.tiles[0]?.active).toBe(2);
  });

  it('leaves active unaffected when the move does not cross it', () => {
    const engine = makeEngine();
    // active on 'a' (index 0); moving 'c' (index 2) to index 3 never crosses index 0.
    const result = engine.apply(seed(engine, 0), { type: OpType.ReorderStack, board: BOARD, tile: tileId('t0'), from: 2, to: 3 });
    if (!result.ok) throw new Error('expected reorder to succeed');
    expect(result.value.state.boards[0]?.tiles[0]?.active).toBe(0);
  });
});
