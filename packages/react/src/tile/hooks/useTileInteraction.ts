import type { Tile } from 'boardkit-core';
import { useBoards } from '../../provider/hooks/useBoards.js';
import { useInteraction, useTileInteractionState } from '../../interaction/index.js';

/** The result of `useTileInteraction`: a tile's live drag/valid/locked state. */
export interface UseTileInteractionResult {
  readonly isDragging: boolean;
  readonly isValid: boolean;
  readonly isLocked: boolean;
}

/** A tile's live drag/valid/locked state, subscribed narrowly so other tiles don't re-render. */
export function useTileInteraction(tile: Tile): UseTileInteractionResult {
  const { locked } = useBoards();
  const interaction = useInteraction();
  const { active, valid } = useTileInteractionState(interaction, tile.id);

  return { isDragging: active, isValid: valid, isLocked: locked };
}
