import type { EngineContext } from '../engine/index.js';
import type { BoardsState, ValidCandidate } from '../model/index.js';
import type { Result } from '../shared/index.js';
import type { Op } from './Op.js';
import type { Change } from './outcome/Change.js';
import type { Rejection } from './outcome/Rejection.js';

// A handler produces an unbranded candidate, not yet a BoardsState: only validateOutcome may
// brand one, after confirming it. This is the pre-validation counterpart of Applied.
export interface Placement {
  readonly candidate: ValidCandidate;
  readonly changes: readonly Change[];
}

export type OpOutcome = Result<Placement, Rejection>;
export type OpHandlerArgs = [ctx: EngineContext, state: BoardsState];
export type OpHandler<T extends Op = Op> = (op: T, ctx: EngineContext, state: BoardsState) => OpOutcome;
