import { describe, expect, it } from 'vitest';
import { relocationCostOf, TILES_MOVED_WEIGHT, DISTANCE_WEIGHT } from './relocationCostOf.js';
import type { RelocationState } from './RelocationState.js';
import type { RelocationBoard } from './RelocationBoard.js';

const EMPTY_BOARD: RelocationBoard = {
  cols: 0,
  rows: 0,
  owner: new Int32Array(0),
  blocked: new Uint8Array(0),
  resolved: new Uint8Array(0),
  placedRect: [],
  queue: [],
  head: 0,
  tiles: [],
  tileIds: [],
  size: [],
  order: [],
};

function makeState(tilesMoved: number, totalDistance: number, directionPenalty: number): RelocationState {
  return { board: EMPTY_BOARD, remaining: 0, tilesMoved, totalDistance, directionPenalty };
}

describe('relocationCostOf', () => {
  it('weighs tiles moved above total distance above direction penalty', () => {
    expect(relocationCostOf(makeState(1, 2, 3))).toBe(1 * TILES_MOVED_WEIGHT + 2 * DISTANCE_WEIGHT + 3);
  });

  it('is zero for the initial state', () => {
    expect(relocationCostOf(makeState(0, 0, 0))).toBe(0);
  });
});
