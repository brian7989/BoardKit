import { describe, expect, it } from 'vitest';
import { createEngine, boardId, OpType, RejectReason, ChangeKind, type Engine } from '../../index.js';

function makeEngine(): Engine {
  return createEngine({ grid: { cols: 4, rows: 4 }, catalog: {} });
}

describe('removeBoard', () => {
  it('rejects UnknownTarget for a board that does not exist', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), { type: OpType.RemoveBoard, board: boardId('nope') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('rejects LastBoard when it is the only board', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), { type: OpType.RemoveBoard, board: boardId('default') });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.LastBoard } });
  });

  it('removes a board that is not the last one', () => {
    const engine = makeEngine();
    const added = engine.apply(engine.empty(), { type: OpType.AddBoard, board: boardId('second') });
    if (!added.ok) throw new Error('fixture addBoard should succeed');

    const result = engine.apply(added.value.state, { type: OpType.RemoveBoard, board: boardId('second') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards.map((board) => board.id)).toEqual([boardId('default')]);
    expect(result.value.changes).toEqual([{ board: boardId('second'), kind: ChangeKind.BoardRemoved }]);
  });
});
