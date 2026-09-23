# boardkit-react

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
