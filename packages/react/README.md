# boardkit-react

The React adapter for BoardKit: renders the grid, tiles and widgets from a
[`boardkit-core`](https://www.npmjs.com/package/boardkit-core) board state, and handles
drag-and-drop. Menus and buttons are yours: resize, float, stack, rename and add/remove are
exposed as hooks for your own UI to call.

## Install

```sh
npm i boardkit-react
```

## Example

```tsx
import { BoardProvider, Board, defineBoards, defineWidget } from 'boardkit-react';
import 'boardkit-react/styles.css';

const clock = defineWidget({
  type: 'clock',
  title: 'Clock',
  sizes: ['1x1'],
  defaultProps: {},
  component: () => <div>Clock</div>,
});

const boards = defineBoards({ grid: { cols: 6, rows: 4 }, widgets: [clock] });

export function App() {
  return (
    <BoardProvider config={boards} storageKey="my-board">
      <Board />
    </BoardProvider>
  );
}
```

Full docs: [github.com/brian7989/BoardKit](https://github.com/brian7989/BoardKit#readme), including
the [guides](https://github.com/brian7989/BoardKit/tree/main/docs) and
[API reference](https://github.com/brian7989/BoardKit/blob/main/docs/api.md).
