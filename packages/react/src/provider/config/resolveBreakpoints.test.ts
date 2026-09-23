import { describe, expect, it } from 'vitest';
import { resolveBreakpoints } from './resolveBreakpoints.js';

describe('resolveBreakpoints', () => {
  it('wraps a plain grid as a single always-applying breakpoint', () => {
    const breakpoints = resolveBreakpoints({ grid: { cols: 3, rows: 3 }, widgets: [] });
    expect(breakpoints).toHaveLength(1);
    expect(breakpoints[0]).toMatchObject({ minWidth: 0, grid: { cols: 3, rows: 3, cellAspect: 1 } });
  });

  it('defaults cellAspect per breakpoint when not given', () => {
    const breakpoints = resolveBreakpoints({ grid: [{ minWidth: 0, cols: 2, rows: 2, cellAspect: 1.5 }], widgets: [] });
    expect(breakpoints[0]?.grid.cellAspect).toBe(1.5);
  });

  it('sorts breakpoints widest first regardless of input order', () => {
    const breakpoints = resolveBreakpoints({
      grid: [
        { minWidth: 0, cols: 2, rows: 4 },
        { minWidth: 900, cols: 6, rows: 4 },
        { minWidth: 480, cols: 4, rows: 5 },
      ],
      widgets: [],
    });
    expect(breakpoints.map((bp) => bp.minWidth)).toEqual([900, 480, 0]);
  });

  it('gives every breakpoint its own engine sharing the same catalog', () => {
    const widgets = [{ type: 'w', title: 'W', sizes: [{ w: 1, h: 1 }], component: () => null }];
    const breakpoints = resolveBreakpoints({
      grid: [
        { minWidth: 900, cols: 6, rows: 4 },
        { minWidth: 0, cols: 2, rows: 4 },
      ],
      widgets,
    });
    expect(breakpoints[0]?.engine).not.toBe(breakpoints[1]?.engine);
    expect(breakpoints[0]?.engine.check(breakpoints[0].engine.empty())).toEqual([]);
  });
});
