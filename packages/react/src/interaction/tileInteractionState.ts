import { InteractionPhase, type InteractionState, type TileId } from 'boardkit-core';

export interface TileInteractionState {
  readonly active: boolean;
  readonly valid: boolean;
}

const INACTIVE: TileInteractionState = { active: false, valid: true };

export function tileInteractionState(tile: TileId, interactionState: InteractionState): TileInteractionState {
  if (interactionState.phase !== InteractionPhase.Dragging || interactionState.tile !== tile) return INACTIVE;
  return { active: true, valid: interactionState.preview.ok };
}
