# Layout & breakpoints

## One grid, or several

`defineBoards`'s `grid` takes either a single `{ cols, rows }`, or an array of breakpoints, widest
first isn't required — BoardKit sorts them itself:

```ts
const boards = defineBoards({
  grid: [
    { minWidth: 900, cols: 6, rows: 4 },
    { minWidth: 480, cols: 4, rows: 5 },
    { minWidth: 0, cols: 2, rows: 4 },
  ],
  widgets: [clock, weather],
});
```

`<Board>` measures its own container width and switches onto whichever breakpoint's `minWidth` it
currently satisfies — no app code picks a grid by viewport width, and no media queries are
involved. Each breakpoint gets its own engine, sized for its own `cols`/`rows`.

## Every breakpoint remembers its own layout

Switching breakpoints doesn't just rescale the same arrangement onto a different grid — each
breakpoint keeps its **own** remembered tile positions. Go from the 6×4 desktop grid down to the
2×4 phone grid and back up, and the 6×4 arrangement you left is exactly what comes back, not a
repacked approximation.

The first time a breakpoint is seen, or when tiles no longer fit it (a widget's size isn't valid
at the new grid, or there's no room), BoardKit **reflows**: it repacks tiles in reading order and
spills overflow onto new pages. Either way, the result commits through the normal
`value`/`onChange` path like any other change, with `meta.reason` set to `'reflow'` — see
[Boards & state](boards-and-state.md) for `ChangeMeta`.

## `useGrid`

Reads the active breakpoint's resolved grid from inside a provider:

```tsx
import { useGrid } from 'boardkit-react';

function TileGap() {
  const { cols, rows, cellAspect } = useGrid();
  const gap = cols <= 2 ? '8px' : '12px';
  return <div style={{ '--bk-tile-gap': gap } as React.CSSProperties} />;
}
```

Useful for anything that should track the active grid — a tighter gap on the phone breakpoint, a
label showing the current column count, and so on.

## `--bk-tile-gap`

The CSS custom property BoardKit's stylesheet reads for the gutter between tiles (default `0px`).
Set it on any ancestor of `<Board>`, optionally varying it by breakpoint as above:

```css
.board-area {
  --bk-tile-gap: 12px;
}
```

See [Styling](styling.md) for the rest of the CSS surface.

## Floating tiles

A floating tile sits above the grid instead of in it, in one of two layers:

- **Overlay** (the default) — snapped to an integer cell, and collision-checked against other
  Overlay tiles only: they push each other out of the way like ordinary grid tiles, but they never
  collide with the grid underneath. Good for a panel that should stay tidy and non-overlapping —
  robot or job details over a live map, say.
- **Free** (opt in with `free: true`) — an unsnapped, fractional position with no collision against
  anything, on any layer. Good for something a person drags around freely, like a picture-in-
  picture video.

Non-floating tiles are unaffected either way — the grid's own solver never even looks at floaters.

### Adding a floating tile

`useWidgetCatalog().add` and `initialLayout` entries both take the same `float` shape:

```ts
// Snapped into the Overlay layer at (2, 1), pushing whatever Overlay tile is already there.
catalog.add('robotDetail', { float: { x: 2, y: 1 } });

// Free: unsnapped, fractional, never collides with anything.
catalog.add('miniPlayer', { float: { x: 4.5, y: 0.5, free: true } });
```

A snapped `add` that can't fit at the requested cell (even after pushing) falls back to the first
free Overlay spot, and only rejects (`NoFreeSpace`/`NoValidArrangement`) if the whole layer is full.
A `free` add always succeeds, clamped onto the board.

### Moving between layers

`useTile(tile).float` gives a tile's own floating state and actions:

```tsx
const { float } = useTile(tile);

float.isFloating; // true once it's floating, in either layer
float.isFree; // true for Free, false for a snapped Overlay tile
float.toggle(); // grid ↔ floating (enters/leaves the Overlay layer)
float.setFree(true); // snapped → free, in place
float.setFree(false); // free → snapped, rounding onto the Overlay layer's solver
```

Dragging works from anywhere `dragFrom` allows (the whole tile, or just its header strip). A Free
tile follows the pointer and lands wherever it is dropped. A snapped Overlay tile drags exactly like
a grid tile: it follows the pointer smoothly while a placeholder marks the cell it will land on,
other Overlay tiles slide aside (and back, if you move on), and nothing is saved until release. An
impossible drop snaps the tile back.

Resizing, reflow onto a different breakpoint, and reloading saved state all stay layer-aware: an
Overlay tile that can no longer fit its layer shrinks to a smaller allowed size first, and only
becomes Free (clamped onto the board) as a last resort — it's never dropped for being floating.

## Next

- [Chrome](chrome.md) — page dots via `useBoardList`, an add-widget gallery.
- [API reference](api.md).
