import { AnnouncementKey } from '../events/AnnouncementKey.js';
import { EffectType } from '../events/EffectType.js';
import type { InteractionEvent } from '../events/InteractionEvent.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import type { DraggingInteractionState } from '../state/InteractionState.js';
import { pointerInsideBoard } from '../hitTest/pointerInsideBoard.js';
import { targetFromPointer } from '../hitTest/targetFromPointer.js';
import { previewMove } from '../preview/previewMove.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Px } from '../../shared/units/Px.js';
import type { StepContext } from '../StepContext.js';
import type { StepResult } from './StepResult.js';
import { findTile } from '../../model/index.js';
import { noEffect } from './noEffect.js';
import { cancelInteraction } from './cancelInteraction.js';
import { releaseDrag } from './releaseDrag.js';

function stepMove(ctx: StepContext, state: DraggingInteractionState, at: Point<Px>): StepResult {
  const tile = findTile(ctx.state, ctx.board, state.tile);
  if (!tile) return cancelInteraction();

  const target = targetFromPointer({
    pointer: at,
    grabOffset: state.grabOffset,
    boardRectPx: ctx.boardRectPx,
    grid: ctx.state.grid,
    size: tile.size,
    previous: state.target,
    hysteresisFraction: ctx.options.hysteresisFraction,
  });
  if (target.x === state.target.x && target.y === state.target.y) return noEffect(state);

  const { result } = previewMove(ctx, state.tile, target);
  return {
    state: { ...state, target, preview: result },
    effects: [{ type: EffectType.Announce, key: AnnouncementKey.Moved, params: {} }],
  };
}

function stepRelease(ctx: StepContext, state: DraggingInteractionState, at: Point<Px>): StepResult {
  if (!pointerInsideBoard(at, ctx.boardRectPx)) return cancelInteraction();
  return releaseDrag(ctx, state.tile, state.target);
}

// Move recomputes the target and its preview; Release inside the board commits or rejects,
// Release outside the board (or an explicit Cancel) drops nothing.
export function stepDragging(ctx: StepContext, state: DraggingInteractionState, event: InteractionEvent): StepResult {
  if (event.type === InteractionEventType.Move) return stepMove(ctx, state, event.at);
  if (event.type === InteractionEventType.Release) return stepRelease(ctx, state, event.at);
  if (event.type === InteractionEventType.Cancel) return cancelInteraction();
  return noEffect(state);
}
