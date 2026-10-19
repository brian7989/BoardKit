import type { PointerEvent as ReactPointerEvent } from 'react';
import { InteractionEventType, type InteractionEvent, type TileId } from 'boardkit-core';
import { useDragGesture, type UseDragGestureResult } from './dragGesture/useDragGesture.js';
import { isDragHandleTarget } from './dragGesture/isDragHandleTarget.js';

export interface UseTilePointerInput {
  readonly tile: TileId;
  readonly enabled: boolean;
  readonly dispatchAt: (event: InteractionEvent) => void;
}

export type UseTilePointerResult = UseDragGestureResult;

const PRIMARY_BUTTON = 0;

function canStartTileDrag(enabled: boolean, event: ReactPointerEvent): boolean {
  return enabled && event.button === PRIMARY_BUTTON && isDragHandleTarget(event.target);
}

export function useTilePointer(input: UseTilePointerInput): UseTilePointerResult {
  const { tile, enabled, dispatchAt } = input;
  return useDragGesture({
    enabled,
    canStart: (event) => canStartTileDrag(enabled, event),
    onGrab: (at) => dispatchAt({ type: InteractionEventType.Grab, tile, at }),
    onMove: (at) => dispatchAt({ type: InteractionEventType.Move, at }),
    onRelease: (at) => dispatchAt({ type: InteractionEventType.Release, at }),
    onCancel: () => dispatchAt({ type: InteractionEventType.Cancel }),
  });
}
