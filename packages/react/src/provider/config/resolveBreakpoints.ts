import { createEngine, type EngineConfig } from 'boardkit-core';
import { catalogOf, type WidgetManifest } from '../../widget/index.js';
import { parseSizeInput } from '../../shared/size/parseSizeInput.js';
import type { BreakpointInput } from './BreakpointInput.js';
import type { DefineBoardsInput } from './DefineBoardsInput.js';
import type { GridInput } from './GridInput.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

const DEFAULT_CELL_ASPECT = 1;
const SINGLE_BREAKPOINT = 'default';

function gridOf(input: GridInput): { readonly cols: number; readonly rows: number } {
  if (typeof input !== 'string') return input;
  const size = parseSizeInput(input);
  return { cols: size.w, rows: size.h };
}

const SINGLE_GRID_FIELDS = ['grid', 'cellAspect', 'layout'] as const;

function breakpointsOf(input: DefineBoardsInput, breakpoints: NonNullable<DefineBoardsInput['breakpoints']>): ReadonlyArray<readonly [string, BreakpointInput]> {
  const stray = SINGLE_GRID_FIELDS.find((field) => input[field] !== undefined);
  if (stray) throw new Error(`defineBoards: \`${stray}\` belongs inside a breakpoint when \`breakpoints\` is given.`);
  return Object.entries(breakpoints);
}

// A single `grid` is just one breakpoint that always applies.
function specsOf(input: DefineBoardsInput): ReadonlyArray<readonly [string, BreakpointInput]> {
  if (input.breakpoints) return breakpointsOf(input, input.breakpoints);
  const { grid, cellAspect, layout } = input;
  if (!grid) throw new Error('defineBoards needs a `grid`, or named `breakpoints`.');
  return [[SINGLE_BREAKPOINT, { minWidth: 0, grid, ...(cellAspect !== undefined ? { cellAspect } : {}), ...(layout ? { layout } : {}) }]];
}

interface ToBreakpointInput {
  readonly name: string;
  readonly spec: BreakpointInput;
  readonly widgets: readonly WidgetManifest[];
  readonly solver: EngineConfig['solver'] | undefined;
}

function toBreakpoint({ name, spec, widgets, solver }: ToBreakpointInput): ResolvedBreakpoint {
  const { cols, rows } = gridOf(spec.grid);
  const cellAspect = spec.cellAspect ?? DEFAULT_CELL_ASPECT;
  const engine = createEngine({ grid: { cols, rows, cellAspect }, catalog: catalogOf(widgets), ...(solver ? { solver } : {}) });
  const layout = spec.layout ? { layout: spec.layout } : {};
  return { name, minWidth: spec.minWidth, grid: { name, cols, rows, cellAspect }, engine, ...layout, hide: spec.hide ?? [] };
}

/** One engine per breakpoint, all sharing the same widget catalog; widest first. */
export function resolveBreakpoints(input: DefineBoardsInput): readonly ResolvedBreakpoint[] {
  return specsOf(input)
    .map(([name, spec]) => toBreakpoint({ name, spec, widgets: input.widgets, solver: input.solver }))
    .sort((a, b) => b.minWidth - a.minWidth);
}
