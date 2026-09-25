# boardkit-react

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
