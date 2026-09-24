import { useCallback } from 'react';
import { isFloating, isFree, OpType, type Applied, type Rejection, type Result, type Tile } from 'boardkit-core';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';

/** The result of `useTileFloat`: whether a tile is floating (and snapped or free), plus the actions to change it. */
export interface UseTileFloatResult {
  readonly isFloating: boolean;
  /** True for an unsnapped, collision-free tile; false for one snapped into the Overlay layer. */
  readonly isFree: boolean;
  readonly toggle: () => Result<Applied, Rejection>;
  readonly set: (floating: boolean) => Result<Applied, Rejection>;
  readonly setFree: (free: boolean) => Result<Applied, Rejection>;
}

/** Whether a tile is floating (snapped or free), and the actions to change either. */
export function useTileFloat(tile: Tile): UseTileFloatResult {
  const { activeBoardId, dispatch } = useBoardsConfig();
  const floating = isFloating(tile);
  const free = isFree(tile);

  const set = useCallback(
    (next: boolean) => dispatch({ type: OpType.SetFloating, board: activeBoardId, tile: tile.id, floating: next }),
    [dispatch, activeBoardId, tile.id],
  );
  const toggle = useCallback(() => set(!floating), [set, floating]);
  const setFree = useCallback(
    (next: boolean) => dispatch({ type: OpType.SetFloatFree, board: activeBoardId, tile: tile.id, free: next }),
    [dispatch, activeBoardId, tile.id],
  );

  return { isFloating: floating, isFree: free, toggle, set, setFree };
}
