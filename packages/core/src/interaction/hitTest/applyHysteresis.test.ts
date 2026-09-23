import { describe, expect, it } from 'vitest';
import { applyHysteresis } from './applyHysteresis.js';

const THRESHOLD = 0.3;

describe('applyHysteresis', () => {
  it('stays put for raw positions that round back to the same cell', () => {
    expect(applyHysteresis(2, 2.2, THRESHOLD)).toBe(2);
    expect(applyHysteresis(2, 1.8, THRESHOLD)).toBe(2);
  });

  it('does not switch forward until past the boundary plus the threshold', () => {
    expect(applyHysteresis(2, 2.79, THRESHOLD)).toBe(2);
    expect(applyHysteresis(2, 2.81, THRESHOLD)).toBe(3);
  });

  it('does not switch backward until past the boundary minus the threshold', () => {
    expect(applyHysteresis(2, 1.21, THRESHOLD)).toBe(2);
    expect(applyHysteresis(2, 1.19, THRESHOLD)).toBe(1);
  });

  it('snaps directly on a jump of more than one cell', () => {
    expect(applyHysteresis(0, 5.4, THRESHOLD)).toBe(5);
    expect(applyHysteresis(5, -3.2, THRESHOLD)).toBe(-3);
  });
});
