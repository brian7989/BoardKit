import { validateState } from '../validate/index.js';
import { markValid, type BoardsState } from '../model/index.js';
import { ok, type Result } from '../shared/index.js';
import type { EngineContext } from '../engine/index.js';
import type { Applied } from './outcome/Applied.js';
import type { Rejection } from './outcome/Rejection.js';
import type { Placement } from './OpHandler.js';

// The gate's other half: re-runs the same checks every other entry point uses. A handler that
// produced an invalid candidate is a bug in that handler, not a user-facing rejection.
export function validateOutcome(ctx: EngineContext, state: BoardsState, placement: Placement): Result<Applied, Rejection> {
  // No handler touches `layouts` (other breakpoints' saved positions); it always just carries over.
  const candidate = { ...placement.candidate, layouts: state.layouts };
  const issues = validateState(candidate, ctx);
  if (issues.length > 0) {
    throw new Error(`Op handler produced an invalid state: ${issues.map((issue) => issue.message).join('; ')}`);
  }
  return ok({ state: markValid(candidate), changes: placement.changes });
}
