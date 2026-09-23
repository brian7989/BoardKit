import type { Direction } from './cost/Direction.js';

export interface SolverOptions {
  readonly maxNodes: number;
  readonly directions: readonly Direction[];
  readonly nudgeOnResize: boolean;
}
