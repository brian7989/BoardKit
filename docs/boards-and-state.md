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
action, or `{ reason: 'reflow', changes }` for an automatic breakpoint reflow (see
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

- Omit `at`/`page` for first-fit placement — BoardKit packs tiles in reading order and spills
  overflow onto new pages automatically.
- Give `page` to pin a tile onto a specific extra page instead (0-indexed after however many pages
  the default-placed entries used), optionally with `at` (`[col, row]` or `{ x, y }`) for an exact
  cell.
- Give `float` to start the tile already floating above the grid instead of on it: snapped into
  the Overlay layer at an integer `{ x, y }` by default, or unsnapped and collision-free with
  `free: true` and a fractional position. See [Floating tiles](layout-and-breakpoints.md#floating-tiles).
- `size`, `props` and `name` default to the widget's first size, `defaultProps`, and `title`.

`createInitialState(config)` builds the same `BoardsState` `initialLayout` produces, without a
provider — useful for a controlled board's initial `useState`, or a test fixture:

```ts
import { createInitialState } from 'boardkit-react';

const initial = createInitialState(boards);
```

## `storageKey` and repair

With `storageKey`, an uncontrolled board saves its state to `localStorage` (debounced, flushed on
`pagehide`) and loads it back on mount. Loading never trusts what's there blindly: BoardKit parses
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
