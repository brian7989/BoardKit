import { describe, expect, it } from 'vitest';
import { defineBoards } from './defineBoards.js';

describe('defineBoards', () => {
  it('accepts a single grid and exposes it as the widest (only) breakpoint', () => {
    const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [] });
    expect(config.breakpoints).toHaveLength(1);
    expect(config.grid).toEqual({ cols: 4, rows: 4, cellAspect: 1 });
    expect(config.engine).toBe(config.breakpoints[0]?.engine);
  });

  it('accepts a breakpoint array and exposes the widest as the convenience engine/grid', () => {
    const config = defineBoards({
      grid: [
        { minWidth: 900, cols: 6, rows: 4 },
        { minWidth: 0, cols: 2, rows: 4 },
      ],
      widgets: [],
    });
    expect(config.breakpoints).toHaveLength(2);
    expect(config.grid).toEqual({ cols: 6, rows: 4, cellAspect: 1 });
  });

  it('throws when given an empty breakpoint list', () => {
    expect(() => defineBoards({ grid: [], widgets: [] })).toThrow(/at least one grid breakpoint/);
  });
});
