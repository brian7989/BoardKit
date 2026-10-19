# Boards & state

A board's entire state — every board page, tile, position, size and stack — is one plain,
serializable `BoardsState` value. `BoardProvider` can own it for you (uncontrolled) or you can own
it yourself (controlled), the same way as an `<input>`.

## Uncontrolled

Give `BoardProvider` a `storageKey` and/or a config with a `layout` and it manages its own state:

```tsx
<BoardProvider config={boards} storageKey="my-board">
  <Board />
</BoardProvider>
```

With no `storageKey` (or nothing saved under it yet), the board starts from its layouts, or
empty if there are none.

## Controlled

Pass `value` and `onChange` to own the state yourself — to keep it in your own store (Zustand,
Redux), sync it to a backend, or drive several boards from one store:

```tsx
import { useState } from 'react';
import { BoardProvider, Board, createInitialState, type BoardsState } from 'boardkit-react';

function App() {
  const [state, setState] = useState<BoardsState>(() => createInitialState(boards));
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
or announcing. To save a controlled board and load it back, see [Saving boards](#saving-boards).

## `layout`

`defineBoards({ ..., layout })` lists the widgets an uncontrolled board starts with (with
breakpoints, each breakpoint has its own `layout`; see
[Layout & breakpoints](layout-and-breakpoints.md)):

```ts
const boards = defineBoards({
  widgets: [clock, weather, countdown, stocks, crypto],
  grid: '6x4',
  layout: [
    { widget: 'clock' },
    { widget: 'weather', size: '2x1', props: { city: 'Tokyo' } },
    { widget: 'clock', page: 1, at: [0, 0], name: 'Backup clock' },
    { widget: 'weather', float: { x: 1, y: 1 } },
    { widget: 'countdown', float: { x: 0.5, y: 0.5, free: true } },
    { widget: 'stocks', size: '2x1', stack: [{ widget: 'crypto' }, { widget: 'stocks', props: { symbol: 'NVDA' }, name: 'NVDA' }] },
  ],
});
```

- `widget`, `size` and `props` are type-checked against `widgets`: a typo in a widget's name, a
  size it doesn't list, or a prop of the wrong type is an editor error. (A `{ w, h }` size isn't
  checked per widget, which is handy for layouts you compute.)
- Give `at` (`[col, row]` or `{ x, y }`) to place a tile at an exact cell on the first page. Entries
  with `at` are placed first; if an authored cell clashes with an earlier one, that entry falls back
  to first-fit instead of pushing the earlier one aside.
- Omit `at`/`page` for first-fit placement — BoardKit packs tiles in reading order around the
  pinned ones and spills overflow onto new pages automatically.
- Give `page` to pin a tile onto a specific extra page instead (0-indexed after however many pages
  the default-placed entries used), optionally with `at` for an exact cell.
- Give `float` to start the tile already floating above the grid instead of on it: snapped into
  the Overlay layer at an integer `{ x, y }` by default, or unsnapped and collision-free with
  `free: true` and a fractional position. See [Floating tiles](layout-and-breakpoints.md#floating-tiles).
- Give `stack` to start the tile as a stack: the entry's own widget shows first, and the `stack`
  widgets (each with optional `props` and `name`) sit under it on the same tile. Every widget in a
  stack must allow the tile's size; without a `size`, the stack takes the largest one they all
  allow.
- `size`, `props` and `name` default to the widget's first size, `defaultProps`, and `title`.

`createInitialState(config)` builds the same `BoardsState` the layouts produce, without a
provider — useful for a controlled board's initial `useState`, or a test fixture. Pass
`{ width }` to start on that width's breakpoint instead of the widest:

```ts
import { createInitialState } from 'boardkit-react';

const initial = createInitialState(boards);
const tablet = createInitialState(boards, { width: 700 });
```

### Resetting

`useResetBoards()` returns a function that puts the board back to its authored layouts on every
breakpoint. It commits through `onChange` with `{ reason: 'reset' }`, so a controlled host's state
(and whatever saves it) or a `storageKey` save follows.

## Saving boards

### Uncontrolled: `storageKey`

With `storageKey`, an uncontrolled board saves its state to `localStorage` (debounced, flushed on
`pagehide`) and loads it back on mount.

```tsx
<BoardProvider config={boards} storageKey="my-board">
```

### Controlled: you save it, `restoreBoards` loads it

A controlled board's state is yours, so saving it is too: in Zustand, a backend, anywhere. BoardKit
owns the format; the state is plain JSON, safe to store as-is. `storageKey` is ignored on a
controlled board. When loading it back, run it through `restoreBoards`:

```ts
const state = restoreBoards(boards, savedValue);
```

With Zustand's `persist`, that goes in `merge`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { restoreBoards, type BoardsState } from 'boardkit-react';

interface BoardStore {
  readonly boards: BoardsState;
  readonly setBoards: (boards: BoardsState) => void;
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      boards: restoreBoards(boards, null),
      setBoards: (next) => set({ boards: next }),
    }),
    {
      name: 'my-board',
      partialize: (store) => ({ boards: store.boards }),
      merge: (persisted, current) => ({
        ...current,
        boards: restoreBoards(boards, (persisted as { boards?: unknown } | undefined)?.boards),
      }),
    },
  ),
);

function Dashboard() {
  const { boards: state, setBoards } = useBoardStore();
  return <BoardProvider config={boards} value={state} onChange={setBoards}>{/* ... */}</BoardProvider>;
}
```

`restoreBoards(config, saved, options?)` takes whatever you saved (`null`/`undefined` for
nothing) and returns a valid state: migrated from older versions, on the breakpoint it was saved
at, or the authored layouts (`createInitialState(config, options)`) if nothing usable was saved.

### Repair

Loading never trusts what's there blindly: BoardKit parses it and **repairs** anything that no
longer validates. An out-of-bounds tile is relocated onto free space instead of failing outright,
and a tile referencing a widget type that's no longer registered is dropped, with a dev-only
console warning either way. A completely unparsable value (corrupted JSON, wrong shape) falls back
to the layouts or empty, never a thrown error.

## `engine.parse` / `engine.repair`

The same repair BoardProvider does under the hood is available directly from `boards.engine` (or
any `Engine` from `createEngine`) for state you load yourself — from a backend response, a file,
anywhere that isn't `localStorage` (`restoreBoards` does this for you, with migration):

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
