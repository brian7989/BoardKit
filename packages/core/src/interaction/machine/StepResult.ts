import type { InteractionState } from '../state/InteractionState.js';
import type { Effect } from '../events/Effect.js';

export interface StepResult {
  readonly state: InteractionState;
  readonly effects: readonly Effect[];
}
