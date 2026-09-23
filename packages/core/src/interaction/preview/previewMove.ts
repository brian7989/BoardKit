import { OpType } from '../../ops/OpType.js';
import type { Op } from '../../ops/Op.js';
import type { Applied } from '../../ops/outcome/Applied.js';
import type { Rejection } from '../../ops/outcome/Rejection.js';
import type { Result } from '../../shared/result/Result.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { StepContext } from '../StepContext.js';

export interface Preview {
  readonly op: Op;
  readonly result: Result<Applied, Rejection>;
}

// engine.apply is a pure read here: computing a preview never mutates ctx.state, so
// step() can call it freely while staying a pure function itself.
export function previewMove(ctx: StepContext, tile: TileId, target: Point<Cell>): Preview {
  const op: Op = { type: OpType.Move, board: ctx.board, tile, to: target };
  return { op, result: ctx.engine.apply(ctx.state, op) };
}
