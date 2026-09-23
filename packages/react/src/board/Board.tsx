import { useMemo, useRef, type ReactNode } from 'react';
import { findBoard, InteractionPhase, type Board as BoardModel, type BoardId } from 'boardkit-core';
import { AriaRole, LiveRegion, letterboxStyle, useAnnouncer } from '../shared/index.js';
import { useBoards } from '../provider/hooks/useBoards.js';
import { useBoardsConfig } from '../provider/internal/useBoardsConfig.js';
import { InteractionContext, useInteractionController, type InteractionContextValue } from '../interaction/index.js';
import { boardStyle } from './boardStyle.js';
import { BoardEmptyState } from './BoardEmptyState.js';
import { DropPlaceholder } from './DropPlaceholder.js';
import { StackPickerContext } from './stackPicking/StackPickerContext.js';
import { TileList } from './TileList.js';
import { useStackPickerValue } from './stackPicking/useStackPickerValue.js';
import { useContainerWidth } from './internal/useContainerWidth.js';

export interface BoardProps {
  /** Board to render; defaults to the active board. */
  readonly board?: BoardId;
  /** Shown when the board has no tiles; omit for the default message, or pass `null` to hide it. */
  readonly emptyState?: ReactNode;
}

interface BoardBoxProps {
  readonly board: BoardModel;
  readonly emptyState: ReactNode | undefined;
}

// Keyed by board id in the parent so switching boards remounts this along with the controller,
// rather than leaving a drag pointed at the wrong board's context.
function BoardBox({ board, emptyState }: BoardBoxProps) {
  const { grid } = useBoards();
  const { message, announce } = useAnnouncer();
  const { boardRef, interactionState, dispatchAt, subscribePointer, getPointerSnapshot, subscribe, getSnapshot } = useInteractionController(
    board.id,
    announce,
  );
  const stackPicker = useStackPickerValue();
  // boardId, not board: the Board object's identity churns on every commit, but this must stay stable through a drag.
  const contextValue = useMemo<InteractionContextValue>(
    () => ({ boardId: board.id, boardRef, dispatchAt, subscribePointer, getPointerSnapshot, subscribe, getSnapshot }),
    [board.id, boardRef, dispatchAt, subscribePointer, getPointerSnapshot, subscribe, getSnapshot],
  );
  const empty = board.tiles.length === 0 && interactionState.phase !== InteractionPhase.Dragging;

  return (
    <div ref={boardRef} style={boardStyle(grid)} role={AriaRole.Group} aria-label="Board">
      <InteractionContext.Provider value={contextValue}>
        <StackPickerContext.Provider value={stackPicker}>
          <DropPlaceholder board={board} interactionState={interactionState} grid={grid} />
          <TileList />
        </StackPickerContext.Provider>
      </InteractionContext.Provider>
      <BoardEmptyState emptyState={emptyState} empty={empty} />
      <LiveRegion message={message} />
    </div>
  );
}

/** Renders the active board (or `board`), letterboxed to fit the available space. */
export function Board({ board: boardId, emptyState }: BoardProps) {
  const { state, activeBoardId } = useBoards();
  const { reportWidth } = useBoardsConfig();
  const resolved = findBoard(state, boardId ?? activeBoardId);

  const containerRef = useRef<HTMLDivElement>(null);
  useContainerWidth(containerRef, reportWidth);

  return (
    <div ref={containerRef} style={letterboxStyle()}>
      {resolved ? <BoardBox key={resolved.id} board={resolved} emptyState={emptyState} /> : null}
    </div>
  );
}
