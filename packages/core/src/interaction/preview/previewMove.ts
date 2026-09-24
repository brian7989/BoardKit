import { OpType } from '../../ops/OpType.js';
import type { Op } from '../../ops/Op.js';
import type { Applied } from '../../ops/outcome/Applied.js';
import type { Rejection } from '../../ops/outcome/Rejection.js';
import type { Result } from '../../shared/result/Result.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { TileId } from '../../shared/ids/TileId.js';
import { findTile, isFloating } from '../../model/index.js';
import type { StepContext } from '../StepContext.js';

export interface Preview {
  readonly op: Op;
  readonly result: Result<Applied, Rejection>;
}

// A floating tile being dragged here is a snapped Overlay tile; Free tiles never enter the machine.
function moveOpFor(ctx: StepContext, tile: TileId, target: Point<Cell>): Op {
  const found = findTile(ctx.state, ctx.board, tile);
  if (found && isFloating(found)) return { type: OpType.MoveFloating, board: ctx.board, tile, to: target };
  return { type: OpType.Move, board: ctx.board, tile, to: target };
}

// engine.apply is a pure read here: computing a preview never mutates ctx.state, so
// step() can call it freely while staying a pure function itself.
export function previewMove(ctx: StepContext, tile: TileId, target: Point<Cell>): Preview {
  const op = moveOpFor(ctx, tile, target);
  return { op, result: ctx.engine.apply(ctx.state, op) };
}
