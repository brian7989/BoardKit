import { useCallback, useMemo } from 'react';
import { activeItem, OpType, sizesEqual, type Applied, type Rejection, type Result, type Size, type Tile } from 'boardkit-core';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';
import { parseSizeInput } from '../../shared/size/parseSizeInput.js';
import type { SizeInput } from '../../shared/size/SizeInput.js';

/** One size a tile could resize to, and whether it's the tile's current size. */
export interface TileSizeOption {
  readonly size: Size;
  readonly isCurrent: boolean;
}

/** The result of `useTileSize`: the tile's current size, its options, and `set`/`canSet`. */
export interface UseTileSizeResult {
  readonly current: Size;
  readonly options: readonly TileSizeOption[];
  readonly set: (size: SizeInput) => Result<Applied, Rejection>;
  readonly canSet: (size: SizeInput) => boolean;
}

function toOptions(sizes: readonly Size[], current: Size): readonly TileSizeOption[] {
  return sizes.map((size) => ({ size, isCurrent: sizesEqual(size, current) }));
}

/** A tile's size, its resize options, and `set`/`canSet` (the solver runs lazily, per call). */
export function useTileSize(tile: Tile): UseTileSizeResult {
  const { widgets, activeBoardId, dispatch, canApply } = useBoardsConfig();
  const sizes = widgets.get(activeItem(tile).type)?.sizes ?? [];

  const set = useCallback(
    (size: SizeInput) => dispatch({ type: OpType.Resize, board: activeBoardId, tile: tile.id, size: parseSizeInput(size) }),
    [dispatch, activeBoardId, tile.id],
  );
  const canSet = useCallback(
    (size: SizeInput) => canApply({ type: OpType.Resize, board: activeBoardId, tile: tile.id, size: parseSizeInput(size) }),
    [canApply, activeBoardId, tile.id],
  );
  const options = useMemo(() => toOptions(sizes, tile.size), [sizes, tile.size]);

  return useMemo(() => ({ current: tile.size, options, set, canSet }), [tile.size, options, set, canSet]);
}
