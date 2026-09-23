import { describe, expect, it } from 'vitest';
import { pickBreakpoint } from './pickBreakpoint.js';
import { resolveBreakpoints } from './resolveBreakpoints.js';

const BREAKPOINTS = resolveBreakpoints({
  grid: [
    { minWidth: 900, cols: 6, rows: 4 },
    { minWidth: 480, cols: 4, rows: 5 },
    { minWidth: 0, cols: 2, rows: 4 },
  ],
  widgets: [],
});

describe('pickBreakpoint', () => {
  it('picks the tightest-fitting breakpoint at or below the width', () => {
    expect(pickBreakpoint(BREAKPOINTS, 1200).grid).toEqual({ cols: 6, rows: 4, cellAspect: 1 });
    expect(pickBreakpoint(BREAKPOINTS, 900).grid).toEqual({ cols: 6, rows: 4, cellAspect: 1 });
    expect(pickBreakpoint(BREAKPOINTS, 600).grid).toEqual({ cols: 4, rows: 5, cellAspect: 1 });
    expect(pickBreakpoint(BREAKPOINTS, 320).grid).toEqual({ cols: 2, rows: 4, cellAspect: 1 });
  });

  it('falls back to the least demanding breakpoint when the width clears none of them', () => {
    const noZero = resolveBreakpoints({ grid: [{ minWidth: 480, cols: 4, rows: 5 }], widgets: [] });
    expect(pickBreakpoint(noZero, 100).grid).toEqual({ cols: 4, rows: 5, cellAspect: 1 });
  });

  it('is stable for a single breakpoint regardless of width', () => {
    const single = resolveBreakpoints({ grid: { cols: 3, rows: 3 }, widgets: [] });
    expect(pickBreakpoint(single, 0).grid).toEqual({ cols: 3, rows: 3, cellAspect: 1 });
    expect(pickBreakpoint(single, 5000).grid).toEqual({ cols: 3, rows: 3, cellAspect: 1 });
  });
});
