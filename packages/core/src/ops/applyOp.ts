import { dispatchByType } from '../shared/unions/dispatchByType.js';
import type { BoardsState } from '../model/index.js';
import type { EngineContext } from '../engine/index.js';
import type { Result } from '../shared/index.js';
import { opHandlers } from './opHandlers.js';
import { validateOutcome } from './validateOutcome.js';
import type { Op } from './Op.js';
import type { OpHandlerArgs, OpOutcome } from './OpHandler.js';
import type { Applied } from './outcome/Applied.js';
import type { Rejection } from './outcome/Rejection.js';

// The single gate: every geometry change passes through here, and every result
// is either a complete new state or a rejection, never a partial one.
export function applyOp(ctx: EngineContext, state: BoardsState, op: Op): Result<Applied, Rejection> {
  const outcome = dispatchByType<Op, OpHandlerArgs, OpOutcome>(opHandlers, op, ctx, state);
  return outcome.ok ? validateOutcome(ctx, state, outcome.value) : outcome;
}
