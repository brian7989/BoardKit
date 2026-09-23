import { describe, expect, it } from 'vitest';
import { toRelocation } from './toRelocation.js';
import { SearchStatus } from '../search/SearchStatus.js';
import { tileId } from '../../shared/ids/TileId.js';
import { cell } from '../../shared/units/Cell.js';
import type { RelocationState } from './search/RelocationState.js';
import type { RelocationBoard } from './search/RelocationBoard.js';

const DISPLACED = [tileId('a')];

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

function makeState(placed?: ReadonlyMap<ReturnType<typeof tileId>, { x: number; y: number; w: number; h: number }>): RelocationState {
  return {
    board: EMPTY_BOARD,
    remaining: 0,
    tilesMoved: 1,
    totalDistance: 1,
    directionPenalty: 0,
    ...(placed ? { placed } : {}),
  };
}

describe('toRelocation', () => {
  it('turns a Solved outcome into the solution placements', () => {
    const placed = new Map([[tileId('a'), { x: cell(1), y: cell(1), w: cell(1), h: cell(1) }]]);
    const solution = makeState(placed);
    expect(toRelocation({ status: SearchStatus.Solved, solution }, DISPLACED)).toEqual({ ok: true, value: placed });
  });

  it('falls back to an empty map when a solved solution carries no snapshot', () => {
    const solution = makeState();
    expect(toRelocation({ status: SearchStatus.Solved, solution }, DISPLACED)).toEqual({ ok: true, value: new Map() });
  });

  it('turns a None outcome into a rejection naming the initially displaced tiles', () => {
    expect(toRelocation({ status: SearchStatus.None }, DISPLACED)).toEqual({ ok: false, error: { blockedBy: DISPLACED } });
  });

  it('turns a BudgetExhausted outcome into the same shape of rejection as None', () => {
    expect(toRelocation({ status: SearchStatus.BudgetExhausted }, DISPLACED)).toEqual({ ok: false, error: { blockedBy: DISPLACED } });
  });
});
