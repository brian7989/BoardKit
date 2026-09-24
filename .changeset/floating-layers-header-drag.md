---
"boardkit-core": patch
"boardkit-react": patch
---

- **Drag from the header**: tiles with a `tileHeader` strip now drag only from that strip, so buttons, maps and scrollable content inside a widget no longer start a drag. Pass `dragFrom="tile"` to `BoardProvider` for the previous whole-tile behavior. Headerless tiles still drag from anywhere.
- **Snapped floating tiles**: floating tiles now snap to whole cells by default and push each other aside like grid tiles do, forming a second layer above the grid. They drag exactly like grid tiles too: smooth pointer tracking, a drop placeholder, a live preview of pushed tiles, and one save on release. Set `float: { x, y, free: true }` or call `useTile().float.setFree(true)` to let a tile move freely and overlap. Saved boards from 0.1.0 load with their floating tiles kept free, so nothing moves.
- **New op**: `SetFloatFree`.
- **Smoother floating drags on iOS Safari**: fixes the trail left behind while dragging a floating tile.
- **Fix: drags no longer cancel over images**: a quick first movement could leave an image under the original press point, which the browser grabbed for its own native drag and cancelled the tile drag.
