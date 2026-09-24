# Engine

`boardkit-core` is the pure engine behind `boardkit-react` — grid geometry, a collision solver,
and the ops that change a board's state. No DOM, no React, no runtime dependencies: state is a
plain serializable value, and every change returns either an updated state or a typed rejection,
never a thrown error. Use it directly for a non-React host, a server-side layout check, or a test
fixture.

## Building an engine

```ts
import { createEngine, boardId, tileId, widgetId, cell, OpType } from 'boardkit-core';

const engine = createEngine({
  grid: { cols: 6, rows: 4 },
  catalog: { clock: { sizes: [{ w: cell(1), h: cell(1) }] } },
});
const state = engine.empty();
```

`catalog` lists every widget type's allowed sizes — the same information `defineWidget` and
`defineBoards` already assemble for you in `boardkit-react`.

`boards.engine` on a `BoardsConfig` from `defineBoards` is the same kind of engine — no need to
build a second one just to call `apply` outside a component.

## Applying ops

Every change to a board is an op: `Move`, `Resize`, `Add`, `Remove`, `Stack`, `Unstack`,
`SetActive`, `ReorderStack`, `RenameWidget`, `AddBoard`, `RemoveBoard`, `SetFloating`,
`MoveFloating`, `SetFloatFree`. `engine.apply(state, op)` returns a typed `Result`:

```ts
const result = engine.apply(state, {
  type: OpType.Add,
  board: boardId('default'),
  tileId: tileId('t1'),
  widget: { id: widgetId('t1-w'), type: 'clock', props: {} },
  size: { w: cell(1), h: cell(1) },
  at: { x: cell(0), y: cell(0) },
});

if (result.ok) {
  console.log(result.value.state);
} else {
  console.warn(result.error.reason); // a RejectReason
}
```

`Result<T, E>` is `{ ok: true, value: T } | { ok: false, error: E }` — every fallible call in
BoardKit, in React or not, returns this same shape instead of throwing.

## Reading and repairing state

```ts
const parsed = engine.parse(rawJson); // strict: Result<BoardsState, readonly Issue[]>
const repaired = engine.repair(rawJson); // Result<Repaired, readonly Issue[]> — relocates/drops what it must
const issues = engine.check(state); // validates an already-typed BoardsState in place
const serialized = engine.serialize(state); // back to a plain JSON-safe value
```

`parse` never patches; `repair` runs whatever fixes it can (relocating an out-of-bounds tile,
dropping one that references an unknown widget type) and reports what it changed. This is exactly
what `boardkit-react`'s `storageKey` persistence uses under the hood — see
[Boards & state](boards-and-state.md#storagekey-and-repair).

## Other engine methods

- `engine.findFree(state, board, size)` — the first free position a size would fit at, or `null`.
- `engine.reflow(state)` — repacks `state` (built for any grid) onto this engine's own grid; used
  when switching breakpoints.

## Next

- [Boards & state](boards-and-state.md).
- [API reference](api.md).
