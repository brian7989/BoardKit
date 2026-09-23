import { createContext, type RefObject } from 'react';
import type { BoardId, InteractionEvent, InteractionState, PointerSnapshot } from 'boardkit-core';

export interface InteractionContextValue {
  // boardId, not the Board object: the object's identity churns on every commit, but this context must stay stable across a drag.
  readonly boardId: BoardId;
  readonly boardRef: RefObject<HTMLDivElement>;
  readonly dispatchAt: (event: InteractionEvent) => void;
  readonly subscribePointer: (listener: () => void) => () => void;
  readonly getPointerSnapshot: () => PointerSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => InteractionState;
}

// null outside a Board that owns a controller, so a standalone Tile (e.g. in tests) is simply non-interactive.
export const InteractionContext = createContext<InteractionContextValue | null>(null);
