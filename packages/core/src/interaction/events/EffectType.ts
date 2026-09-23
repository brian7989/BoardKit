import type { ValueOf } from '../../shared/unions/ValueOf.js';

export const EffectType = {
  Commit: 'commit',
  Reject: 'reject',
  Announce: 'announce',
} as const;

export type EffectType = ValueOf<typeof EffectType>;
