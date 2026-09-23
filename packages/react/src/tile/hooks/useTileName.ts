import { useCallback } from 'react';
import { activeItem, OpType, type Applied, type Rejection, type Result, type Tile } from 'boardkit-core';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';
import { displayNameOf } from '../../widget/index.js';

/** The result of `useTileName`: the tile's current display name, and `set` to rename it. */
export interface UseTileNameResult {
  readonly current: string;
  readonly set: (name: string) => Result<Applied, Rejection>;
}

/** The tile's current display name, and `set` to rename it (acts on its active item). */
export function useTileName(tile: Tile): UseTileNameResult {
  const { widgets, activeBoardId, dispatch } = useBoardsConfig();
  const item = activeItem(tile);
  const manifest = widgets.get(item.type);

  const set = useCallback(
    (name: string) => dispatch({ type: OpType.RenameWidget, board: activeBoardId, tile: tile.id, widget: item.id, name }),
    [dispatch, activeBoardId, tile.id, item.id],
  );

  return { current: displayNameOf(item, manifest), set };
}
