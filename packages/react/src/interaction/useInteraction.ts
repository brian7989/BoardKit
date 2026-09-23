import { useContext } from 'react';
import { InteractionContext, type InteractionContextValue } from './InteractionContext.js';

// null outside an interactive Board; callers treat that as "not draggable" rather than an error.
export function useInteraction(): InteractionContextValue | null {
  return useContext(InteractionContext);
}
