import { useEffect, useState } from 'react';
import { InteractionPhase, type InteractionState, type TileId } from 'boardkit-core';
import type { InteractionContextValue } from './InteractionContext.js';
import { tileInteractionState, type TileInteractionState } from './tileInteractionState.js';

const IDLE_STATE: InteractionState = { phase: InteractionPhase.Idle };

function noopSubscribe(_listener: () => void): () => void {
  return () => {};
}

function getIdleSnapshot(): InteractionState {
  return IDLE_STATE;
}

function sameState(a: TileInteractionState, b: TileInteractionState): boolean {
  return a === b || (a.active === b.active && a.valid === b.valid);
}

// Bails out of setState with the same object when this tile's slice is unchanged, so a store-wide notify doesn't re-render every tile.
export function useTileInteractionState(interaction: InteractionContextValue | null, tile: TileId): TileInteractionState {
  const subscribe = interaction ? interaction.subscribe : noopSubscribe;
  const getSnapshot = interaction ? interaction.getSnapshot : getIdleSnapshot;
  const [state, setState] = useState<TileInteractionState>(() => tileInteractionState(tile, getSnapshot()));

  useEffect(() => {
    const sync = () =>
      setState((previous) => {
        const next = tileInteractionState(tile, getSnapshot());
        return sameState(previous, next) ? previous : next;
      });
    sync();
    return subscribe(sync);
  }, [subscribe, getSnapshot, tile]);

  return state;
}
