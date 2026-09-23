import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import {
  InteractionDefaults,
  InteractionEventType,
  type BoardId,
  type BoardsState,
  type Engine,
  type InteractionController,
  type InteractionEvent,
  type Px,
  type Rect,
} from 'boardkit-core';
import { measureRect, ZERO_RECT } from '../measureRect.js';

export interface UseContextSyncInput {
  readonly controller: InteractionController;
  readonly engine: Engine;
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly boardRef: RefObject<HTMLDivElement>;
}

interface PushContextInput extends UseContextSyncInput {
  readonly boardRectPx: Rect<Px>;
}

function pushContext(input: PushContextInput): void {
  const { controller, engine, state, board, boardRectPx } = input;
  controller.setContext({ engine, state, board, boardRectPx, options: InteractionDefaults });
}

// The board rect is re-measured only on Grab or a state change, never on every Move: getBoundingClientRect() forces sync layout and Move can fire 60+ times/sec.
export function useContextSync(input: UseContextSyncInput): (event: InteractionEvent) => void {
  const { controller, engine, state, board, boardRef } = input;
  const boardRectRef = useRef<Rect<Px>>(ZERO_RECT);
  const latestRef = useRef(input);
  useLayoutEffect(() => {
    latestRef.current = input;
  });

  useEffect(() => {
    boardRectRef.current = measureRect(boardRef.current);
    pushContext({ ...input, boardRectPx: boardRectRef.current });
  }, [controller, engine, state, board, boardRef]);

  // Stable identity so it doesn't force every context consumer to re-render on every commit.
  return useCallback((event: InteractionEvent) => {
    const current = latestRef.current;
    if (event.type === InteractionEventType.Grab) boardRectRef.current = measureRect(current.boardRef.current);
    pushContext({ ...current, boardRectPx: boardRectRef.current });
  }, []);
}
