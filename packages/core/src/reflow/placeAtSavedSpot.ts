import type { Tile } from '../model/Tile.js';
import type { Size } from '../shared/sizes/Size.js';
import type { LayoutTile } from '../model/LayoutTile.js';
import { fitSize } from './fitSize.js';
import { openPage } from './openPage.js';
import { ReflowChangeKind } from './ReflowChangeKind.js';
import type { ReflowPlacementInput } from './ReflowPlacementInput.js';

export interface PlaceAtSavedSpotInput extends ReflowPlacementInput {
  readonly at: LayoutTile;
}

function withSavedPosition(tile: Tile, size: Size, at: LayoutTile): Tile {
  const { float: _drop, ...rest } = tile;
  return at.float ? { ...rest, size, col: at.col, row: at.row, float: at.float } : { ...rest, size, col: at.col, row: at.row };
}

// Restores a saved position verbatim, after the same shrink-or-drop safety net a fresh placement
// gets — so an unedited round trip through another breakpoint lands back exactly where it started.
export function placeAtSavedSpot(input: PlaceAtSavedSpotInput): void {
  const { entry, at, ctx, pages, changes } = input;
  const size = fitSize({ ...entry.tile, size: at.size }, ctx);
  if (!size) {
    changes.push({ tile: entry.tile.id, board: entry.board, kind: ReflowChangeKind.Dropped });
    return;
  }
  const page = pages.find((candidate) => candidate.id === at.board) ?? openPage(pages, changes);
  page.tiles.push(withSavedPosition(entry.tile, size, at));
}
