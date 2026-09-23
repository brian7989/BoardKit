import { useMemo } from 'react';
import type { Applied, Rejection, Result, Tile } from 'boardkit-core';
import { useTileSize, type UseTileSizeResult } from './hooks/useTileSize.js';
import { useTileFloat, type UseTileFloatResult } from './hooks/useTileFloat.js';
import { useTileStack, type UseTileStackResult } from './hooks/useTileStack.js';
import { useTileName, type UseTileNameResult } from './hooks/useTileName.js';
import { useTileInteraction, type UseTileInteractionResult } from './hooks/useTileInteraction.js';
import { useTileRemove } from './hooks/useTileRemove.js';

/** The result of `useTile`: every per-tile hook's result, bundled for a host's own chrome. */
export interface UseTileResult {
  readonly tile: Tile;
  readonly size: UseTileSizeResult;
  readonly float: UseTileFloatResult;
  readonly stack: UseTileStackResult;
  readonly name: UseTileNameResult;
  readonly interaction: UseTileInteractionResult;
  readonly remove: () => Result<Applied, Rejection>;
}

/**
 * Structural actions for a tile, for a host's own chrome. Pass the tile a rendered
 * TileOverlay receives, not one captured earlier — during a drag, tiles are previewed copies.
 */
export function useTile(tile: Tile): UseTileResult {
  const size = useTileSize(tile);
  const float = useTileFloat(tile);
  const stack = useTileStack(tile);
  const name = useTileName(tile);
  const interaction = useTileInteraction(tile);
  const { remove } = useTileRemove(tile);

  return useMemo(() => ({ tile, size, float, stack, name, interaction, remove }), [tile, size, float, stack, name, interaction, remove]);
}
