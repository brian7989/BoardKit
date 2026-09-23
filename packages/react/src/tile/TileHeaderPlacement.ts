import type { ValueOf } from 'boardkit-core';

/** Where the library renders a host's tileHeader: a strip that reserves body space, or an overlay above a headerless widget's full-size body. */
export const TileHeaderPlacement = {
  Strip: 'strip',
  Overlay: 'overlay',
} as const;

export type TileHeaderPlacement = ValueOf<typeof TileHeaderPlacement>;
