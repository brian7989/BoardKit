import { describe, expect, it } from 'vitest';
import { defineBoards } from './defineBoards.js';

describe('defineBoards', () => {
  it('accepts a single grid and exposes it as the widest (only) breakpoint', () => {
    const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [] });
    expect(config.breakpoints).toHaveLength(1);
    expect(config.grid).toMatchObject({ cols: 4, rows: 4, cellAspect: 1 });
    expect(config.engine).toBe(config.breakpoints[0]?.engine);
  });

  it('accepts named breakpoints and exposes the widest as the convenience engine/grid', () => {
    const config = defineBoards({
      breakpoints: {
        wide: { minWidth: 900, grid: '6x4' },
        narrow: { minWidth: 0, grid: '2x4' },
      },
      widgets: [],
    });
    expect(config.breakpoints).toHaveLength(2);
    expect(config.grid).toMatchObject({ cols: 6, rows: 4, cellAspect: 1 });
  });

  it('names each breakpoint, and the single grid "default"', () => {
    expect(defineBoards({ grid: '4x4', widgets: [] }).grid.name).toBe('default');
    const named = defineBoards({ breakpoints: { phone: { minWidth: 0, grid: '2x4' }, desktop: { minWidth: 900, grid: '6x4' } }, widgets: [] });
    expect(named.breakpoints.map((breakpoint) => breakpoint.name)).toEqual(['desktop', 'phone']);
  });

  it('throws when a single-grid field sits beside `breakpoints`', () => {
    expect(() => defineBoards({ breakpoints: { phone: { minWidth: 0, grid: '2x4' } }, layout: [], widgets: [] })).toThrow(/`layout` belongs inside a breakpoint/);
  });

  it('throws when given neither a grid nor breakpoints', () => {
    expect(() => defineBoards({ widgets: [] })).toThrow(/needs a `grid`/);
  });

  it('throws when given no breakpoints', () => {
    expect(() => defineBoards({ breakpoints: {}, widgets: [] })).toThrow(/at least one breakpoint/);
  });
});
