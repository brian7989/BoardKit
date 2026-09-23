import { memo, useContext, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { activeItem, isFloating, type FractionalCell, type Tile as TileModel } from 'boardkit-core';
import { useBoardsConfig } from '../provider/internal/useBoardsConfig.js';
import type { BoardsConfigContextValue } from '../provider/internal/BoardsConfigContext.js';
import { useTilePointer, type UseDragGestureResult } from '../interaction/index.js';
import { DataAttr } from '../shared/index.js';
import { WidgetContainer, type WidgetContainerProps } from '../widget/index.js';
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
import { TileOverlay } from './TileOverlay.js';
import { TileHeaderContext } from './TileHeader.js';
import { TileHeaderPlacement } from './TileHeaderPlacement.js';
import { tileHeaderPlacementFor } from './tileHeaderPlacementFor.js';

export interface TileProps {
  readonly tile: TileModel;
}

const INSTANT: CSSProperties = { transition: 'none' };

// No transition while dragged/floating: every pointermove commits a new position, and an eased transition would chase the cursor.
function tileTransitionStyle(active: boolean, floating: boolean, baseStyle: CSSProperties): CSSProperties {
  return active || floating ? { ...baseStyle, ...INSTANT } : baseStyle;
}

function tilePosition(tile: TileModel, active: boolean, origin: FractionalCell | null): TilePosition {
  if (tile.float) return { col: tile.float.x, row: tile.float.y };
  if (active && origin) return { col: origin.x, row: origin.y };
  return { col: tile.col, row: tile.row };
}

interface DragTargets {
  readonly grid: boolean;
  readonly float: boolean;
}

function dragTargets(dragEnabled: boolean, floating: boolean): DragTargets {
  return { grid: dragEnabled && !floating, float: dragEnabled && floating };
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
  readonly floating: boolean;
  readonly grid: UseDragGestureResult;
  readonly float: UseDragGestureResult;
}

// Only one of grid/float is ever enabled for a tile, so it's safe to take whichever fired.
function dragChromeFor(input: DragChromeInput): DragChrome {
  const { dragEnabled, floating, grid, float } = input;
  return {
    ref: floating ? float.ref : grid.ref,
    onPointerDown: dragEnabled ? (floating ? float.onPointerDown : grid.onPointerDown) : undefined,
    onContextMenu: floating ? float.onContextMenu : grid.onContextMenu,
    lifted: grid.lifted || float.lifted,
  };
}

interface TileDomAttrsInput {
  readonly tile: TileModel;
  readonly active: boolean;
  readonly valid: boolean;
  readonly floating: boolean;
  readonly lifted: boolean;
  readonly draggable: boolean;
  readonly pickingMode: TilePickingMode;
}

function tileDomAttrs(input: TileDomAttrsInput): Record<string, unknown> {
  const { tile, active, valid, floating, lifted, draggable, pickingMode } = input;
  return {
    ...tileInteractionDataAttributes(active, valid),
    ...tileStackDataAttributes(pickingMode),
    ...tileFloatDataAttributes(floating),
    ...tileLiftedDataAttributes(lifted),
    ...tileDataAttributes(tile),
    ...(draggable ? { [DataAttr.Draggable]: 'true' } : {}),
  };
}

function widgetContainerProps(tile: TileModel, config: BoardsConfigContextValue): WidgetContainerProps {
  const { widgets, locked, designCellSize, headerHeight, onWidgetError } = config;
  return {
    tile,
    widgets,
    cells: tile.size,
    locked,
    designCellSizePx: designCellSize,
    headerHeightPx: headerHeight,
    ...(onWidgetError ? { onWidgetError } : {}),
  };
}

// Memoized so an unchanged tile skips re-rendering while siblings drag; chrome is injected via
// TileOverlayContext (not `children`) so a fresh element every render can't defeat that memo.
function TileComponent({ tile }: TileProps) {
  const config = useBoardsConfig();
  const floating = isFloating(tile);
  const { enabled, dispatchAt, active, valid, origin } = useTileInteractionProps(tile.id, config.locked);
  const picking = useTilePickingMode(tile);
  const baseStyle = tileStyle(tilePosition(tile, active, origin), tile.size, config.grid);
  const dragEnabled = enabled && picking.mode === TilePickingMode.Idle;
  const targets = dragTargets(dragEnabled, floating);
  const gridDrag = useTilePointer({ tile: tile.id, enabled: targets.grid, dispatchAt });
  const floatDrag = useFloatDrag({ tile: tile.id, board: config.activeBoardId, enabled: targets.float, origin: tile.float ?? { x: tile.col, y: tile.row } });
  const chrome = dragChromeFor({ dragEnabled, floating, grid: gridDrag, float: floatDrag });
  const tileHeader = useContext(TileHeaderContext);
  const manifest = config.widgets.get(activeItem(tile).type);
  const hasHeader = tileHeaderPlacementFor(tileHeader !== null, manifest?.header) === TileHeaderPlacement.Strip;

  return (
    <div
      ref={chrome.ref}
      style={tileTransitionStyle(active, floating, baseStyle)}
      onPointerDown={chrome.onPointerDown}
      onContextMenu={chrome.onContextMenu}
      onClick={picking.onClick}
      {...tileDomAttrs({ tile, active, valid, floating, lifted: chrome.lifted, draggable: enabled, pickingMode: picking.mode })}
    >
      <WidgetContainer {...widgetContainerProps(tile, config)} />
      <TileOverlay tile={tile} hasHeader={hasHeader} />
    </div>
  );
}

export const Tile = memo(TileComponent);
