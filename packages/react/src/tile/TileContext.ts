import { createContext, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import type { Tile } from 'boardkit-core';

/** What a host's own `tile` component receives: the tile, its rendered widget, and drag/surface hooks. */
export interface TileProps {
  readonly tile: Tile;
  /** The widget, scaled to fill whatever box you put it in, inside its own error boundary. */
  readonly widget: ReactNode;
  /** Spread on whatever should start a drag. Leave it unused and the whole tile drags. */
  readonly dragHandle: Readonly<Record<string, string>>;
  /** The widget's own background and text colour, from its manifest's `surface`. */
  readonly surface: CSSProperties;
  /** False when the widget's manifest sets `header: false`: it wants to fill the whole tile. */
  readonly header: boolean;
}

/** The shape of a host's `tile` component, passed to `BoardProvider`. */
export type TileComponent = ComponentType<TileProps>;

export const TileContext = createContext<TileComponent | null>(null);
