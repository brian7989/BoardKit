# API reference

Every export of `boardkit-react`, one line each. See the linked guide for the full picture.

## Provider

| Export | What it is |
|---|---|
| `BoardProvider` | Owns board state (controlled or uncontrolled) and provides it to everything below it. |
| `BoardProviderProps` (type) | Its props: `config`, `value`/`onChange`, `storageKey` (saves controlled boards too), `tileOverlay`, `tileHeader`, `dragFrom`, `onReject`, ... |
| `defineBoards` | Builds the engine(s) and widget catalog once, from a grid (or breakpoints) and widget list. |
| `DefineBoardsInput` (type) | Input to `defineBoards`. |
| `BoardsConfig` (type) | What `defineBoards` returns and `BoardProvider` takes as `config`. |
| `createInitialState` | Builds the `BoardsState` an uncontrolled board would start from, without a provider, with every breakpoint's authored layout. Optional `{ width }` starts it on that width's breakpoint. |
| `CreateInitialStateOptions` (type) | `createInitialState`'s options: `width`. |
| `loadBoards` | What's saved under a `storageKey` (repaired), else `createInitialState` — a controlled board's starting state. |
| `useResetBoards` | Returns a function that resets the board to its authored layouts on every breakpoint. |
| `GridBreakpoint` (type) | One entry of a responsive grid: `minWidth`, `cols`, `rows`, optional `cellAspect`, optional `initialLayout`. |
| `ResolvedBreakpoint` (type) | A `GridBreakpoint` with its own engine already built. |
| `InitialLayoutTile` (type) | One widget an uncontrolled board starts with — see `defineBoards`'s `initialLayout`. |
| `ChangeMeta` (type) | `onChange`'s second argument: why the state changed (`'op'`, `'reflow'` or `'reset'`). |
| `ChangeReason` | The `ChangeMeta` reasons: `'op'`, `'reflow'` and `'reset'`. |
| `DragFrom` | Where a tile's drag may start: `'header'` (default, header strip only) or `'tile'` (anywhere). |
| `BoardsContextValue` (type) | The raw context value `useBoards` returns. |
| `useBoards` | Escape hatch: raw state, dispatch, active board, and the engine. |
| `useLocked` | Whether the board is currently read-only. |
| `useGrid` | The active breakpoint's `{ cols, rows, cellAspect }`. |
| `useBoardList` | Lists board pages, and switches/adds/removes them (`add` switches to the new board). |
| `BoardList` / `BoardListItem` (types) | `useBoardList`'s return shape, and one board page in it. |
| `useWidgetCatalog` | Lists registered widgets, and adds one to the active board. |
| `WidgetCatalog` / `AddWidgetOptions` (types) | `useWidgetCatalog`'s return shape, and options for `add`. |

## Board

| Export | What it is |
|---|---|
| `Board` | Renders the active board's grid, tiles, and widgets, with drag-and-drop for grid tiles and both floating layers (snapped Overlay, free). |
| `BoardProps` (type) | `Board`'s props: `board`, and `emptyState` shown when it has no tiles. |
| `useBoardTiles` | The active board's tiles, for a custom renderer in place of `<Board>`. |
| `useStackPicking` | Board-level status of an in-progress "stack with…" pick. |
| `StackPicking` (type) | `useStackPicking`'s return shape. |

## Tile

| Export | What it is |
|---|---|
| `useTile` | Facade over one tile's `size`, `float`, `stack`, `name`, `interaction`, `remove`. |
| `UseTileResult` (type) | `useTile`'s return shape. |
| `useTileSize` / `UseTileSizeResult` / `TileSizeOption` | A tile's current size, its options, and `set`/`canSet`. |
| `useTileFloat` / `UseTileFloatResult` | Whether a tile is floating (and snapped Overlay or Free), and `toggle`/`set`/`setFree`. |
| `useTileStack` / `UseTileStackResult` / `TileStackItem` | A tile's stacked items, and select/unstack/reorder/rename/combine actions. |
| `useTileName` / `UseTileNameResult` | A tile's current display name, and `set` to rename it. |
| `useTileInteraction` / `UseTileInteractionResult` | A tile's live drag/valid/locked state. |
| `useTileRemove` / `UseTileRemoveResult` | `remove` to delete a tile from its board. |
| `TilePickingMode` | A tile's role during a "stack with…" pick: idle/source/eligible/ineligible. |
| `TileOverlayProps` / `TileOverlayComponent` (types) | The props a `tileOverlay` component receives, and its component shape. |
| `TileHeaderProps` / `TileHeaderComponent` (types) | The props a `tileHeader` component receives, and its component shape. |

## Widget

| Export | What it is |
|---|---|
| `defineWidget` | Declares a widget's manifest — type, title, sizes, component, and options. |
| `WidgetManifest` (type) | A widget's registration, as `defineWidget` builds it. |
| `useWidget` | Reads the current widget's props/size/name/`designSize` from inside its own component tree. |
| `WidgetProps` (type) | What a widget component (and `useWidget`) receives. |

## Shared

| Export | What it is |
|---|---|
| `SizeInput` (type) | A `Size`, or a `'2x1'`-style string shorthand — accepted anywhere a size is. |
| `AtInput` (type) | A `[col, row]` tuple or `{ x, y }` point, in plain grid cells. |
| `noDragProps` | Spread onto a control to stop its own pointer gesture from also dragging the tile. |

## Rejections

| Export | What it is |
|---|---|
| `describeRejection` | One ready-to-show English line for a `Rejection`, exhaustive over `RejectReason`. |

## Re-exported from `boardkit-core`

| Export | What it is |
|---|---|
| `BoardsState` / `Tile` / `Size` / `Op` / `Rejection` / `Result` (types) | The core model and result types — see [Engine](engine.md). |
| `BoardId` / `TileId` / `WidgetId` / `Cell` / `Px` (types) | Branded value types for ids and units. |
| `OpType` | Every op's discriminant: `Move`, `Resize`, `Add`, `Remove`, `Stack`, `Unstack`, `SetActive`, `ReorderStack`, `RenameWidget`, `AddBoard`, `RemoveBoard`, `SetFloating`, `MoveFloating`, `SetFloatFree`, `SetWidgetProps`. |
| `RejectReason` | Why an op was rejected — out of bounds, no free space, size not allowed, stack incompatible, and so on. |
| `boardId` / `tileId` / `widgetId` / `cell` / `px` | Branded-value constructors for the ids and units above. |

## Next

- [Getting started](getting-started.md).
- [FAQ](faq.md).
