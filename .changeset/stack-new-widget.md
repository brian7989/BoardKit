---
"boardkit-core": patch
"boardkit-react": patch
---

- **Stack a brand-new widget onto a tile**: `useTileStack(tile).addWidget(type, props?)` (also on `useTile(tile).stack`) adds a new widget to the tile's stack in one step and shows it. It needs no free grid space, and it's rejected with `SizeNotAllowed` if the widget doesn't allow the tile's size. `canAddWidget(type)` checks that up front for greying out a picker, and `canApply` works with it too.
- **New `StackNew` op**: `{ type: OpType.StackNew, board, onto, widget }`, the core op behind `addWidget`.
