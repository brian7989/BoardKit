import { AnnouncementKey } from '../events/AnnouncementKey.js';
import { EffectType } from '../events/EffectType.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import type { StepResult } from './StepResult.js';

// Shared by an explicit Cancel and by a Release outside the board: no commit, back to
// Idle, with an announcement so the interaction's end is never silent for a screen reader.
export function cancelInteraction(): StepResult {
  return {
    state: { phase: InteractionPhase.Idle },
    effects: [{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }],
  };
}
