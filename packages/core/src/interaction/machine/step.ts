import { InteractionPhase } from '../state/InteractionPhase.js';
import type { InteractionState } from '../state/InteractionState.js';
import type { InteractionEvent } from '../events/InteractionEvent.js';
import { assertNever } from '../../shared/unions/assertNever.js';
import type { StepContext } from '../StepContext.js';
import type { StepResult } from './StepResult.js';
import { stepIdle } from './stepIdle.js';
import { stepArmed } from './stepArmed.js';
import { stepDragging } from './stepDragging.js';

// Handlers ignore irrelevant events; unsupported event in a phase leaves state unchanged.
export function step(ctx: StepContext, state: InteractionState, event: InteractionEvent): StepResult {
  switch (state.phase) {
    case InteractionPhase.Idle:
      return stepIdle(ctx, event);
    case InteractionPhase.Armed:
      return stepArmed(ctx, state, event);
    case InteractionPhase.Dragging:
      return stepDragging(ctx, state, event);
    default:
      return assertNever(state);
  }
}
