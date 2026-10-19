# boardkit-core

## 0.3.0

### Minor Changes

- 7fb4a61: **Stacks per breakpoint.** Each breakpoint now keeps its own stacks, along with its own positions: a phone layout can stack `jobs` and `robots` on one tile while the wall keeps them apart, whether that's authored in `layout` or done by the user on that breakpoint.
  
  The rule: a widget's content (the widget, its props, its name) is shared by every breakpoint; its arrangement (position, size, floating, hidden, which widgets share a tile, and which one a stack shows) is per breakpoint. A widget stacked onto a tile on one breakpoint joins the tile its stack-mates are on everywhere else (or gets a tile of its own where that tile is a size it doesn't allow).
  
  The dev warning about layouts that stack differently is gone, since they now just work.
  
  Core: a saved layout entry records its tile's widgets (`items`) and which one shows (`active`), and reflow rebuilds each breakpoint's tiles from them. Saves without them keep each tile's widgets as before.
  
  ### Upgrading from 0.3
  
  Stacking or unstacking on one breakpoint no longer changes the others. Nothing else changes, and existing saves load as they are.

## 0.2.0

### Minor Changes

- 5871bdc: **Named breakpoints, each with its own layout.** `defineBoards` takes `breakpoints: { name: { minWidth, grid, cellAspect?, layout?, hide? } }`, or a single `grid` + `layout`. Grids are `'12x6'` strings (or `{ cols, rows }`). Every breakpoint owns its layout, with no special top-level one, and `useGrid().name` says which one is active.
  
  **Layouts are type-checked.** `defineWidget` now infers each widget's type name and sizes along with its props, so a layout entry's `widget`, `size`, `props` and a breakpoint's `hide` are editor errors when wrong. A `{ w, h }` size isn't checked per widget, for layouts you compute.
  
  **`hide`** leaves widgets off one breakpoint: parked there, shown on every breakpoint that doesn't hide them.
  
  **Breakpoints without a layout always start the same way**, from the nearest wider breakpoint's layout (else the nearest narrower one's), instead of from whichever breakpoint the board happened to come from.
  
  **Dev warnings** when a layout neither lists nor hides a widget another layout has (naming the page it landed on), and when a layout stacks widgets differently from the widest one. A widget only a narrower layout stacks is no longer lost.
  
  Core: a saved layout entry can be `hidden`, and `hideTiles(state, tiles)` parks tiles on the current grid.
  
  ### Migrating from 0.2
  
  ```ts
  // Before
  defineBoards({
    grid: [
      { minWidth: 1000, cols: 12, rows: 6, initialLayout: [/* laptop */] },
      { minWidth: 0, cols: 4, rows: 12 },
    ],
    widgets,
    initialLayout: [/* the widest */],
  });
  
  // After
  defineBoards({
    widgets,
    breakpoints: {
      laptop: { minWidth: 1000, grid: '12x6', layout: [/* laptop */] },
      phone: { minWidth: 0, grid: '4x12' },
    },
  });
  ```
  
  - `grid: [...]` → `breakpoints: { name: {...} }`, with `cols`/`rows` → `grid: 'COLSxROWS'` and `initialLayout` → `layout`. The old top-level `initialLayout` goes in the widest breakpoint.
  - One grid: `initialLayout` → `layout`.
  - Types: `GridBreakpoint` → `BreakpointInput`, `InitialLayoutTile` → `LayoutEntry`, `InitialStackItem` → `LayoutStackEntry`. Type a layout array you build yourself as `LayoutEntry<(typeof widgets)[number]>[]`.
  - `defineWidget<Props>(...)` still works, but layouts then accept any name and size for that widget; type the component's props instead and let `defineWidget` infer.

## 0.1.5

### Patch Changes

- f75ba96: - **Fix: a widget no longer gets deleted by narrowing the window.** When a breakpoint's grid has no size a widget fits (a `4x2`-only widget on a 2-column phone grid), reflow used to delete it from the board for good, so widening again didn't bring it back and `storageKey` saved the loss. It's now parked: kept in the new `BoardsState.parked` list, hidden on that breakpoint, and restored (at its remembered spot when it has one) as soon as the board reaches a grid it fits. Saves without `parked` load as nothing parked.
  - **Fix: a floating tile could vanish on a breakpoint switch** when the restored layout didn't have the page it was on. It now moves to the first page instead.
  - **Duplicate ids are rejected, not thrown**: `Add`, `StackNew`, `AddBoard` and any op that would reuse a board, tile or widget id already in use (parked tiles included) now return a `DuplicateId` rejection, matching the engine's "returns a rejection, never throws" contract. `describeRejection` has a message for it.
  - **`initialLayout` sizes a widget doesn't allow** now fall back to its default size with a dev warning, instead of silently leaving the widget out.

