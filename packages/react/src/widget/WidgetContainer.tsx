import { Suspense, useContext, type CSSProperties } from 'react';
import { activeItem, type Tile } from 'boardkit-core';
import { DataAttr } from '../shared/index.js';
import { TileHeader, TileHeaderContext } from '../tile/TileHeader.js';
import { TileHeaderPlacement } from '../tile/TileHeaderPlacement.js';
import { tileHeaderPlacementFor } from '../tile/tileHeaderPlacementFor.js';
import { designScale } from './designScale.js';
import { displayNameOf } from './displayNameOf.js';
import { useContainerSize } from './useContainerSize.js';
import { WidgetContext } from './useWidget.js';
import { WidgetErrorBoundary } from './WidgetErrorBoundary.js';
import type { WidgetManifest } from './WidgetManifest.js';
import type { WidgetProps } from './WidgetProps.js';

export interface WidgetContainerProps {
  readonly tile: Tile;
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly cells: { readonly w: number; readonly h: number };
  readonly locked: boolean;
  /** The widget's design canvas, in design px per cell (see `defineBoards`'s `designCellSize`). */
  readonly designCellSizePx: number;
  /** The tileHeader strip's fixed height, in design px (see `defineBoards`'s `headerHeight`). */
  readonly headerHeightPx: number;
  readonly onWidgetError?: (error: Error, widgetType: string) => void;
}

interface WidgetBodyProps {
  readonly tile: Tile;
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly cells: { readonly w: number; readonly h: number };
  readonly locked: boolean;
  readonly designSize: { readonly width: number; readonly height: number };
}

// Throws inside WidgetContainer's error boundary, so a missing manifest shows the fallback.
function WidgetBody({ tile, widgets, cells, locked, designSize }: WidgetBodyProps) {
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
  };

  return (
    <WidgetContext.Provider value={props}>
      <manifest.component {...props} />
    </WidgetContext.Provider>
  );
}

const CONTAINER_STYLE: CSSProperties = { containerType: 'size', overflow: 'hidden', width: '100%', height: '100%' };
const BODY_STYLE: CSSProperties = { flex: '1 1 auto', minHeight: 0, overflow: 'hidden' };

// Design px, not real screen px: the widget always sees the same fixed canvas (`width`/`height`),
// and `zoom` alone reconciles that canvas with however large the tile actually renders.
function innerStyle(width: number, height: number, zoom: number): CSSProperties {
  return { width: `${width}px`, height: `${height}px`, zoom, overflow: 'hidden' };
}

function frameStyle(surface: WidgetManifest['surface']): CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...(surface?.background ? { background: surface.background } : {}),
    ...(surface?.color ? { color: surface.color } : {}),
  };
}

function headerStripStyle(heightPx: number): CSSProperties {
  return { flex: `0 0 ${heightPx}px`, minHeight: 0 };
}

// Floats over the body instead of reserving space; pointer-events is off here so a click reaches
// the body wherever the host's own header content (which sets its own pointer-events: auto) isn't.
function headerOverlayStyle(heightPx: number): CSSProperties {
  return { position: 'absolute', top: 0, left: 0, right: 0, height: `${heightPx}px`, pointerEvents: 'none' };
}

function headerBoxStyle(placement: TileHeaderPlacement, heightPx: number): CSSProperties {
  return placement === TileHeaderPlacement.Strip ? headerStripStyle(heightPx) : headerOverlayStyle(heightPx);
}

interface BodySizeInput {
  readonly headerPlacement: TileHeaderPlacement | null;
  readonly width: number;
  readonly height: number;
  readonly headerHeightPx: number;
}

// Only a strip takes space from the body; an overlay header leaves the headerless widget's full design size intact.
function bodyDesignSize({ headerPlacement, width, height, headerHeightPx }: BodySizeInput): { readonly width: number; readonly height: number } {
  const stripped = headerPlacement === TileHeaderPlacement.Strip;
  return { width, height: stripped ? height - headerHeightPx : height };
}

interface TileFrameInput {
  readonly tile: Tile;
  readonly itemType: string;
  readonly manifest: WidgetManifest | undefined;
  readonly name: string;
  readonly headerPlacement: TileHeaderPlacement | null;
  readonly headerHeightPx: number;
  readonly onWidgetError?: (error: Error, widgetType: string) => void;
}

// Header and body share one frame so a host's CSS reads them as a single card; the header still
// sits outside the body's error boundary, so a crashed widget still shows its header and menu.
function TileFrame(input: TileFrameInput & WidgetBodyProps) {
  const { tile, widgets, cells, locked, designSize, itemType, manifest, name, headerPlacement, headerHeightPx, onWidgetError } = input;
  return (
    <div style={frameStyle(manifest?.surface)} data-bk-tile-frame="true">
      {headerPlacement ? (
        <div style={headerBoxStyle(headerPlacement, headerHeightPx)} data-bk-tile-header="true" data-bk-tile-header-placement={headerPlacement}>
          <TileHeader tile={tile} name={name} placement={headerPlacement} />
        </div>
      ) : null}
      <div style={BODY_STYLE} data-bk-tile-body="true">
        <WidgetErrorBoundary title={manifest?.title ?? itemType} onError={(error) => onWidgetError?.(error, itemType)}>
          <Suspense fallback={null}>
            <WidgetBody tile={tile} widgets={widgets} cells={cells} locked={locked} designSize={designSize} />
          </Suspense>
        </WidgetErrorBoundary>
      </div>
    </div>
  );
}

interface ScaledSize {
  readonly width: number;
  readonly height: number;
}

function tileFrameProps(props: WidgetContainerProps, headerPlacement: TileHeaderPlacement | null, scaled: ScaledSize): TileFrameInput & WidgetBodyProps {
  const { tile, widgets, cells, locked, headerHeightPx, onWidgetError } = props;
  const item = activeItem(tile);
  const manifest = widgets.get(item.type);
  return {
    tile,
    widgets,
    cells,
    locked,
    itemType: item.type,
    manifest,
    name: displayNameOf(item, manifest),
    headerPlacement,
    headerHeightPx,
    designSize: bodyDesignSize({ headerPlacement, ...scaled, headerHeightPx }),
    ...(onWidgetError ? { onWidgetError } : {}),
  };
}

// Clips here, not on the tile, so oversized widget content can't bleed into neighbors
// without also clipping the tile's drag shadow.
export function WidgetContainer(props: WidgetContainerProps) {
  const { tile, widgets, cells, designCellSizePx } = props;
  const manifest = widgets.get(activeItem(tile).type);
  const tileHeader = useContext(TileHeaderContext);
  const headerPlacement = tileHeaderPlacementFor(tileHeader !== null, manifest?.header);
  const [containerRef, containerSize] = useContainerSize<HTMLDivElement>();
  const { width, height, zoom } = designScale({
    cells,
    designCellSizePx,
    containerWidthPx: containerSize.width,
    containerHeightPx: containerSize.height,
  });

  return (
    <div ref={containerRef} style={CONTAINER_STYLE}>
      <div style={innerStyle(width, height, zoom)}>
        <TileFrame {...tileFrameProps(props, headerPlacement, { width, height })} />
      </div>
    </div>
  );
}
