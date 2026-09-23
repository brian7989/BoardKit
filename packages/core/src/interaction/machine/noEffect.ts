import type { InteractionState } from '../state/InteractionState.js';
import type { StepResult } from './StepResult.js';

// Returned for an event that makes no sense in the current phase: state is unchanged,
// nothing happens.
export function noEffect(state: InteractionState): StepResult {
  return { state, effects: [] };
}
