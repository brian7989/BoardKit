import { useCallback } from 'react';
import { OpType, type Applied, type Rejection, type Result, type Tile } from 'boardkit-core';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';

/** The result of `useTileRemove`: `remove` to delete this tile. */
export interface UseTileRemoveResult {
  readonly remove: () => Result<Applied, Rejection>;
}

/** `remove` to delete this tile from its board. */
export function useTileRemove(tile: Tile): UseTileRemoveResult {
  const { activeBoardId, dispatch } = useBoardsConfig();
  const remove = useCallback(() => dispatch({ type: OpType.Remove, board: activeBoardId, tile: tile.id }), [dispatch, activeBoardId, tile.id]);

  return { remove };
}
