import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { pxToFractionalCell, OpType, type BoardId, type FractionalCell, type Point, type Px, type TileId } from 'boardkit-core';
import { DataAttr } from '../../shared/index.js';
import { useDragGesture, useInteraction, type UseDragGestureResult } from '../../interaction/index.js';
import { measureRect } from '../../interaction/measureRect.js';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';
import type { Dispatch } from '../../provider/internal/useDispatch.js';

export interface UseFloatDragInput {
  readonly tile: TileId;
  readonly board: BoardId;
  readonly enabled: boolean;
  readonly origin: FractionalCell;
}

export type UseFloatDragResult = UseDragGestureResult;

interface Grid {
  readonly cols: number;
  readonly rows: number;
}

const PRIMARY_BUTTON = 0;
const NO_DRAG_SELECTOR = `[${DataAttr.NoDrag}]`;

function isNoDragTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(NO_DRAG_SELECTOR) !== null;
}

interface CanStartFloatDragInput {
  readonly enabled: boolean;
  readonly boardRef: RefObject<HTMLDivElement> | undefined;
  readonly event: ReactPointerEvent;
}

function canStartFloatDrag(input: CanStartFloatDragInput): boolean {
  const { enabled, boardRef, event } = input;
  return enabled && boardRef !== undefined && event.button === PRIMARY_BUTTON && !isNoDragTarget(event.target);
}

function pointerToFractionalCell(at: Point<Px>, boardRef: RefObject<HTMLDivElement>, grid: Grid): FractionalCell {
  return pxToFractionalCell(at, measureRect(boardRef.current), grid);
}

interface FloatMoveInput {
  readonly boardRef: RefObject<HTMLDivElement>;
  readonly grid: Grid;
  readonly dispatch: Dispatch;
  readonly board: BoardId;
  readonly tile: TileId;
}

// `offset` (pointer position within the tile at grab time) stays constant so the tile doesn't jump to center on the cursor.
function floatMoveTo(input: FloatMoveInput, offset: FractionalCell, at: Point<Px>): void {
  const { boardRef, grid, dispatch, board, tile } = input;
  const pointer = pointerToFractionalCell(at, boardRef, grid);
  dispatch({ type: OpType.MoveFloating, board, tile, to: { x: pointer.x - offset.x, y: pointer.y - offset.y } });
}

export function useFloatDrag(input: UseFloatDragInput): UseFloatDragResult {
  const { tile, board, enabled, origin } = input;
  const interaction = useInteraction();
  const { dispatch, grid } = useBoardsConfig();
  const boardRef = interaction?.boardRef;
  let offset: FractionalCell = { x: 0, y: 0 };

  return useDragGesture({
    enabled,
    canStart: (event) => canStartFloatDrag({ enabled, boardRef, event }),
    onGrab: (at) => {
      if (!boardRef) return;
      const grabbed = pointerToFractionalCell(at, boardRef, grid);
      offset = { x: grabbed.x - origin.x, y: grabbed.y - origin.y };
    },
    onMove: (at) => boardRef && floatMoveTo({ boardRef, grid, dispatch, board, tile }, offset, at),
    onRelease: (at) => boardRef && floatMoveTo({ boardRef, grid, dispatch, board, tile }, offset, at),
    onCancel: () => {},
  });
}
