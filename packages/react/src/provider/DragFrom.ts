import type { ValueOf } from 'boardkit-core';

/** Where a tile's drag gesture may start: its `tileHeader` strip only, or anywhere on the tile. */
export const DragFrom = {
  Header: 'header',
  Tile: 'tile',
} as const;

export type DragFrom = ValueOf<typeof DragFrom>;
