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

## Next

- [Chrome](chrome.md) — page dots via `useBoardList`, an add-widget gallery.
- [API reference](api.md).
