import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seedStack(engine: Engine): BoardsState {
  const raw = {
    version: 1,
    grid: GRID,
    boards: [
      {
        id: 'default',
        tiles: [{ id: 't0', col: 0, row: 0, size: SIZE_SMALL, active: 0, items: [{ id: 'a', type: WIDGET_TYPE }, { id: 'b', type: WIDGET_TYPE }] }],
      },
    ],
  };
  const parsed = engine.parse(raw);
  if (!parsed.ok) throw new Error('fixture stack should parse');
  return parsed.value;
}

describe('setActive', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const state = seedStack(engine);
    expect(engine.apply(state, { type: OpType.SetActive, board: boardId('nope'), tile: tileId('t0'), index: 1 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.SetActive, board: BOARD, tile: tileId('nope'), index: 1 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('rejects UnknownTarget for an index out of range', () => {
    const engine = makeEngine();
    const state = seedStack(engine);
    expect(engine.apply(state, { type: OpType.SetActive, board: BOARD, tile: tileId('t0'), index: -1 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(state, { type: OpType.SetActive, board: BOARD, tile: tileId('t0'), index: 2 })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('sets which stack member is active', () => {
    const engine = makeEngine();
    const result = engine.apply(seedStack(engine), { type: OpType.SetActive, board: BOARD, tile: tileId('t0'), index: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]?.active).toBe(1);
    expect(result.value.changes).toEqual([{ tile: tileId('t0'), board: BOARD, kind: ChangeKind.Activated }]);
  });
});
