---
'boardkit-react': minor
'boardkit-core': minor
---

**Named breakpoints, each with its own layout.** `defineBoards` takes `breakpoints: { name: { minWidth, grid, cellAspect?, layout?, hide? } }`, or a single `grid` + `layout`. Grids are `'12x6'` strings (or `{ cols, rows }`). Every breakpoint owns its layout, with no special top-level one, and `useGrid().name` says which one is active.

**Layouts are type-checked.** `defineWidget` now infers each widget's type name and sizes along with its props, so a layout entry's `widget`, `size`, `props` and a breakpoint's `hide` are editor errors when wrong. A `{ w, h }` size isn't checked per widget, for layouts you compute.

**`hide`** leaves widgets off one breakpoint: parked there, shown on every breakpoint that doesn't hide them.

**Breakpoints without a layout always start the same way**, from the nearest wider breakpoint's layout (else the nearest narrower one's), instead of from whichever breakpoint the board happened to come from.

**Dev warnings** when a layout neither lists nor hides a widget another layout has (naming the page it landed on), and when a layout stacks widgets differently from the widest one. A widget only a narrower layout stacks is no longer lost.

Core: a saved layout entry can be `hidden`, and `hideTiles(state, tiles)` parks tiles on the current grid.

### Migrating from 0.2

```ts
// Before
defineBoards({
  grid: [
    { minWidth: 1000, cols: 12, rows: 6, initialLayout: [/* laptop */] },
    { minWidth: 0, cols: 4, rows: 12 },
  ],
  widgets,
  initialLayout: [/* the widest */],
});

// After
defineBoards({
  widgets,
  breakpoints: {
    laptop: { minWidth: 1000, grid: '12x6', layout: [/* laptop */] },
    phone: { minWidth: 0, grid: '4x12' },
  },
});
```

- `grid: [...]` → `breakpoints: { name: {...} }`, with `cols`/`rows` → `grid: 'COLSxROWS'` and `initialLayout` → `layout`. The old top-level `initialLayout` goes in the widest breakpoint.
- One grid: `initialLayout` → `layout`.
- Types: `GridBreakpoint` → `BreakpointInput`, `InitialLayoutTile` → `LayoutEntry`, `InitialStackItem` → `LayoutStackEntry`. Type a layout array you build yourself as `LayoutEntry<(typeof widgets)[number]>[]`.
- `defineWidget<Props>(...)` still works, but layouts then accept any name and size for that widget; type the component's props instead and let `defineWidget` infer.
