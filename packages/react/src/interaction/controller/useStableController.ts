import { useCallback, useRef } from 'react';
import {
  createInteractionController,
  InteractionDefaults,
  type AnnouncementKey,
  type BoardId,
  type BoardsState,
  type Engine,
  type InteractionController,
  type MessageParams,
  type Op,
} from 'boardkit-core';
import type { Dispatch } from '../../provider/internal/useDispatch.js';
import { ZERO_RECT } from '../measureRect.js';

export interface UseStableControllerInput {
  readonly engine: Engine;
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly dispatch: Dispatch;
  readonly onAnnounce: (key: AnnouncementKey, params: MessageParams) => void;
}

// Built once via the lazy-ref pattern; callbacks close over refs so the controller always calls the latest dispatch/onAnnounce.
export function useStableController(input: UseStableControllerInput): InteractionController {
  const { engine, state, board, dispatch, onAnnounce } = input;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const onAnnounceRef = useRef(onAnnounce);
  onAnnounceRef.current = onAnnounce;
  const forward = useCallback((op: Op) => dispatchRef.current(op), []);

  const controllerRef = useRef<InteractionController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createInteractionController({
      context: { engine, state, board, boardRectPx: ZERO_RECT, options: InteractionDefaults },
      onCommit: forward,
      onReject: (_rejection, op) => forward(op),
      onAnnounce: (key, params) => onAnnounceRef.current(key, params),
    });
  }
  return controllerRef.current;
}
