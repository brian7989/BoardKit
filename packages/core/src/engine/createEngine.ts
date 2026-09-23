import { STATE_VERSION, type BoardsState, type SerializedState } from '../model/index.js';
import { parseState } from '../parse/index.js';
import { repairState } from '../repair/index.js';
import { validateState } from '../validate/index.js';
import { applyOp } from '../ops/index.js';
import { SolverDefaults } from '../solver/index.js';
import { reflow } from '../reflow/index.js';
import type { EngineConfig } from './EngineConfig.js';
import type { EngineContext } from './EngineContext.js';
import type { Engine } from './Engine.js';
import { findFreeSpace } from './findFreeSpace.js';

const DEFAULT_CELL_ASPECT = 1;

// The engine holds no state; all methods bind to a resolved context.
export function createEngine(config: EngineConfig): Engine {
  const ctx = toContext(config);
  return {
    parse: (input) => parseState(input, ctx),
    serialize: (state) => state,
    apply: (state, op) => applyOp(ctx, state, op),
    check: (state) => validateState(state, ctx),
    repair: (input) => repairState(input, ctx),
    empty: () => makeEmpty(ctx),
    findFree: (state, board, size) => findFreeSpace({ state, board, size, ctx }),
    reflow: (state) => reflow(state, ctx),
  };
}

function toContext(config: EngineConfig): EngineContext {
  return {
    grid: { cols: config.grid.cols, rows: config.grid.rows, cellAspect: config.grid.cellAspect ?? DEFAULT_CELL_ASPECT },
    catalog: config.catalog,
    solver: {
      maxNodes: config.solver?.maxNodes ?? SolverDefaults.maxNodes,
      directions: config.solver?.directions ?? SolverDefaults.directions,
      nudgeOnResize: config.solver?.nudgeOnResize ?? SolverDefaults.nudgeOnResize,
    },
  };
}

function makeEmpty(ctx: EngineContext): BoardsState {
  const input = { version: STATE_VERSION, grid: { cols: ctx.grid.cols, rows: ctx.grid.rows }, boards: [{ id: 'default', tiles: [] }] };
  const result = parseState(input, ctx);
  if (!result.ok) throw new Error('Failed to construct the empty state; the default config should always be valid.');
  return result.value;
}
