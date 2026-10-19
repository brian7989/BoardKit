# Layout & breakpoints

## One grid, or several

One grid for every screen is `grid` plus `layout`:

```ts
const boards = defineBoards({ widgets, grid: '12x6', layout: [/* ... */] });
```

For different screens, name each breakpoint. `<Board>` measures its own container width and
switches onto the widest breakpoint whose `minWidth` it satisfies: no media queries, no app code
picking a grid.

```ts
const boards = defineBoards({
  widgets: [liveView, jobs, robots, requestors, alerts, inspector],
  breakpoints: {
    wall: {
      minWidth: 1800, grid: '16x8', cellAspect: 1.125,
      layout: [
        { widget: 'liveView',   size: '8x6', at: [0, 0] },
        { widget: 'jobs',       size: '8x2', at: [0, 6] },
        { widget: 'robots',     size: '4x4', at: [8, 0] },
        { widget: 'requestors', size: '4x4', at: [8, 4] },
        { widget: 'alerts',     size: '4x4', at: [12, 0] },
        { widget: 'inspector',  size: '4x4', at: [12, 4] },
      ],
    },
    laptop: {
      minWidth: 1000, grid: '12x6', cellAspect: 0.8,
      hide: ['requestors', 'alerts'],
      layout: [
        { widget: 'liveView',  size: '8x4', at: [0, 0] },
        { widget: 'jobs',      size: '8x2', at: [0, 4] },
        { widget: 'inspector', size: '4x3', at: [8, 0] },
        { widget: 'robots',    size: '4x3', at: [8, 3] },
      ],
    },
    tablet: { minWidth: 600, grid: '8x10' },
    phone: {
      minWidth: 0, grid: '4x12', cellAspect: 1.5,
      hide: ['requestors', 'alerts'],
      layout: [
        { widget: 'liveView',  size: '4x4', at: [0, 0] },
        { widget: 'inspector', size: '4x4', at: [0, 4] },
        { widget: 'jobs',      size: '4x4', at: [0, 8], stack: [{ widget: 'robots' }] },
      ],
    },
  },
});
```

- `grid` is `'cols x rows'` (or `{ cols, rows }`). `cellAspect` is a cell's width ÷ height: 1 (the
  default) is square, 2 is twice as wide as tall.
- Each breakpoint's `layout` is authored for its own grid and shows exactly as written the first
  time the board reaches it. Entries are checked against `widgets` like any layout (see
  [Boards & state](boards-and-state.md#layout)).
- A breakpoint without a `layout` starts from the nearest wider breakpoint's (else the nearest
  narrower one's), reflowed onto its grid: `tablet` above always starts from `laptop`, whichever
  breakpoint the board arrives from.
- Every breakpoint shares the same widgets: a widget listed in two layouts is one widget (matched by
  type, in order), with one set of props. How they're arranged is per breakpoint, stacks included:
  the phone above stacks `jobs` and `robots` on one tile, while the wall keeps them apart.
- `useGrid().name` says which breakpoint is active.

### `hide`

`hide` leaves widgets off one breakpoint. They aren't deleted: they're parked there and show again
on any breakpoint that doesn't hide them, so `requestors` and `alerts` above are on the wall and
nowhere else. A breakpoint without a `layout` can `hide` too, on top of what the breakpoint it
starts from hides. Hiding a stack takes every widget in it.

### Dev warnings

In development, `defineBoards` warns about a widget one layout lists but another neither lists nor
hides. It still goes on that breakpoint, at the first free spot, and the warning names the page it
landed on.

## Every breakpoint remembers its own layout

Switching breakpoints doesn't just rescale the same arrangement onto a different grid: each
breakpoint keeps its **own** arrangement, edits included. Go from the wall down to the phone and
back up, and the wall arrangement you left is exactly what comes back.

The rule is: a widget's **content** is shared, and its **arrangement** is per breakpoint.

- **Shared:** the widget itself, its props and its name. Rename a widget on the phone, and it's
  renamed on the wall. Remove it anywhere, and it's gone everywhere. Add one anywhere, and every
  breakpoint gets it.
- **Per breakpoint:** position, size, floating, hidden, which widgets share a tile, and which one a
  stack shows. Stack two widgets on the phone, and the wall keeps them apart.

A widget stacked onto a tile on one breakpoint joins the tile its stack-mates are on everywhere
else too (or gets a tile of its own where that tile is a size it doesn't allow).

When tiles no longer fit a breakpoint (a widget's size isn't valid at the new grid, or there's no
room), BoardKit **reflows**: it repacks them in reading order and spills overflow onto new pages.
Either way, the result commits through the normal `value`/`onChange` path like any other change,
with `meta.reason` set to `'reflow'` — see [Boards & state](boards-and-state.md) for `ChangeMeta`.

A widget with no size that fits a breakpoint's grid at all (a `4x2`-only widget on a 2-column phone
grid, say) is parked there the same way `hide` parks one, and put back (at its remembered spot,
when it has one) as soon as the board switches to a grid it fits. Its reflow change is reported
with kind `'dropped'`.

## `useGrid`

Reads the active breakpoint's name and grid from inside a provider:

```tsx
import { useGrid } from 'boardkit-react';

function TileGap() {
  const { name } = useGrid();
  const gap = name === 'phone' ? '8px' : '12px';
  return <div style={{ '--bk-tile-gap': gap } as React.CSSProperties} />;
}
```

Useful for anything that should track the active breakpoint: a tighter gap on the phone, a label
showing the current column count, and so on. A single `grid` is named `'default'`.

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

`useWidgetCatalog().add` and layout entries both take the same `float` shape:

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

Dragging works from the tile's drag handle, or anywhere on a tile without one. A Free
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
