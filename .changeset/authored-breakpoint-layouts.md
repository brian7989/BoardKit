---
"boardkit-core": patch
"boardkit-react": patch
---

- **Authored layouts per breakpoint**: a `GridBreakpoint` can carry its own `initialLayout`. The widest breakpoint uses its own layout (else the top-level `initialLayout`); every other breakpoint with one shows exactly that layout the first time it's reached, instead of the widest layout reflowed onto it. A breakpoint without one reflows as before. All breakpoints share one set of widgets: the same type in two layouts is one widget (matched by type, in order), and a widget only one layout lists is still on every breakpoint.
- **`at` is honoured on the first page**: `initialLayout` entries with `at` and no `page` are placed at exactly that cell first; the rest first-fit around them. Previously `at` was only honoured together with `page`.
- **`createInitialState(config, { width })`** starts on that width's breakpoint. It now also carries every authored breakpoint layout.
- **`useResetBoards()`** resets the board to its authored layouts on every breakpoint, committing with the new `ChangeReason.Reset`.
- **`loadBoards(config, storageKey)`**, and `storageKey` now saves controlled boards too, so a controlled host no longer needs its own persistence code.
- **`WidgetProps.setProps(patch)`** and the new `SetWidgetProps` op save per-widget view state (a table/cards toggle, say) with the board.
- **Existing saves keep loading unchanged**: the storage format is the same. A save from before this release restores the layouts it already remembered; a breakpoint it has no layout for reflows as before rather than switching to a newly authored one. `useResetBoards` (or clearing the save) picks up the authored layouts.
