import { Direction } from './cost/Direction.js';
import type { SolverOptions } from './SolverOptions.js';

const DEFAULT_MAX_NODES = 20_000;

export const SolverDefaults: SolverOptions = {
  maxNodes: DEFAULT_MAX_NODES,
  directions: [Direction.Down, Direction.Right, Direction.Up, Direction.Left],
  nudgeOnResize: true,
};
