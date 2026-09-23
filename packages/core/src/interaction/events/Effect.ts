import type { Op } from '../../ops/Op.js';
import type { Applied } from '../../ops/outcome/Applied.js';
import type { Rejection } from '../../ops/outcome/Rejection.js';
import { EffectType } from './EffectType.js';
import type { AnnouncementKey } from './AnnouncementKey.js';
import type { MessageParams } from './MessageParams.js';

// Commit pre-computes Applied to avoid controller re-applying the op.
export type Effect =
  | { readonly type: typeof EffectType.Commit; readonly op: Op; readonly applied: Applied }
  | { readonly type: typeof EffectType.Reject; readonly rejection: Rejection; readonly op: Op }
  | { readonly type: typeof EffectType.Announce; readonly key: AnnouncementKey; readonly params: MessageParams };
