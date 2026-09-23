import { IssueKind, type Issue } from '../issues/index.js';
import type { ValidCandidate } from '../model/index.js';
import type { EngineContext } from '../engine/index.js';

export function checkGridMatches(state: ValidCandidate, ctx: EngineContext): readonly Issue[] {
  if (state.grid.cols === ctx.grid.cols && state.grid.rows === ctx.grid.rows) return [];
  return [{ kind: IssueKind.GridMismatch, message: `State grid ${state.grid.cols}x${state.grid.rows} does not match the engine's ${ctx.grid.cols}x${ctx.grid.rows}.` }];
}