## 0.1.4

### Patch Changes

- d3a54ab: - **Default stacks in `initialLayout`**: an entry's new `stack` lists more widgets (each with optional `props` and `name`) stacked under its own widget on the same tile, which shows the entry's widget first. Without a `size`, a stack takes the largest size every widget in it allows. Stacks are shared across breakpoints like any other widget, and a widget one layout stacks and another lists on its own is still one widget.
  - **`Add` op `stack`**: the core `Add` op takes an optional `stack` of extra widgets, adding a stacked tile in one step; it's rejected with `SizeNotAllowed` if any widget in it doesn't allow the size.
- 7926e3d: - **Stack a brand-new widget onto a tile**: `useTileStack(tile).addWidget(type, props?)` (also on `useTile(tile).stack`) adds a new widget to the tile's stack in one step and shows it. It needs no free grid space, and it's rejected with `SizeNotAllowed` if the widget doesn't allow the tile's size. `canAddWidget(type)` checks that up front for greying out a picker, and `canApply` works with it too.
  - **New `StackNew` op**: `{ type: OpType.StackNew, board, onto, widget }`, the core op behind `addWidget`.

## 0.1.3

### Patch Changes

- 282e244: - **Authored layouts per breakpoint**: a `GridBreakpoint` can carry its own `initialLayout`. The widest breakpoint uses its own layout (else the top-level `initialLayout`); every other breakpoint with one shows exactly that layout the first time it's reached, instead of the widest layout reflowed onto it. A breakpoint without one reflows as before. All breakpoints share one set of widgets: the same type in two layouts is one widget (matched by type, in order), and a widget only one layout lists is still on every breakpoint.
  - **`at` is honoured on the first page**: `initialLayout` entries with `at` and no `page` are placed at exactly that cell first; the rest first-fit around them. Previously `at` was only honoured together with `page`.
  - **`createInitialState(config, { width })`** starts on that width's breakpoint. It now also carries every authored breakpoint layout.
  - **`useResetBoards()`** resets the board to its authored layouts on every breakpoint, committing with the new `ChangeReason.Reset`.
  - **`loadBoards(config, storageKey)`**, and `storageKey` now saves controlled boards too, so a controlled host no longer needs its own persistence code.
  - **`WidgetProps.setProps(patch)`** and the new `SetWidgetProps` op save per-widget view state (a table/cards toggle, say) with the board.
  - **Existing saves keep loading unchanged**: the storage format is the same. A save from before this release restores the layouts it already remembered; a breakpoint it has no layout for reflows as before rather than switching to a newly authored one. `useResetBoards` (or clearing the save) picks up the authored layouts.

## 0.1.2

### Patch Changes

- 223f3c3: - **Fix: crash when switching breakpoints after adding a tile**: a tile added on one breakpoint could take the saved spot of a tile being restored on another, and the board threw on the overlap. Saved positions are now restored first, and new tiles fill the space that is left.

## 0.1.1

### Patch Changes

- d2ba2e7: - **Drag from the header**: tiles with a `tileHeader` strip now drag only from that strip, so buttons, maps and scrollable content inside a widget no longer start a drag. Pass `dragFrom="tile"` to `BoardProvider` for the previous whole-tile behavior. Headerless tiles still drag from anywhere.
  - **Snapped floating tiles**: floating tiles now snap to whole cells by default and push each other aside like grid tiles do, forming a second layer above the grid. They drag exactly like grid tiles too: smooth pointer tracking, a drop placeholder, a live preview of pushed tiles, and one save on release. Set `float: { x, y, free: true }` or call `useTile().float.setFree(true)` to let a tile move freely and overlap; free tiles stack above snapped ones and carry `data-bk-free`. Saved boards from 0.1.0 load with their floating tiles kept free, so nothing moves.
  - **New op**: `SetFloatFree`.
  - **Smoother floating drags on iOS Safari**: fixes the trail left behind while dragging a floating tile.
  - **Fix: drags no longer cancel over images**: a quick first movement could leave an image under the original press point, which the browser grabbed for its own native drag and cancelled the tile drag.

## 0.1.0

Initial release of the pure layout engine behind BoardKit.

- **Zero dependencies**: no DOM, no React, no runtime dependencies.
- **Ops-based API**: every action returns an updated state or a typed rejection, never throws.
- **Exact collision solver**: moves the fewest tiles, then the shortest distance, with fast rejection of impossible layouts.
- **Serializable state** with parse, validate and repair, plus per-breakpoint layouts and reflow.
- **Floating tiles, stacks and multiple boards.**
