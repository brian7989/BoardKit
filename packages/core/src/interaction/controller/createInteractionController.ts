import { InteractionPhase } from '../state/InteractionPhase.js';
import type { InteractionState } from '../state/InteractionState.js';
import type { InteractionEvent } from '../events/InteractionEvent.js';
import { step } from '../machine/step.js';
import { previewMove } from '../preview/previewMove.js';
import type { StepContext } from '../StepContext.js';
import type { InteractionController } from './InteractionController.js';
import type { PointerSnapshot } from './PointerSnapshot.js';
import { trackPointer } from './trackPointer.js';
import { runEffects, type RunEffectsCallbacks } from './runEffects.js';

export interface CreateInteractionControllerOptions extends RunEffectsCallbacks {
  readonly context: StepContext;
}

interface ControllerRef {
  ctx: StepContext;
  state: InteractionState;
  pointer: PointerSnapshot;
}

interface ListenerRegistry {
  readonly subscribe: (listener: () => void) => () => void;
  readonly notify: () => void;
}

function createListenerRegistry(): ListenerRegistry {
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify: () => listeners.forEach((listener) => listener()),
  };
}

// React re-syncs the context before every dispatch, usually with nothing changed; re-solving
// and notifying then would cost a full solver run and a board re-render per pointer move.
function sameContext(a: StepContext, b: StepContext): boolean {
  return a.engine === b.engine && a.state === b.state && a.board === b.board && a.boardRectPx === b.boardRectPx && a.options === b.options;
}

// Keeps a dragged tile's preview current when the context really changes (resize, external op).
function refreshPreview(ctx: StepContext, state: InteractionState): InteractionState {
  if (state.phase !== InteractionPhase.Dragging) return state;
  const { result } = previewMove(ctx, state.tile, state.target);
  return { ...state, preview: result };
}

interface PerformDispatchInput {
  readonly ref: ControllerRef;
  readonly event: InteractionEvent;
  readonly callbacks: RunEffectsCallbacks;
  readonly notify: () => void;
  readonly notifyPointer: () => void;
}

// Steps the machine, refreshes the pointer snapshot from the same post-step state, then
// notifies both stores — the one dispatch path either kind of subscriber goes through.
function performDispatch(input: PerformDispatchInput): void {
  const { ref, event, callbacks, notify, notifyPointer } = input;
  const result = step(ref.ctx, ref.state, event);
  ref.state = result.state;
  ref.pointer = trackPointer(ref.ctx, ref.state, event);
  runEffects(result.effects, callbacks);
  notifyPointer();
  notify();
}

export function createInteractionController(options: CreateInteractionControllerOptions): InteractionController {
  const ref: ControllerRef = { ctx: options.context, state: { phase: InteractionPhase.Idle }, pointer: null };
  const { subscribe, notify } = createListenerRegistry();
  const { subscribe: subscribePointer, notify: notifyPointer } = createListenerRegistry();
  return {
    subscribe,
    getSnapshot: () => ref.state,
    subscribePointer,
    getPointerSnapshot: () => ref.pointer,
    dispatch: (event) => performDispatch({ ref, event, callbacks: options, notify, notifyPointer }),
    setContext(next) {
      const changed = !sameContext(ref.ctx, next);
      ref.ctx = next;
      if (!changed) return;
      ref.state = refreshPreview(ref.ctx, ref.state);
      notify();
    },
  };
}
