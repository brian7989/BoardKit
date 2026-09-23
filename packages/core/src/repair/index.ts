// Opt-in recovery for saved state that no longer validates: relocate what fits, drop what
// cannot, report both. Never called implicitly by parse.
export { repairState } from './repairState.js';
export type { Repaired } from './Repaired.js';
