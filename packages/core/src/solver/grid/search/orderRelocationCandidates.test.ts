import { describe, expect, it } from 'vitest';
import { orderRelocationCandidates } from './orderRelocationCandidates.js';
import { cell } from '../../../shared/units/Cell.js';
import type { RelocationCandidate } from './generateRelocationCandidates.js';

interface CandidateAtOptions {
  readonly distance: number;
  readonly rank: number;
  readonly newlyBlockedCount?: number;
}

function candidateAt(x: number, y: number, options: CandidateAtOptions): RelocationCandidate {
  return {
    rect: { x: cell(x), y: cell(y), w: cell(1), h: cell(1) },
    newlyBlocked: Array.from({ length: options.newlyBlockedCount ?? 0 }, (_unused, index) => index),
    distance: options.distance,
    rank: options.rank,
  };
}

describe('orderRelocationCandidates', () => {
  it('prefers fewer newly-blocked tiles over a shorter move', () => {
    const short = candidateAt(2, 3, { distance: 1, rank: 0, newlyBlockedCount: 2 });
    const long = candidateAt(2, 5, { distance: 3, rank: 0 });
    expect(orderRelocationCandidates([short, long])).toEqual([long, short]);
  });

  it('prefers a shorter move once newly-blocked counts tie', () => {
    const near = candidateAt(2, 3, { distance: 1, rank: 0 });
    const far = candidateAt(2, 4, { distance: 2, rank: 0 });
    expect(orderRelocationCandidates([far, near])).toEqual([near, far]);
  });

  it('breaks a distance tie by the preferred direction rank', () => {
    const down = candidateAt(2, 3, { distance: 1, rank: 0 });
    const right = candidateAt(3, 2, { distance: 1, rank: 1 });
    expect(orderRelocationCandidates([right, down])).toEqual([down, right]);
  });

  it('breaks a same-distance, same-rank tie by row before column', () => {
    const higher = candidateAt(3, 3, { distance: 2, rank: 0 });
    const lower = candidateAt(2, 4, { distance: 2, rank: 0 });
    expect(orderRelocationCandidates([lower, higher])).toEqual([higher, lower]);
  });

  it('breaks a same-distance, same-rank, same-row tie by column', () => {
    const left = candidateAt(1, 1, { distance: 2, rank: 2 });
    const right = candidateAt(3, 1, { distance: 2, rank: 2 });
    expect(orderRelocationCandidates([right, left])).toEqual([left, right]);
  });

  it('does not mutate the input array', () => {
    const a = candidateAt(2, 5, { distance: 3, rank: 0 });
    const b = candidateAt(2, 3, { distance: 1, rank: 0 });
    const input = [a, b];
    orderRelocationCandidates(input);
    expect(input).toEqual([a, b]);
  });
});
