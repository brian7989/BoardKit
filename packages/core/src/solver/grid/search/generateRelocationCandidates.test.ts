import { describe, expect, it } from 'vitest';
import { generateRelocationCandidates } from './generateRelocationCandidates.js';
import { Direction } from '../cost/Direction.js';
import { cell } from '../../../shared/units/Cell.js';
import type { RelocationBoard } from './RelocationBoard.js';

interface MakeBoardInput {
  readonly blocked: readonly number[];
  readonly owner: readonly number[];
  readonly cols: number;
  readonly resolvedIndex?: number;
}

function makeBoard(input: MakeBoardInput): RelocationBoard {
  const resolved = new Uint8Array(2);
  if (input.resolvedIndex !== undefined) resolved[input.resolvedIndex] = 1;
  return {
    cols: input.cols,
    rows: input.blocked.length / input.cols,
    owner: Int32Array.from(input.owner),
    blocked: Uint8Array.from(input.blocked),
    resolved,
    placedRect: [null, null],
    queue: [],
    head: 0,
    tiles: [],
    tileIds: [],
    size: [],
    order: [],
  };
}

const SIZE = { w: cell(1), h: cell(1) };
const ORIGINAL = { x: cell(0), y: cell(0), w: cell(1), h: cell(1) };
const ORDER = [Direction.Down];

describe('generateRelocationCandidates', () => {
  it('skips a position blocked by pinned or already-placed cells', () => {
    const board = makeBoard({ blocked: [1, 0, 0, 0], owner: [0, 0, 0, 0], cols: 2 });
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: SIZE, original: ORIGINAL, order: ORDER });
    expect(candidates.map((candidate) => `${candidate.rect.x},${candidate.rect.y}`)).toEqual(['1,0', '0,1', '1,1']);
  });

  it('reports which unresolved original tiles a candidate would newly block', () => {
    const board = makeBoard({ blocked: [0, 0, 0, 0], owner: [0, 2, 0, 0], cols: 2 });
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: SIZE, original: ORIGINAL, order: ORDER });
    const atOneZero = candidates.find((candidate) => candidate.rect.x === 1 && candidate.rect.y === 0);
    expect(atOneZero?.newlyBlocked).toEqual([1]);
  });

  it('excludes the head tile itself and any tile already marked resolved', () => {
    const board = makeBoard({ blocked: [0, 0, 0, 0], owner: [1, 2, 0, 0], cols: 2, resolvedIndex: 1 });
    // headIndex 0 owns cell (0,0); tile at index 1 (cell (1,0)) is resolved, so neither counts.
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: SIZE, original: ORIGINAL, order: ORDER });
    expect(candidates.every((candidate) => candidate.newlyBlocked.length === 0)).toBe(true);
  });

  it('deduplicates a tile covered by more than one cell of a wide candidate', () => {
    const wide = { w: cell(2), h: cell(1) };
    const board = makeBoard({ blocked: [0, 0, 0, 0], owner: [2, 2, 0, 0], cols: 2 });
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: wide, original: ORIGINAL, order: ORDER });
    const atRowZero = candidates.find((candidate) => candidate.rect.y === 0);
    expect(atRowZero?.newlyBlocked).toEqual([1]);
  });

  it('bails out of a candidate as soon as any of its cells is blocked, even on a later row', () => {
    const tall = { w: cell(1), h: cell(2) };
    // A single 1x2 column: its only cell (row 0) is free, but row 1 is blocked.
    const board = makeBoard({ blocked: [0, 1], owner: [0, 0], cols: 1 });
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: tall, original: ORIGINAL, order: ORDER });
    expect(candidates).toEqual([]);
  });

  it('treats a read past the owner grid as free rather than throwing', () => {
    const board = makeBoard({ blocked: [0, 0], owner: [], cols: 1 });
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: SIZE, original: ORIGINAL, order: ORDER });
    expect(candidates.every((candidate) => candidate.newlyBlocked.length === 0)).toBe(true);
  });

  it('computes each candidate\'s move distance and direction rank from the original rect', () => {
    const board = makeBoard({ blocked: [0, 0, 0, 0], owner: [0, 0, 0, 0], cols: 2 });
    const candidates = generateRelocationCandidates({ board, headIndex: 0, size: SIZE, original: ORIGINAL, order: ORDER });
    const down = candidates.find((candidate) => candidate.rect.x === 0 && candidate.rect.y === 1);
    expect(down).toMatchObject({ distance: 1, rank: 0 });
  });
});
