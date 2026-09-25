import { createEngine, type EngineConfig } from 'boardkit-core';
import { catalogOf, type WidgetManifest } from '../../widget/index.js';
import type { GridBreakpoint } from './GridBreakpoint.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

const DEFAULT_CELL_ASPECT = 1;

export interface SingleGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cellAspect?: number;
}

export interface ResolveBreakpointsInput {
  readonly grid: SingleGrid | readonly GridBreakpoint[];
  readonly widgets: readonly WidgetManifest[];
  readonly solver?: EngineConfig['solver'];
}

function isBreakpointList(grid: SingleGrid | readonly GridBreakpoint[]): grid is readonly GridBreakpoint[] {
  return Array.isArray(grid);
}

// A plain `{cols,rows}` grid is just a single breakpoint that always applies.
function toSpecs(grid: SingleGrid | readonly GridBreakpoint[]): readonly GridBreakpoint[] {
  if (isBreakpointList(grid)) return grid;
  return [{ minWidth: 0, cols: grid.cols, rows: grid.rows, ...(grid.cellAspect !== undefined ? { cellAspect: grid.cellAspect } : {}) }];
}

function toBreakpoint(spec: GridBreakpoint, input: ResolveBreakpointsInput): ResolvedBreakpoint {
  const grid = { cols: spec.cols, rows: spec.rows, cellAspect: spec.cellAspect ?? DEFAULT_CELL_ASPECT };
  const engine = createEngine({ grid, catalog: catalogOf(input.widgets), ...(input.solver ? { solver: input.solver } : {}) });
  return { minWidth: spec.minWidth, grid, engine, ...(spec.initialLayout ? { initialLayout: spec.initialLayout } : {}) };
}

// One engine per breakpoint, all sharing the same widget catalog; widest first.
export function resolveBreakpoints(input: ResolveBreakpointsInput): readonly ResolvedBreakpoint[] {
  return toSpecs(input.grid)
    .map((spec) => toBreakpoint(spec, input))
    .sort((a, b) => b.minWidth - a.minWidth);
}
