import { describe, expect, it } from 'vitest';
import { relocationChildren } from './relocationChildren.js';
import { buildRelocationBoard } from './buildRelocationBoard.js';
import { Direction } from '../cost/Direction.js';
import { tileId } from '../../../shared/ids/TileId.js';
import { cell } from '../../../shared/units/Cell.js';
import type { Tile } from '../../../model/Tile.js';
import type { RelocationState } from './RelocationState.js';

const ORDER = [Direction.Down, Direction.Right, Direction.Up, Direction.Left];

function makeTile(id: string, col: number, row: number): Tile {
  return { id: tileId(id), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [], active: 0 };
}

interface InitialStateInput {
  readonly tiles: readonly Tile[];
  readonly displaced: readonly string[];
  readonly grid: { readonly cols: number; readonly rows: number };
}

function initialState(input: InitialStateInput): RelocationState {
  const board = buildRelocationBoard({
    tiles: input.tiles,
    pinnedTileId: tileId('pinned'),
    pinnedRect: { x: cell(0), y: cell(0), w: cell(1), h: cell(1) },
    grid: input.grid,
    sizeOf: (tile) => tile.size,
    displaced: input.displaced.map((id) => tileId(id)),
    order: ORDER,
  });
  return { board, remaining: board.queue.length, tilesMoved: 0, totalDistance: 0, directionPenalty: 0 };
}

describe('relocationChildren', () => {
  it('yields no moves once the queue is empty', () => {
    const state = initialState({ tiles: [], displaced: [], grid: { cols: 2, rows: 2 } });
    expect(Array.from(relocationChildren(state))).toEqual([]);
  });

  it('orders moves the same way orderRelocationCandidates would, cheapest first', () => {
    const state = initialState({ tiles: [makeTile('a', 0, 0)], displaced: ['a'], grid: { cols: 4, rows: 4 } });
    const [first] = relocationChildren(state);
    expect(first?.enter().board.placedRect[0]).toEqual({ x: cell(0), y: cell(1), w: cell(1), h: cell(1) });
  });

  it('enter() mutates the shared board and exit() fully undoes it', () => {
    const state = initialState({ tiles: [makeTile('a', 0, 0)], displaced: ['a'], grid: { cols: 4, rows: 4 } });
    const board = state.board;
    const blockedBefore = Array.from(board.blocked);
    const queueBefore = [...board.queue];
    const headBefore = board.head;

    const [move] = relocationChildren(state);
    if (!move) throw new Error('expected at least one move');
    move.enter();
    expect(board.head).toBe(headBefore + 1);
    expect(board.placedRect[0]).not.toBeNull();

    move.exit();
    expect(Array.from(board.blocked)).toEqual(blockedBefore);
    expect(board.queue).toEqual(queueBefore);
    expect(board.head).toBe(headBefore);
    expect(board.placedRect[0]).toBeNull();
  });

  it('advances remaining and cost by exactly one placement', () => {
    const state = initialState({ tiles: [makeTile('a', 0, 0)], displaced: ['a'], grid: { cols: 4, rows: 4 } });
    const [move] = relocationChildren(state);
    if (!move) throw new Error('expected at least one move');
    const child = move.enter();

    expect(child.remaining).toBe(0);
    expect(child.tilesMoved).toBe(1);
    move.exit();
  });

  it('queues every tile a placement newly covers', () => {
    // Pinning at (0,0) displaces `a`; `a`'s only free-enough spot below also covers `b`.
    const state = initialState({ tiles: [makeTile('a', 0, 0), makeTile('b', 0, 1)], displaced: ['a'], grid: { cols: 1, rows: 2 } });
    const [move] = relocationChildren(state);
    if (!move) throw new Error('expected at least one move');
    const child = move.enter();

    expect(child.remaining).toBe(1);
    expect(state.board.queue).toContain(1);
    move.exit();
  });
});
