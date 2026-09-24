import { AnnouncementKey } from '../events/AnnouncementKey.js';
import { EffectType } from '../events/EffectType.js';
import type { InteractionEvent } from '../events/InteractionEvent.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import type { ArmedInteractionState } from '../state/InteractionState.js';
import { crossedDragThreshold } from '../hitTest/crossedDragThreshold.js';
import { targetFromPointer } from '../hitTest/targetFromPointer.js';
import { previewMove } from '../preview/previewMove.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Px } from '../../shared/units/Px.js';
import type { StepContext } from '../StepContext.js';
import type { StepResult } from './StepResult.js';
import { cellOriginOf, findTile } from '../../model/index.js';
import { noEffect } from './noEffect.js';
import { cancelInteraction } from './cancelInteraction.js';

function stepMove(ctx: StepContext, state: ArmedInteractionState, at: Point<Px>): StepResult {
  if (!crossedDragThreshold(state.origin, at, ctx.options.dragThresholdPx)) return noEffect(state);

  const tile = findTile(ctx.state, ctx.board, state.tile);
  if (!tile) return cancelInteraction();

  const target = targetFromPointer({
    pointer: at,
    grabOffset: state.grabOffset,
    boardRectPx: ctx.boardRectPx,
    grid: ctx.state.grid,
    size: tile.size,
    previous: cellOriginOf(tile),
    hysteresisFraction: ctx.options.hysteresisFraction,
  });
  const { result } = previewMove(ctx, state.tile, target);

  return {
    state: { phase: InteractionPhase.Dragging, tile: state.tile, grabOffset: state.grabOffset, target, preview: result },
    effects: [{ type: EffectType.Announce, key: AnnouncementKey.PickedUp, params: {} }],
  };
}

// A tap (Release before crossing the drag threshold) does nothing; a drag begins once the
// pointer moves far enough from where it grabbed the tile.
export function stepArmed(ctx: StepContext, state: ArmedInteractionState, event: InteractionEvent): StepResult {
  if (event.type === InteractionEventType.Move) return stepMove(ctx, state, event.at);
  if (event.type === InteractionEventType.Release) return { state: { phase: InteractionPhase.Idle }, effects: [] };
  if (event.type === InteractionEventType.Cancel) return cancelInteraction();
  return noEffect(state);
}
