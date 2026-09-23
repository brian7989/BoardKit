# boardkit-core

BoardKit's pure, headless engine: grid geometry, a collision solver, and the ops (`Move`,
`Resize`, `Add`, `Remove`, ...) that change a board's state. No DOM, no React, no runtime
dependencies — state is a plain serializable value you own, and every change returns either an
updated state or a typed rejection.

## Install

```sh
npm i boardkit-core
```

## Example

```ts
import { createEngine, boardId, tileId, widgetId, cell, OpType } from 'boardkit-core';

const engine = createEngine({ grid: { cols: 6, rows: 4 }, catalog: { clock: { sizes: [{ w: cell(1), h: cell(1) }] } } });
const state = engine.empty();

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
}
```

For the React adapter, see [`boardkit-react`](https://www.npmjs.com/package/boardkit-react).
Full docs: [github.com/brian7989/BoardKit](https://github.com/brian7989/BoardKit#readme), including
the [engine guide](https://github.com/brian7989/BoardKit/blob/main/docs/engine.md).
