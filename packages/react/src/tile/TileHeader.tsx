import { createContext, useContext, type ComponentType } from 'react';
import type { Tile } from 'boardkit-core';
import type { TileHeaderPlacement } from './TileHeaderPlacement.js';

/** Props passed to a host's own `tileHeader` component: the tile, its display name, and where it renders. */
export interface TileHeaderProps {
  readonly tile: Tile;
  readonly name: string;
  readonly placement: TileHeaderPlacement;
}

/** The shape of a host's `tileHeader` component, passed to `BoardProvider`. */
export type TileHeaderComponent = ComponentType<TileHeaderProps>;

export const TileHeaderContext = createContext<TileHeaderComponent | null>(null);

/** Renders the host's header component for this tile. WidgetContainer reads TileHeaderContext
 * itself to size and place it, then delegates the actual content to this. */
export function TileHeader({ tile, name, placement }: TileHeaderProps) {
  const Header = useContext(TileHeaderContext);
  if (!Header) return null;
  return <Header tile={tile} name={name} placement={placement} />;
}
