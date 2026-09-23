import { useCallback } from 'react';
import { isFloating, OpType, type Applied, type Rejection, type Result, type Tile } from 'boardkit-core';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';

/** The result of `useTileFloat`: whether a tile is floating, and `toggle`/`set` to change it. */
export interface UseTileFloatResult {
  readonly isFloating: boolean;
  readonly toggle: () => Result<Applied, Rejection>;
  readonly set: (floating: boolean) => Result<Applied, Rejection>;
}

/** Whether a tile is floating, and `toggle`/`set` to change it. */
export function useTileFloat(tile: Tile): UseTileFloatResult {
  const { activeBoardId, dispatch } = useBoardsConfig();
  const floating = isFloating(tile);

  const set = useCallback(
    (next: boolean) => dispatch({ type: OpType.SetFloating, board: activeBoardId, tile: tile.id, floating: next }),
    [dispatch, activeBoardId, tile.id],
  );
  const toggle = useCallback(() => set(!floating), [set, floating]);

  return { isFloating: floating, toggle, set };
}
