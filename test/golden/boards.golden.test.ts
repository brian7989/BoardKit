import { describe, expect, it } from 'vitest';
import { boardId, OpType, RejectReason, type AddBoardOp, type RemoveBoardOp } from '../../packages/core/src/index.ts';
import { DEFAULT_BOARD, makeTestEngine, rawState } from '../property/fixtures.ts';

describe('addBoard / removeBoard (golden fixtures)', () => {
  it('adds a new, empty board alongside the existing one', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: AddBoardOp = { type: OpType.AddBoard, board: boardId('second') };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards.map((board) => board.id)).toEqual([DEFAULT_BOARD, 'second']);
    expect(result.value.state.boards[1]).toMatchObject({ tiles: [] });
    expect(result.value.changes).toEqual([{ board: 'second', kind: 'board-added' }]);
  });

  it('removes a board that is not the last one', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const added = engine.apply(parsed.value, { type: OpType.AddBoard, board: boardId('second') });
    if (!added.ok) throw new Error('fixture addBoard should succeed');

    const op: RemoveBoardOp = { type: OpType.RemoveBoard, board: boardId('second') };
    const result = engine.apply(added.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards.map((board) => board.id)).toEqual([DEFAULT_BOARD]);
    expect(result.value.changes).toEqual([{ board: 'second', kind: 'board-removed' }]);
  });

  it('rejects removing the last remaining board', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RemoveBoardOp = { type: OpType.RemoveBoard, board: DEFAULT_BOARD };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.LastBoard } });
  });

  it('rejects removing an unknown board', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RemoveBoardOp = { type: OpType.RemoveBoard, board: boardId('does-not-exist') };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });
});
