import type { ValueOf } from '../../shared/unions/ValueOf.js';

export const InteractionPhase = {
  Idle: 'idle',
  Armed: 'armed',
  Dragging: 'dragging',
} as const;

export type InteractionPhase = ValueOf<typeof InteractionPhase>;
