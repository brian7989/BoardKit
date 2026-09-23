import { findBoard, InteractionPhase, type Board as BoardModel, type InteractionState, type Tile } from 'boardkit-core';
import { useBoards } from '../provider/hooks/useBoards.js';
import { useInteraction, useInteractionState } from '../interaction/index.js';

function previewTiles(board: BoardModel, interactionState: InteractionState): readonly Tile[] {
  if (interactionState.phase !== InteractionPhase.Dragging || !interactionState.preview.ok) return board.tiles;

  const previewBoard = findBoard(interactionState.preview.value.state, board.id);
  return previewBoard?.tiles ?? board.tiles;
}

/** Tiles of the enclosing board, using the drag preview arrangement while a valid drag is under way. */
export function useBoardTiles(): readonly Tile[] {
  const interaction = useInteraction();
  const { state, activeBoardId } = useBoards();
  const interactionState = useInteractionState();
  const board = findBoard(state, interaction?.boardId ?? activeBoardId);
  if (!board) return [];

  return previewTiles(board, interactionState);
}
