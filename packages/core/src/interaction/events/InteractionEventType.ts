import type { ValueOf } from '../../shared/unions/ValueOf.js';

// Tick (dwell timing) and the stack-vs-move choice arrive with the Stack op; every event here
// drives plain pointer dragging, per "no half-finished implementations".
export const InteractionEventType = {
  Grab: 'grab',
  Move: 'move',
  Release: 'release',
  Cancel: 'cancel',
} as const;

export type InteractionEventType = ValueOf<typeof InteractionEventType>;
