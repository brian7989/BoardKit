import { useCallback, useMemo } from 'react';
import { isSizeAllowed, OpType, widgetId, type Applied, type Rejection, type Result, type Tile, type WidgetInstance } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';

/** Adding a brand-new widget to a tile's own stack. */
export interface TileStackAdd {
  // Adds a new widget of `type` to this tile's stack and shows it; rejects with SizeNotAllowed if it can't take the tile's size.
  readonly addWidget: (type: string, props?: Readonly<Record<string, unknown>>) => Result<Applied, Rejection>;
  // A cheap check for greying out a picker: no solver run, just whether `type` allows this tile's size.
  readonly canAddWidget: (type: string) => boolean;
}

function newWidget(manifest: WidgetManifest, props: Readonly<Record<string, unknown>> | undefined, id: string): WidgetInstance {
  const merged = { ...manifest.defaultProps, ...props };
  return { id: widgetId(id), type: manifest.type, ...(Object.keys(merged).length > 0 ? { props: merged } : {}) };
}

export function useTileStackAdd(tile: Tile): TileStackAdd {
  const { widgets, activeBoardId, dispatch, createId } = useBoardsConfig();
  const addWidget = useCallback(
    (type: string, props?: Readonly<Record<string, unknown>>) => {
      const manifest = widgets.get(type);
      if (!manifest) throw new Error(`Widget type "${type}" is not registered.`);
      return dispatch({ type: OpType.StackNew, board: activeBoardId, onto: tile.id, widget: newWidget(manifest, props, createId()) });
    },
    [widgets, activeBoardId, dispatch, createId, tile.id],
  );
  const canAddWidget = useCallback(
    (type: string) => {
      const manifest = widgets.get(type);
      return manifest !== undefined && isSizeAllowed(tile.size, manifest.sizes);
    },
    [widgets, tile.size],
  );
  return useMemo(() => ({ addWidget, canAddWidget }), [addWidget, canAddWidget]);
}
