// Generic bounded search: knows nothing about grids, tiles, or boards. The grid-specific
// problem lives in solver/grid/.
export { SearchStatus } from './SearchStatus.js';
export type { SearchOutcome } from './SearchOutcome.js';
export type { SearchProblem } from './SearchProblem.js';
export type { TraceFn } from './TraceFn.js';
export { branchAndBound } from './branchAndBound.js';
