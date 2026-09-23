import { useRef, useSyncExternalStore, type RefObject } from 'react';
import type { AnnouncementKey, InteractionEvent, InteractionState, MessageParams, BoardId, PointerSnapshot } from 'boardkit-core';
import { useBoards } from '../../provider/hooks/useBoards.js';
import { useContextSync } from './useContextSync.js';
import { useDispatchAt } from './useDispatchAt.js';
import { useStableController } from './useStableController.js';

export interface UseInteractionControllerResult {
  readonly boardRef: RefObject<HTMLDivElement>;
  readonly interactionState: InteractionState;
  readonly dispatchAt: (event: InteractionEvent) => void;
  readonly subscribePointer: (listener: () => void) => () => void;
  readonly getPointerSnapshot: () => PointerSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => InteractionState;
}

export function useInteractionController(
  board: BoardId,
  onAnnounce: (key: AnnouncementKey, params: MessageParams) => void,
): UseInteractionControllerResult {
  const { engine, state, dispatch } = useBoards();
  const boardRef = useRef<HTMLDivElement>(null);
  const controller = useStableController({ engine, state, board, dispatch, onAnnounce });
  const syncBeforeDispatch = useContextSync({ controller, engine, state, board, boardRef });
  const dispatchAt = useDispatchAt(controller, syncBeforeDispatch);
  const interactionState = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);

  return {
    boardRef,
    interactionState,
    dispatchAt,
    subscribePointer: controller.subscribePointer,
    getPointerSnapshot: controller.getPointerSnapshot,
    subscribe: controller.subscribe,
    getSnapshot: controller.getSnapshot,
  };
}
