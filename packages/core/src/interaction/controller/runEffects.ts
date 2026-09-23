import { EffectType } from '../events/EffectType.js';
import type { Effect } from '../events/Effect.js';
import type { AnnouncementKey } from '../events/AnnouncementKey.js';
import type { MessageParams } from '../events/MessageParams.js';
import type { Applied } from '../../ops/outcome/Applied.js';
import type { Op } from '../../ops/Op.js';
import type { Rejection } from '../../ops/outcome/Rejection.js';
import { assertNever } from '../../shared/unions/assertNever.js';

export interface RunEffectsCallbacks {
  readonly onCommit?: (op: Op, applied: Applied) => void;
  readonly onReject?: (rejection: Rejection, op: Op) => void;
  readonly onAnnounce?: (key: AnnouncementKey, params: MessageParams) => void;
}

function runEffect(effect: Effect, callbacks: RunEffectsCallbacks): void {
  switch (effect.type) {
    case EffectType.Commit:
      callbacks.onCommit?.(effect.op, effect.applied);
      return;
    case EffectType.Reject:
      callbacks.onReject?.(effect.rejection, effect.op);
      return;
    case EffectType.Announce:
      callbacks.onAnnounce?.(effect.key, effect.params);
      return;
    default:
      assertNever(effect);
  }
}

// Order matters: Commit must precede Announce, so run in sequence, not batched by type.
export function runEffects(effects: readonly Effect[], callbacks: RunEffectsCallbacks): void {
  for (const effect of effects) runEffect(effect, callbacks);
}
