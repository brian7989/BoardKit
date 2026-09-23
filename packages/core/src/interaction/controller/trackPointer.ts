import { InteractionPhase } from '../state/InteractionPhase.js';
import type { InteractionState } from '../state/InteractionState.js';
import type { InteractionEvent } from '../events/InteractionEvent.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import { fractionalOrigin } from '../hitTest/fractionalOrigin.js';
import { findTile } from '../../model/index.js';
import type { StepContext } from '../StepContext.js';
import type { PointerSnapshot } from './PointerSnapshot.js';

// Returns null when dragging isn't active, so subscribers know to stop.
export function trackPointer(ctx: StepContext, state: InteractionState, event: InteractionEvent): PointerSnapshot {
  if (state.phase !== InteractionPhase.Dragging || event.type !== InteractionEventType.Move) return null;
  const tile = findTile(ctx.state, ctx.board, state.tile);
  if (!tile) return null;
  return {
    tile: state.tile,
    origin: fractionalOrigin({
      pointer: event.at,
      grabOffset: state.grabOffset,
      boardRectPx: ctx.boardRectPx,
      grid: ctx.state.grid,
      size: tile.size,
    }),
  };
}
