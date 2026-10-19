import { memo, useContext, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { activeItem, isFloating, layerOf, OpType, TileLayer, type FractionalCell, type Tile as TileModel } from 'boardkit-core';
import { useBoardsConfig } from '../provider/internal/useBoardsConfig.js';
import type { BoardsConfigContextValue } from '../provider/internal/BoardsConfigContext.js';
import { useTilePointer, type UseDragGestureResult } from '../interaction/index.js';
import { DataAttr } from '../shared/index.js';
import { WidgetContainer, type WidgetContainerProps, type WidgetManifest } from '../widget/index.js';
import { tileStyle, type TilePosition } from './internal/tileStyle.js';
import {
  tileDataAttributes,
  tileFloatDataAttributes,
  tileInteractionDataAttributes,
  tileLiftedDataAttributes,
  tileStackDataAttributes,
} from './internal/tileDataAttributes.js';
import { useTileInteractionProps } from './internal/useTileInteractionProps.js';
import { useTilePickingMode } from './internal/useTilePickingMode.js';
import { TilePickingMode } from './internal/TilePickingMode.js';
import { useFloatDrag } from './internal/useFloatDrag.js';
import { TileContext, type TileComponent } from './TileContext.js';

interface TileFrameProps {
  readonly tile: TileModel;
}

// Constant, so the host's tile sees the same object every render.
const DRAG_HANDLE: Readonly<Record<string, string>> = { [DataAttr.DragHandle]: 'true' };

const INSTANT: CSSProperties = { transition: 'none' };

// No transition while held or Free: both follow the pointer every move, and an eased transition would chase the cursor.
function tileTransitionStyle(active: boolean, free: boolean, baseStyle: CSSProperties): CSSProperties {
  return active || free ? { ...baseStyle, ...INSTANT } : baseStyle;
}

function tilePosition(tile: TileModel, active: boolean, origin: FractionalCell | null): TilePosition {
  if (active && origin) return { col: origin.x, row: origin.y };
  if (tile.float) return { col: tile.float.x, row: tile.float.y };
  return { col: tile.col, row: tile.row };
}

interface DragTargets {
  readonly grid: boolean;
  readonly float: boolean;
}

// Grid and snapped Overlay tiles share the previewing drag; only Free tiles move directly.
function dragTargets(dragEnabled: boolean, free: boolean): DragTargets {
  return { grid: dragEnabled && !free, float: dragEnabled && free };
}

type PointerDownHandler = (event: ReactPointerEvent) => void;

interface DragChrome {
  readonly ref: RefObject<HTMLDivElement>;
  readonly onPointerDown: PointerDownHandler | undefined;
  readonly onContextMenu: (event: ReactMouseEvent) => void;
  readonly lifted: boolean;
}

interface DragChromeInput {
  readonly dragEnabled: boolean;
  readonly free: boolean;
  readonly grid: UseDragGestureResult;
  readonly float: UseDragGestureResult;
}

// Only one of grid/float is ever enabled for a tile, so it's safe to take whichever fired.
function dragChromeFor(input: DragChromeInput): DragChrome {
  const { dragEnabled, free, grid, float } = input;
  return {
    ref: free ? float.ref : grid.ref,
    onPointerDown: dragEnabled ? (free ? float.onPointerDown : grid.onPointerDown) : undefined,
    onContextMenu: free ? float.onContextMenu : grid.onContextMenu,
    lifted: grid.lifted || float.lifted,
  };
}

interface TileDomAttrsInput {
  readonly tile: TileModel;
  readonly active: boolean;
  readonly valid: boolean;
  readonly floating: boolean;
  readonly free: boolean;
  readonly lifted: boolean;
  readonly draggable: boolean;
  readonly pickingMode: TilePickingMode;
}

function tileDomAttrs(input: TileDomAttrsInput): Record<string, unknown> {
  const { tile, active, valid, floating, free, lifted, draggable, pickingMode } = input;
  return {
    ...tileInteractionDataAttributes(active, valid),
    ...tileStackDataAttributes(pickingMode),
    ...tileFloatDataAttributes(floating, free),
    ...tileLiftedDataAttributes(lifted),
    ...tileDataAttributes(tile),
    ...(draggable ? { [DataAttr.Draggable]: 'true' } : {}),
  };
}

function widgetContainerProps(tile: TileModel, config: BoardsConfigContextValue): WidgetContainerProps {
  const { widgets, locked, designCellSize, onWidgetError, dispatch, activeBoardId } = config;
  return {
    tile,
    widgets,
    cells: tile.size,
    locked,
    designCellSizePx: designCellSize,
    ...(onWidgetError ? { onWidgetError } : {}),
    setProps: (widget, props) => void dispatch({ type: OpType.SetWidgetProps, board: activeBoardId, tile: tile.id, widget, props }),
  };
}

function surfaceStyle(surface: WidgetManifest['surface']): CSSProperties {
  return { ...(surface?.background ? { background: surface.background } : {}), ...(surface?.color ? { color: surface.color } : {}) };
}

interface TileContentInput {
  readonly HostTile: TileComponent | null;
  readonly tile: TileModel;
  readonly widget: ReactNode;
  readonly manifest: WidgetManifest | undefined;
}

// No host tile: the widget alone fills the tile.
function tileContent({ HostTile, tile, widget, manifest }: TileContentInput): ReactNode {
  if (!HostTile) return widget;
  return <HostTile tile={tile} widget={widget} dragHandle={DRAG_HANDLE} surface={surfaceStyle(manifest?.surface)} header={manifest?.header !== false} />;
}

// Memoized so an unchanged tile skips re-rendering while siblings drag; the host's tile comes via
// TileContext (not `children`) so a fresh element every render can't defeat that memo.
function TileComponent({ tile }: TileFrameProps) {
  const config = useBoardsConfig();
  const floating = isFloating(tile);
  const free = layerOf(tile) === TileLayer.Free;
  const { enabled, dispatchAt, active, valid, origin } = useTileInteractionProps(tile.id, config.locked);
  const picking = useTilePickingMode(tile);
  const baseStyle = tileStyle(tilePosition(tile, active, origin), tile.size, config.grid);
  const dragEnabled = enabled && picking.mode === TilePickingMode.Idle;
  const targets = dragTargets(dragEnabled, free);
  const HostTile = useContext(TileContext);
  const manifest = config.widgets.get(activeItem(tile).type);
  const gridDrag = useTilePointer({ tile: tile.id, enabled: targets.grid, dispatchAt });
  const floatDrag = useFloatDrag({ tile: tile.id, board: config.activeBoardId, enabled: targets.float, origin: tile.float ?? { x: tile.col, y: tile.row } });
  const chrome = dragChromeFor({ dragEnabled, free, grid: gridDrag, float: floatDrag });

  return (
    <div
      ref={chrome.ref}
      style={tileTransitionStyle(active, free, baseStyle)}
      onPointerDown={chrome.onPointerDown}
      onContextMenu={chrome.onContextMenu}
      onClick={picking.onClick}
      {...tileDomAttrs({ tile, active, valid, floating, free, lifted: chrome.lifted, draggable: enabled, pickingMode: picking.mode })}
    >
      {tileContent({ HostTile, tile, widget: <WidgetContainer {...widgetContainerProps(tile, config)} />, manifest })}
    </div>
  );
}

export const Tile = memo(TileComponent);
