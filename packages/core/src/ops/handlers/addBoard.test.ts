import { describe, expect, it } from 'vitest';
import { createEngine, boardId, OpType, ChangeKind, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: {} });
}

describe('addBoard', () => {
  it('adds a new, empty board', () => {
    const engine = makeEngine();
    const result = engine.apply(engine.empty(), { type: OpType.AddBoard, board: boardId('second') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards.map((board) => board.id)).toEqual([boardId('default'), boardId('second')]);
    expect(result.value.changes).toEqual([{ board: boardId('second'), kind: ChangeKind.BoardAdded }]);
  });

  // Documents current behavior: a duplicate id is a caller bug, not a RejectReason, and
  // surfaces as validateOutcome's defensive throw rather than a Result.
  it('throws rather than silently duplicating when the board id already exists', () => {
    const engine = makeEngine();
    expect(() => engine.apply(engine.empty(), { type: OpType.AddBoard, board: boardId('default') })).toThrow(
      /Op handler produced an invalid state/,
    );
  });
});
