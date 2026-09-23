import { describe, expect, it } from 'vitest';
import { relocationSnapshot } from './relocationSnapshot.js';
import { tileId } from '../../../shared/ids/TileId.js';
import { cell } from '../../../shared/units/Cell.js';
import type { RelocationState } from './RelocationState.js';
import type { RelocationBoard } from './RelocationBoard.js';

function makeBoard(placedRect: RelocationBoard['placedRect'], tileIds: readonly string[]): RelocationBoard {
  return {
    cols: 0,
    rows: 0,
    owner: new Int32Array(0),
    blocked: new Uint8Array(0),
    resolved: new Uint8Array(0),
    placedRect,
    queue: [],
    head: 0,
    tiles: [],
    tileIds: tileIds.map((id) => tileId(id)),
    size: [],
    order: [],
  };
}

function makeState(board: RelocationBoard): RelocationState {
  return { board, remaining: 0, tilesMoved: 0, totalDistance: 0, directionPenalty: 0 };
}

describe('relocationSnapshot', () => {
  it('collects every placed rect, keyed by tile id', () => {
    const rectA = { x: cell(0), y: cell(0), w: cell(1), h: cell(1) };
    const rectB = { x: cell(1), y: cell(1), w: cell(1), h: cell(1) };
    const board = makeBoard([rectA, rectB], ['a', 'b']);

    const snapshot = relocationSnapshot(makeState(board));

    expect(snapshot.placed).toEqual(new Map([[tileId('a'), rectA], [tileId('b'), rectB]]));
  });

  it('skips tiles that have not been placed yet', () => {
    const rectA = { x: cell(0), y: cell(0), w: cell(1), h: cell(1) };
    const board = makeBoard([rectA, null], ['a', 'b']);

    const snapshot = relocationSnapshot(makeState(board));

    expect(snapshot.placed).toEqual(new Map([[tileId('a'), rectA]]));
  });

  it('does not mutate the state it is given', () => {
    const board = makeBoard([null], ['a']);
    const state = makeState(board);

    relocationSnapshot(state);

    expect(state.placed).toBeUndefined();
  });
});
