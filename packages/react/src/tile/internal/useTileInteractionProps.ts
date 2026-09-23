import type { FractionalCell, InteractionEvent, PointerSnapshot, TileId } from 'boardkit-core';
import { useInteraction, usePointerOrigin, useTileInteractionState, type TileInteractionState } from '../../interaction/index.js';

export interface TileInteractionProps extends TileInteractionState {
  readonly enabled: boolean;
  readonly dispatchAt: (event: InteractionEvent) => void;
  readonly origin: FractionalCell | null;
}

function noopDispatch(_event: InteractionEvent): void {}
function noopSubscribe(_listener: () => void): () => void {
  return () => {};
}
function noPointerSnapshot(): PointerSnapshot {
  return null;
}

export function useTileInteractionProps(tile: TileId, locked: boolean): TileInteractionProps {
  const interaction = useInteraction();
  const enabled = !locked && interaction !== null;
  const dispatchAt = interaction ? interaction.dispatchAt : noopDispatch;
  const subscribePointer = interaction ? interaction.subscribePointer : noopSubscribe;
  const getPointerSnapshot = interaction ? interaction.getPointerSnapshot : noPointerSnapshot;
  const origin = usePointerOrigin({ subscribePointer, getPointerSnapshot, tile });
  const state = useTileInteractionState(interaction, tile);
  return { enabled, dispatchAt, origin, ...state };
}
