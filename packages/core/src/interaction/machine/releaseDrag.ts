import { AnnouncementKey } from '../events/AnnouncementKey.js';
import { EffectType } from '../events/EffectType.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import { previewMove } from '../preview/previewMove.js';
import type { StepContext } from '../StepContext.js';
import type { Point } from '../../shared/geometry/Point.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { StepResult } from './StepResult.js';

// Re-apply to current state, not a stale preview.
export function releaseDrag(ctx: StepContext, tile: TileId, target: Point<Cell>): StepResult {
  const { op, result } = previewMove(ctx, tile, target);
  const state = { phase: InteractionPhase.Idle } as const;
  if (result.ok) {
    return {
      state,
      effects: [
        { type: EffectType.Commit, op, applied: result.value },
        { type: EffectType.Announce, key: AnnouncementKey.Dropped, params: {} },
      ],
    };
  }
  return {
    state,
    effects: [
      { type: EffectType.Reject, rejection: result.error, op },
      { type: EffectType.Announce, key: AnnouncementKey.Rejected, params: {} },
    ],
  };
}
