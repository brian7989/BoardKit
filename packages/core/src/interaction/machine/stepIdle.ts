import type { InteractionEvent } from '../events/InteractionEvent.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import { px } from '../../shared/units/Px.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Px } from '../../shared/units/Px.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { StepContext } from '../StepContext.js';
import type { StepResult } from './StepResult.js';
import { cellOriginOf, findTile } from '../../model/index.js';
import { noEffect } from './noEffect.js';

type GrabEvent = Extract<InteractionEvent, { type: typeof InteractionEventType.Grab }>;

function grabOffsetOf(ctx: StepContext, at: Point<Px>, tileOrigin: Point<Cell>): Point<Px> {
  const cellW = ctx.boardRectPx.w / ctx.state.grid.cols;
  const cellH = ctx.boardRectPx.h / ctx.state.grid.rows;
  return {
    x: px(at.x - (ctx.boardRectPx.x + tileOrigin.x * cellW)),
    y: px(at.y - (ctx.boardRectPx.y + tileOrigin.y * cellH)),
  };
}

function stepGrab(ctx: StepContext, event: GrabEvent): StepResult {
  const tile = findTile(ctx.state, ctx.board, event.tile);
  if (!tile) return noEffect({ phase: InteractionPhase.Idle });

  return {
    state: {
      phase: InteractionPhase.Armed,
      tile: event.tile,
      origin: event.at,
      grabOffset: grabOffsetOf(ctx, event.at, cellOriginOf(tile)),
    },
    effects: [],
  };
}

// Idle only reacts to a Grab (pointer down on a tile); everything else is ignored.
export function stepIdle(ctx: StepContext, event: InteractionEvent): StepResult {
  if (event.type === InteractionEventType.Grab) return stepGrab(ctx, event);
  return noEffect({ phase: InteractionPhase.Idle });
}
