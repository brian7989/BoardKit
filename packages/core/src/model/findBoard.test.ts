import { describe, expect, it } from 'vitest';
import { findBoard } from './findBoard.js';
import { markValid } from './BoardsState.js';
import { boardId } from '../shared/ids/BoardId.js';

function makeState() {
  const board = { id: boardId('b0'), tiles: [] };
  return { state: markValid({ grid: { cols: 1, rows: 1 }, boards: [board] }), board };
}

describe('findBoard', () => {
  it('returns the board with a matching id', () => {
    const { state, board } = makeState();
    expect(findBoard(state, boardId('b0'))).toBe(board);
  });

  it('returns undefined when no board matches', () => {
    const { state } = makeState();
    expect(findBoard(state, boardId('missing'))).toBeUndefined();
  });
});
