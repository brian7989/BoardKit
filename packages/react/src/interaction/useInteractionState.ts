import { useSyncExternalStore } from 'react';
import { InteractionPhase, type InteractionState } from 'boardkit-core';
import { useInteraction } from './useInteraction.js';

const IDLE_STATE: InteractionState = { phase: InteractionPhase.Idle };

function noopSubscribe(_listener: () => void): () => void {
  return () => {};
}

function getIdleSnapshot(): InteractionState {
  return IDLE_STATE;
}

export function useInteractionState(): InteractionState {
  const interaction = useInteraction();
  const subscribe = interaction ? interaction.subscribe : noopSubscribe;
  const getSnapshot = interaction ? interaction.getSnapshot : getIdleSnapshot;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
