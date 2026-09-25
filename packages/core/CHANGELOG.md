# boardkit-core

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
