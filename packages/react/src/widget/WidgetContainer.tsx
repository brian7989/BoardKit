import { Suspense, type CSSProperties } from 'react';
import { activeItem, type Tile, type WidgetId } from 'boardkit-core';
import { DataAttr } from '../shared/index.js';
import { designScale } from './designScale.js';
import { displayNameOf } from './displayNameOf.js';
import { useContainerSize } from './useContainerSize.js';
import { WidgetContext } from './useWidget.js';
import { WidgetErrorBoundary } from './WidgetErrorBoundary.js';
import type { WidgetManifest } from './WidgetManifest.js';
import type { WidgetProps } from './WidgetProps.js';

/** Saves a props patch for one of this tile's widgets. */
export type SetWidgetProps = (widget: WidgetId, patch: Readonly<Record<string, unknown>>) => void;

export interface WidgetContainerProps {
  readonly tile: Tile;
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly cells: { readonly w: number; readonly h: number };
  readonly locked: boolean;
  /** The widget's design canvas, in design px per cell (see `defineBoards`'s `designCellSize`). */
  readonly designCellSizePx: number;
  readonly onWidgetError?: (error: Error, widgetType: string) => void;
  readonly setProps?: SetWidgetProps;
}

interface WidgetBodyProps {
  readonly tile: Tile;
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly cells: { readonly w: number; readonly h: number };
  readonly locked: boolean;
  readonly designSize: { readonly width: number; readonly height: number };
  readonly setProps?: SetWidgetProps;
}

// Throws inside WidgetContainer's error boundary, so a missing manifest shows the fallback.
function WidgetBody({ tile, widgets, cells, locked, designSize, setProps }: WidgetBodyProps) {
  const item = activeItem(tile);
  const manifest = widgets.get(item.type);
  if (!manifest) throw new Error(`Widget type "${item.type}" is not registered.`);

  const props: WidgetProps = {
    cells,
    designSize,
    props: { ...manifest.defaultProps, ...item.props },
    locked,
    isActive: true,
    name: displayNameOf(item, manifest),
    setProps: (patch) => setProps?.(item.id, patch),
  };

  return (
    <WidgetContext.Provider value={props}>
      <manifest.component {...props} />
    </WidgetContext.Provider>
  );
}

function containerStyle(surface: WidgetManifest['surface']): CSSProperties {
  return {
    containerType: 'size',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    ...(surface?.background ? { background: surface.background } : {}),
    ...(surface?.color ? { color: surface.color } : {}),
  };
}

// Design px, not real screen px: the widget always sees the same fixed canvas (`width`/`height`),
// and `zoom` alone reconciles that canvas with however large the box it's given actually is.
function innerStyle(width: number, height: number, zoom: number): CSSProperties {
  return { width: `${width}px`, height: `${height}px`, zoom, overflow: 'hidden' };
}

/** One tile's widget, scaled to fill whatever box it's placed in: the whole tile, or the body of a host's own tile. */
export function WidgetContainer(props: WidgetContainerProps) {
  const { tile, widgets, cells, locked, designCellSizePx, onWidgetError, setProps } = props;
  const itemType = activeItem(tile).type;
  const manifest = widgets.get(itemType);
  const [containerRef, containerSize] = useContainerSize<HTMLDivElement>();
  const { width, height, zoom } = designScale({ cells, designCellSizePx, containerWidthPx: containerSize.width, containerHeightPx: containerSize.height });

  return (
    <div ref={containerRef} style={containerStyle(manifest?.surface)} {...{ [DataAttr.TileBody]: 'true' }}>
      <div style={innerStyle(width, height, zoom)}>
        <WidgetErrorBoundary title={manifest?.title ?? itemType} onError={(error) => onWidgetError?.(error, itemType)}>
          <Suspense fallback={null}>
            <WidgetBody tile={tile} widgets={widgets} cells={cells} locked={locked} designSize={{ width, height }} {...(setProps ? { setProps } : {})} />
          </Suspense>
        </WidgetErrorBoundary>
      </div>
    </div>
  );
}
