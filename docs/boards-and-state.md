# Boards & state

A board's entire state — every board page, tile, position, size and stack — is one plain,
serializable `BoardsState` value. `BoardProvider` can own it for you (uncontrolled) or you can own
it yourself (controlled), the same way as an `<input>`.

## Uncontrolled

Give `BoardProvider` a `storageKey` and/or `config.initialLayout` and it manages its own state:

```tsx
<BoardProvider config={boards} storageKey="my-board">
  <Board />
</BoardProvider>
```

With no `storageKey` (or nothing saved under it yet), the board starts from `initialLayout`, or
empty if there is none.

## Controlled

Pass `value` and `onChange` to own the state yourself — for undo stacks, syncing to a backend, or
driving several boards from one store:

```tsx
import { useState } from 'react';
import { BoardProvider, Board, type BoardsState } from 'boardkit-react';

function App() {
  const [state, setState] = useState<BoardsState>(() => boards.engine.empty());
  return (
    <BoardProvider config={boards} value={state} onChange={(next) => setState(next)}>
      <Board />
    </BoardProvider>
  );
}
```

`onChange`'s second argument is `ChangeMeta`: `{ reason: 'op', op, changes }` for a dispatched
action, `{ reason: 'reset' }` after `useResetBoards`, or `{ reason: 'reflow', changes }` for an automatic breakpoint reflow (see
[Layout & breakpoints](layout-and-breakpoints.md)) — useful for deciding what's worth persisting
or announcing.

## `initialLayout`

`defineBoards({ ..., initialLayout })` lists the widgets an uncontrolled board starts with:

```ts
const boards = defineBoards({
  grid: { cols: 6, rows: 4 },
  widgets: [clock, weather],
  initialLayout: [
    { widget: 'clock' },
    { widget: 'weather', size: '2x1', props: { city: 'Tokyo' } },
    { widget: 'clock', page: 1, at: [0, 0], name: 'Backup clock' },
    { widget: 'weather', float: { x: 1, y: 1 } },
    { widget: 'countdown', float: { x: 0.5, y: 0.5, free: true } },
  ],
});
```

- Give `at` (`[col, row]` or `{ x, y }`) to place a tile at an exact cell on the first page. Entries
  with `at` are placed first; if an authored cell clashes with an earlier one, that entry falls back
  to first-fit instead of pushing the earlier one aside.
- Omit `at`/`page` for first-fit placement — BoardKit packs tiles in reading order around the
  pinned ones and spills overflow onto new pages automatically.
- Give `page` to pin a tile onto a specific extra page instead (0-indexed after however many pages
  the default-placed entries used), optionally with `at` (`[col, row]` or `{ x, y }`) for an exact
  cell.
- Give `float` to start the tile already floating above the grid instead of on it: snapped into
  the Overlay layer at an integer `{ x, y }` by default, or unsnapped and collision-free with
  `free: true` and a fractional position. See [Floating tiles](layout-and-breakpoints.md#floating-tiles).
- `size`, `props` and `name` default to the widget's first size, `defaultProps`, and `title`.

`createInitialState(config)` builds the same `BoardsState` `initialLayout` produces, without a
provider — useful for a controlled board's initial `useState`, or a test fixture. Pass
`{ width }` to start on that width's breakpoint instead of the widest:

```ts
import { createInitialState } from 'boardkit-react';

const initial = createInitialState(boards);
const tablet = createInitialState(boards, { width: 700 });
```

### A layout per breakpoint

A breakpoint can carry its own `initialLayout`, authored for its own grid, instead of getting the
widest one reflowed onto it:

```ts
const boards = defineBoards({
  grid: [
    { minWidth: 1000, cols: 12, rows: 6 },
    {
      minWidth: 600, cols: 8, rows: 10,
      initialLayout: [
        { widget: 'liveView', size: '8x4', at: [0, 0] },
        { widget: 'jobs', size: '8x3', at: [0, 4] },
        { widget: 'robots', size: '4x3', at: [0, 7] },
        { widget: 'inspector', size: '4x3', at: [4, 7] },
      ],
    },
    { minWidth: 0, cols: 4, rows: 8 },
  ],
  widgets: [liveView, jobs, robots, inspector],
  initialLayout: [/* the 12×6 desktop layout */],
});
```

- The widest breakpoint uses its own `initialLayout` if it has one, else the top-level one.
- A breakpoint with an authored layout shows exactly that layout the first time it's reached. One
  without reflows from whichever breakpoint it switched from, as before.
- Every breakpoint shares the same widget instances: the same widget type listed in two layouts is
  one widget (matched by type, in order), with one set of props. A widget only one layout lists is
  still on every breakpoint, first-fit where it isn't authored.
- After that, each breakpoint remembers its own edits — see
  [Layout & breakpoints](layout-and-breakpoints.md#every-breakpoint-remembers-its-own-layout).

### Resetting

`useResetBoards()` returns a function that puts the board back to its authored layouts on every
breakpoint. It commits through `onChange` with `{ reason: 'reset' }`, so a controlled host's state
and a `storageKey` save both follow.

## `storageKey` and repair

With `storageKey`, a board saves its state to `localStorage` (debounced, flushed on `pagehide`). An
uncontrolled board also loads it back on mount; a controlled one starts from `loadBoards`:

```ts
const [state, setState] = useState(() => loadBoards(boards, 'my-board'));
```
 Loading never trusts what's there blindly: BoardKit parses
it and **repairs** anything that no longer validates — an out-of-bounds tile is relocated onto
free space instead of failing outright, and a tile referencing a widget type that's no longer
registered is dropped, with a dev-only console warning either way. A completely unparsable value
(corrupted JSON, wrong shape) falls back to `initialLayout` or empty, never a thrown error.

## `engine.parse` / `engine.repair`

The same repair BoardProvider does under the hood is available directly from `boards.engine` (or
any `Engine` from `createEngine`) for state you load yourself — from a backend response, a file,
anywhere that isn't `localStorage`:

```ts
const parsed = boards.engine.parse(rawJson);
if (parsed.ok) {
  // rawJson was already a valid BoardsState.
} else {
  const repaired = boards.engine.repair(rawJson);
  if (repaired.ok) {
    // repaired.value.state is usable; repaired.value also lists what was dropped/relocated.
  }
}
```

`parse` is strict — it never patches; `repair` runs whatever fixes it can and reports the result,
so you can log or surface exactly what changed. See [Engine](engine.md) for the full `Engine`
shape used without React at all.

## Next

- [Layout & breakpoints](layout-and-breakpoints.md) — responsive grids and reflow.
- [Chrome](chrome.md) — reacting to `onReject`, building an add-widget gallery.
- [API reference](api.md).
