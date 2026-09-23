import type { PointerEvent as ReactPointerEvent } from 'react';
import { InteractionEventType, type InteractionEvent, type TileId } from 'boardkit-core';
import { DataAttr } from '../shared/index.js';
import { useDragGesture, type UseDragGestureResult } from './dragGesture/useDragGesture.js';

export interface UseTilePointerInput {
  readonly tile: TileId;
  readonly enabled: boolean;
  readonly dispatchAt: (event: InteractionEvent) => void;
}

export type UseTilePointerResult = UseDragGestureResult;

const PRIMARY_BUTTON = 0;
const NO_DRAG_SELECTOR = `[${DataAttr.NoDrag}]`;

function isNoDragTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(NO_DRAG_SELECTOR) !== null;
}

function canStartTileDrag(enabled: boolean, event: ReactPointerEvent): boolean {
  return enabled && event.button === PRIMARY_BUTTON && !isNoDragTarget(event.target);
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
