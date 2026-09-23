import { createContext, useContext, type ComponentType } from 'react';
import type { Tile } from 'boardkit-core';
import { noDragProps } from '../shared/index.js';

/** Props passed to a host's own `tileOverlay` component: the tile and whether it has a header. */
export interface TileOverlayProps {
  readonly tile: Tile;
  /** False when the tile has no header strip (no tileHeader, or the widget opted out with `header: false`) — a `header: false` widget still gets tileHeader as an overlay, just not this flag. */
  readonly hasHeader: boolean;
}

/** The shape of a host's `tileOverlay` component, passed to `BoardProvider`. */
export type TileOverlayComponent = ComponentType<TileOverlayProps>;

export const TileOverlayContext = createContext<TileOverlayComponent | null>(null);

// The wrapper (not the host component) carries data-bk-no-drag, so pressing host chrome here never starts a tile drag.
export function TileOverlay({ tile, hasHeader }: TileOverlayProps) {
  const Overlay = useContext(TileOverlayContext);
  if (!Overlay) return null;

  return (
    <div {...noDragProps()}>
      <Overlay tile={tile} hasHeader={hasHeader} />
    </div>
  );
}
