# Getting started

## Install

```sh
npm i boardkit-react
```

Requires React ≥18. `boardkit-react` depends on `boardkit-core`, and re-exports its types and
helpers (`cell`, `boardId`, `OpType`, `Result`, ...), so most apps only ever import
`boardkit-react`.

## Your first board

A board needs a widget catalog and a grid. Declare a widget with `defineWidget`, then build the
board's config with `defineBoards`:

```tsx
import { BoardProvider, Board, defineBoards, defineWidget } from 'boardkit-react';
import 'boardkit-react/styles.css';

const clock = defineWidget({
  type: 'clock',
  title: 'Clock',
  sizes: ['1x1'],
  defaultProps: { label: 'Local time' },
  component: ({ props }) => <div>{props.label}</div>,
});

const boards = defineBoards({ grid: { cols: 6, rows: 4 }, widgets: [clock], initialLayout: [{ widget: 'clock' }] });

export function App() {
  return (
    <BoardProvider config={boards} storageKey="my-board">
      <Board />
    </BoardProvider>
  );
}
```

- `defineBoards` builds the engine and widget catalog once, at module scope — never inside a
  component.
- `initialLayout` is what an uncontrolled board starts from before anything is saved.
- `storageKey` persists the board to `localStorage` and loads it back (with repair) on mount. See
  [Boards & state](boards-and-state.md).
- Importing `boardkit-react/styles.css` is optional — it only styles drag/drop feedback via
  `data-bk-*` attributes. See [Styling](styling.md).

`<Board>` renders the grid, the tiles and each widget's body. It draws no menus, headers or
buttons of its own — that's your own chrome, wired up with hooks. See [Chrome](chrome.md).

## The shape of a widget

A widget is a plain component that receives `WidgetProps`: its live `cells` size, a fixed
`designSize` to lay itself out at, its `props`, and a few read-only flags (`locked`, `isActive`,
`name`). It never measures its own container or writes responsive CSS — see
[Widgets](widgets.md) for why, and how sizes, headers and interactive controls work.

## Next

- [Widgets](widgets.md) — `defineWidget`, sizes, the fixed design size, `useWidget`.
- [Boards & state](boards-and-state.md) — controlled vs. uncontrolled state, persistence.
- [Layout & breakpoints](layout-and-breakpoints.md) — responsive grids that remember layouts.
- [Chrome](chrome.md) — building menus, headers, an add-widget gallery, page dots, toasts.
- [API reference](api.md) — every export, one line each.
