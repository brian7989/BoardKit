import type { InteractionEvent } from '../events/InteractionEvent.js';
import type { InteractionState } from '../state/InteractionState.js';
import type { StepContext } from '../StepContext.js';
import type { PointerSnapshot } from './PointerSnapshot.js';

export interface InteractionController {
  subscribe(listener: () => void): () => void;
  getSnapshot(): InteractionState;
  subscribePointer(listener: () => void): () => void;
  getPointerSnapshot(): PointerSnapshot;
  dispatch(event: InteractionEvent): void;
  setContext(ctx: StepContext): void;
}
