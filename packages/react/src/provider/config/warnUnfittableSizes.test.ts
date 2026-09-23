import { afterEach, describe, expect, it, vi } from 'vitest';
import { cell, createEngine } from 'boardkit-core';
import { warnUnfittableSizes } from './warnUnfittableSizes.js';
import type { WidgetManifest } from '../../widget/index.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

function breakpoint(cols: number, rows: number): ResolvedBreakpoint {
  const grid = { cols, rows, cellAspect: 1 };
  return { minWidth: 0, grid, engine: createEngine({ grid, catalog: {} }) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('warnUnfittableSizes', () => {
  it('warns when a widget has no size that fits a breakpoint', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const widget: WidgetManifest = { type: 'huge', title: 'Huge', sizes: [{ w: cell(6), h: cell(6) }], component: () => null };
    warnUnfittableSizes([widget], [breakpoint(4, 4)]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toMatch(/huge/);
  });

  it('says nothing when a widget fits', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const widget: WidgetManifest = { type: 'small', title: 'Small', sizes: [{ w: cell(1), h: cell(1) }], component: () => null };
    warnUnfittableSizes([widget], [breakpoint(4, 4)]);
    expect(spy).not.toHaveBeenCalled();
  });
});
