# boardkit-react

## 0.2.0

### Minor Changes

- d186b92: **Bring your own tile.** `BoardProvider` takes a `tile` component that renders around every widget, in place of `tileHeader` and `tileOverlay`. It receives `{ tile, widget, dragHandle, surface, header }`: put `widget` wherever the body goes, spread `dragHandle` on the element the tile should drag by, and use `header` (false when a manifest says `header: false`) to decide what to leave out. A tile with a drag handle drags only from it; one without drags from anywhere. The widget measures the box it's given, so headers, borders and padding no longer need a `headerHeight`.
  
  **Saving a controlled board is the host's job.** New `restoreBoards(config, saved, options?)` turns whatever you saved (in Zustand's `persist`, a backend, anywhere) back into a valid state: migrated, repaired and on the breakpoint it was saved at, or the authored layouts when nothing usable was saved. `storageKey` now only saves uncontrolled boards.
  
  ### Migrating from 0.1
  
  - `tileHeader={Header}` → `tile={Card}`, where `Card` renders the header itself plus `{widget}`:
  
    ```tsx
    // Before
    function Header({ tile, name }: TileHeaderProps) {
      return <div>{name}<Menu tile={tile} /></div>;
    }
    <BoardProvider config={boards} tileHeader={Header}>
  
    // After
    function Card({ tile, widget, dragHandle, surface, header }: TileProps) {
      const { name } = useTile(tile);
      return (
        <div className="card" style={surface}>
          {header ? <div {...dragHandle}>{name.current}<Menu tile={tile} /></div> : null}
          <div className="card-body">{widget}</div>
        </div>
      );
    }
    <BoardProvider config={boards} tile={Card}>
    ```
  
  - `tileOverlay` is gone: render the same chrome inside your `tile`, wrapped in `noDragProps()`.
  - `dragFrom` is gone: render a `dragHandle` to drag from it only, or none to drag from anywhere.
  - `headerHeight` on `defineBoards` is gone, along with `TileHeaderProps`, `TileOverlayProps`, `TileHeaderPlacement` and `DragFrom`. The `data-bk-tile-frame`, `data-bk-tile-header` and `data-bk-drag-from` attributes are gone too; style your own tile instead.
  - `loadBoards(config, key)` → `restoreBoards(config, saved)`, where `saved` is what you stored. To keep reading an old `storageKey` save once: `restoreBoards(config, JSON.parse(localStorage.getItem(key) ?? 'null'))`.
  - A controlled board with `storageKey` no longer writes to `localStorage`; save it from `onChange` (or your store's persistence) instead.

## 0.1.6

### Patch Changes

- f75ba96: - **Fix: a widget no longer gets deleted by narrowing the window.** When a breakpoint's grid has no size a widget fits (a `4x2`-only widget on a 2-column phone grid), reflow used to delete it from the board for good, so widening again didn't bring it back and `storageKey` saved the loss. It's now parked: kept in the new `BoardsState.parked` list, hidden on that breakpoint, and restored (at its remembered spot when it has one) as soon as the board reaches a grid it fits. Saves without `parked` load as nothing parked.
  - **Fix: a floating tile could vanish on a breakpoint switch** when the restored layout didn't have the page it was on. It now moves to the first page instead.
  - **Duplicate ids are rejected, not thrown**: `Add`, `StackNew`, `AddBoard` and any op that would reuse a board, tile or widget id already in use (parked tiles included) now return a `DuplicateId` rejection, matching the engine's "returns a rejection, never throws" contract. `describeRejection` has a message for it.
  - **`initialLayout` sizes a widget doesn't allow** now fall back to its default size with a dev warning, instead of silently leaving the widget out.
- Updated dependencies [f75ba96]
  - boardkit-core@0.1.5

## 0.1.5

### Patch Changes

- ad1d2de: - **Fix: saves made at a narrower breakpoint were discarded on reload.** `storageKey` loading (and `loadBoards`) checked every save against the widest breakpoint's grid, so a board saved at any narrower breakpoint failed with a grid mismatch and silently fell back to the initial layout, and the next save then overwrote it. A save is now checked against the breakpoint whose grid it was made on. A save from a grid no breakpoint uses any more is repaired on its own grid and reflowed onto the widest, instead of being thrown away.
  - **Dev warning when a save can't be used**: if a save is still unusable, a development-only console warning names the storage key and the reason before the board starts from its initial layout.

## 0.1.4

### Patch Changes

- d3a54ab: - **Default stacks in `initialLayout`**: an entry's new `stack` lists more widgets (each with optional `props` and `name`) stacked under its own widget on the same tile, which shows the entry's widget first. Without a `size`, a stack takes the largest size every widget in it allows. Stacks are shared across breakpoints like any other widget, and a widget one layout stacks and another lists on its own is still one widget.
  - **`Add` op `stack`**: the core `Add` op takes an optional `stack` of extra widgets, adding a stacked tile in one step; it's rejected with `SizeNotAllowed` if any widget in it doesn't allow the size.
- 7926e3d: - **Stack a brand-new widget onto a tile**: `useTileStack(tile).addWidget(type, props?)` (also on `useTile(tile).stack`) adds a new widget to the tile's stack in one step and shows it. It needs no free grid space, and it's rejected with `SizeNotAllowed` if the widget doesn't allow the tile's size. `canAddWidget(type)` checks that up front for greying out a picker, and `canApply` works with it too.
  - **New `StackNew` op**: `{ type: OpType.StackNew, board, onto, widget }`, the core op behind `addWidget`.
- Updated dependencies [d3a54ab]
- Updated dependencies [7926e3d]
  - boardkit-core@0.1.4

## 0.1.3

### Patch Changes

- 282e244: - **Authored layouts per breakpoint**: a `GridBreakpoint` can carry its own `initialLayout`. The widest breakpoint uses its own layout (else the top-level `initialLayout`); every other breakpoint with one shows exactly that layout the first time it's reached, instead of the widest layout reflowed onto it. A breakpoint without one reflows as before. All breakpoints share one set of widgets: the same type in two layouts is one widget (matched by type, in order), and a widget only one layout lists is still on every breakpoint.
  - **`at` is honoured on the first page**: `initialLayout` entries with `at` and no `page` are placed at exactly that cell first; the rest first-fit around them. Previously `at` was only honoured together with `page`.
  - **`createInitialState(config, { width })`** starts on that width's breakpoint. It now also carries every authored breakpoint layout.
  - **`useResetBoards()`** resets the board to its authored layouts on every breakpoint, committing with the new `ChangeReason.Reset`.
  - **`loadBoards(config, storageKey)`**, and `storageKey` now saves controlled boards too, so a controlled host no longer needs its own persistence code.
  - **`WidgetProps.setProps(patch)`** and the new `SetWidgetProps` op save per-widget view state (a table/cards toggle, say) with the board.
  - **Existing saves keep loading unchanged**: the storage format is the same. A save from before this release restores the layouts it already remembered; a breakpoint it has no layout for reflows as before rather than switching to a newly authored one. `useResetBoards` (or clearing the save) picks up the authored layouts.
- Updated dependencies [282e244]
  - boardkit-core@0.1.3

## 0.1.2

### Patch Changes

- 223f3c3: - **Fix: crash when switching breakpoints after adding a tile**: a tile added on one breakpoint could take the saved spot of a tile being restored on another, and the board threw on the overlap. Saved positions are now restored first, and new tiles fill the space that is left.
- Updated dependencies [223f3c3]
  - boardkit-core@0.1.2

## 0.1.1

### Patch Changes

- d2ba2e7: - **Drag from the header**: tiles with a `tileHeader` strip now drag only from that strip, so buttons, maps and scrollable content inside a widget no longer start a drag. Pass `dragFrom="tile"` to `BoardProvider` for the previous whole-tile behavior. Headerless tiles still drag from anywhere.
  - **Snapped floating tiles**: floating tiles now snap to whole cells by default and push each other aside like grid tiles do, forming a second layer above the grid. They drag exactly like grid tiles too: smooth pointer tracking, a drop placeholder, a live preview of pushed tiles, and one save on release. Set `float: { x, y, free: true }` or call `useTile().float.setFree(true)` to let a tile move freely and overlap; free tiles stack above snapped ones and carry `data-bk-free`. Saved boards from 0.1.0 load with their floating tiles kept free, so nothing moves.
  - **New op**: `SetFloatFree`.
  - **Smoother floating drags on iOS Safari**: fixes the trail left behind while dragging a floating tile.
  - **Fix: drags no longer cancel over images**: a quick first movement could leave an image under the original press point, which the browser grabbed for its own native drag and cancelled the tile drag.
- Updated dependencies [d2ba2e7]
  - boardkit-core@0.1.1

## 0.1.0

Initial release of BoardKit for React: headless, iOS-home-screen-style widget boards.

- **Headless**: renders the grid, tiles and drag interaction; you bring the chrome through hooks and the `tileHeader` / `tileOverlay` slots.
- **Fixed design size**: every widget renders on a fixed-pixel canvas scaled to its cell, so widgets need no responsive CSS.
- **Responsive breakpoints**: pick a grid by container width; each breakpoint remembers its own arrangement.
- **Always draggable**: mouse and pen drag past a small threshold; touch uses a 250ms long-press so scrolling is never mistaken for a drag.
- **Resize, float and stack** tiles, plus multiple board pages.
- **Library-owned header strip** above each widget, overlaid for full-bleed widgets.
- **`initialLayout` and `storageKey`**: seed a board once, then persist it with repair-on-load.
- **Typed rejections** and `describeRejection` for friendly messages.
- **One package**: re-exports everything needed from `boardkit-core`.
- **SSR and Next.js ready**, with a default empty-board message.
