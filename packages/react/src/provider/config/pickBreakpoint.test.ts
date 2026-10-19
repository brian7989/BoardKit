import { describe, expect, it } from 'vitest';
import { pickBreakpoint } from './pickBreakpoint.js';
import { resolveBreakpoints } from './resolveBreakpoints.js';

const BREAKPOINTS = resolveBreakpoints({
  breakpoints: {
    wide: { minWidth: 900, grid: '6x4' },
    mid: { minWidth: 480, grid: '4x5' },
    narrow: { minWidth: 0, grid: '2x4' },
  },
  widgets: [],
});

describe('pickBreakpoint', () => {
  it('picks the tightest-fitting breakpoint at or below the width', () => {
    expect(pickBreakpoint(BREAKPOINTS, 1200).grid).toMatchObject({ cols: 6, rows: 4, cellAspect: 1 });
    expect(pickBreakpoint(BREAKPOINTS, 900).grid).toMatchObject({ cols: 6, rows: 4, cellAspect: 1 });
    expect(pickBreakpoint(BREAKPOINTS, 600).grid).toMatchObject({ cols: 4, rows: 5, cellAspect: 1 });
    expect(pickBreakpoint(BREAKPOINTS, 320).grid).toMatchObject({ cols: 2, rows: 4, cellAspect: 1 });
  });

  it('falls back to the least demanding breakpoint when the width clears none of them', () => {
    const noZero = resolveBreakpoints({ breakpoints: { only: { minWidth: 480, grid: '4x5' } }, widgets: [] });
    expect(pickBreakpoint(noZero, 100).grid).toMatchObject({ cols: 4, rows: 5, cellAspect: 1 });
  });

  it('is stable for a single breakpoint regardless of width', () => {
    const single = resolveBreakpoints({ grid: { cols: 3, rows: 3 }, widgets: [] });
    expect(pickBreakpoint(single, 0).grid).toMatchObject({ cols: 3, rows: 3, cellAspect: 1 });
    expect(pickBreakpoint(single, 5000).grid).toMatchObject({ cols: 3, rows: 3, cellAspect: 1 });
  });
});
