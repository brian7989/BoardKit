import type { PointerEvent as ReactPointerEvent } from 'react';
import { InteractionEventType, type InteractionEvent, type TileId } from 'boardkit-core';
import type { DragFrom } from '../provider/DragFrom.js';
import { useDragGesture, type UseDragGestureResult } from './dragGesture/useDragGesture.js';
import { isDragHandleTarget } from './dragGesture/isDragHandleTarget.js';

export interface UseTilePointerInput {
  readonly tile: TileId;
  readonly enabled: boolean;
  readonly dragFrom: DragFrom;
  readonly dispatchAt: (event: InteractionEvent) => void;
}

export type UseTilePointerResult = UseDragGestureResult;

const PRIMARY_BUTTON = 0;

function canStartTileDrag(enabled: boolean, dragFrom: DragFrom, event: ReactPointerEvent): boolean {
  return enabled && event.button === PRIMARY_BUTTON && isDragHandleTarget(event.target, dragFrom);
}

export function useTilePointer(input: UseTilePointerInput): UseTilePointerResult {
  const { tile, enabled, dragFrom, dispatchAt } = input;
  return useDragGesture({
    enabled,
    canStart: (event) => canStartTileDrag(enabled, dragFrom, event),
    onGrab: (at) => dispatchAt({ type: InteractionEventType.Grab, tile, at }),
    onMove: (at) => dispatchAt({ type: InteractionEventType.Move, at }),
    onRelease: (at) => dispatchAt({ type: InteractionEventType.Release, at }),
    onCancel: () => dispatchAt({ type: InteractionEventType.Cancel }),
  });
}
