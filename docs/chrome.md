# Chrome

BoardKit renders the grid, the tiles and each widget's body — nothing you'd click to command a
tile or a board. All of that is plain React, built on the hooks below and handed to
`BoardProvider`.

## `tile`: your own tile around every widget

```tsx
import { noDragProps, useTile, type TileProps } from 'boardkit-react';

function Card({ tile, widget, dragHandle, surface, header }: TileProps) {
  const { name } = useTile(tile);
  return (
    <div className="card" style={surface}>
      {header ? (
        <div className="card-header" {...dragHandle}>
          <span>{name.current}</span>
          <button {...noDragProps()}>⋯</button>
        </div>
      ) : null}
      <div className="card-body">{widget}</div>
    </div>
  );
}

<BoardProvider config={boards} tile={Card}>
```

Hand `BoardProvider` a `tile` component and BoardKit renders it in every tile's box, passing:

| Prop | What it is |
| --- | --- |
| `tile` | The tile being rendered (a preview copy mid-drag). |
| `widget` | The widget, already scaled to fill whatever box you put it in, inside its own error boundary. |
| `dragHandle` | Spread it on the element the tile should drag by. |
| `surface` | The manifest's `surface` background/color, as a style object. |
| `header` | `false` when the widget's manifest says `header: false`; a hint, so you decide what to drop. |

Without a `tile` component, the widget alone fills the tile.

The widget measures the box you give it, so a header, a border or padding around it is simply
taken out of its space: its design width stays fixed (scaled with `zoom`), and its `designSize`
height is whatever room is left.

### Dragging

A tile that renders an element with `dragHandle` drags only from that element, so a click in the
widget's body (a table row, a map, a chart) never starts a drag. A tile without one drags from
anywhere on it. Wrap buttons inside the handle (or anywhere else) in `noDragProps()` so pressing
them never starts a drag either.

## Recipe: a tile menu

```tsx
import { noDragProps, useTile, type Tile } from 'boardkit-react';

function TileMenu({ tile }: { readonly tile: Tile }) {
  const { size, float, stack, name, remove } = useTile(tile);
  return (
    <details {...noDragProps()}>
      <summary>⋯</summary>
      <ul>
        {size.options.map((option) => (
          <li key={`${option.size.w}x${option.size.h}`}>
            <button disabled={option.isCurrent} onClick={() => size.set(option.size)}>
              {option.size.w}×{option.size.h}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => float.toggle()}>{float.isFloating ? 'Unfloat' : 'Float'}</button>
      {stack.canCombine ? <button onClick={() => stack.startPicking()}>Stack with…</button> : null}
      <button onClick={() => name.set(prompt('Name?', name.current) ?? name.current)}>Rename</button>
      <button onClick={() => remove()}>Remove</button>
    </details>
  );
}
```

Render it from your `tile` component, passing the `tile` it was given. `useTile` bundles the
granular hooks (`useTileSize`, `useTileFloat`, `useTileStack`, `useTileName`,
`useTileInteraction`, `useTileRemove`); always pass the `tile` BoardKit hands you, not one captured
earlier, since a mid-drag tile is a preview copy.

## Stacking: new widget, or existing tile

A tile's stack can grow two ways, and they aren't interchangeable:

- **`stack.addWidget(type, props?)`** creates a brand-new widget and adds it to this tile's stack,
  showing it. It needs no free grid space. It's rejected with `SizeNotAllowed` if `type` doesn't
  allow the tile's size; `stack.canAddWidget(type)` answers that up front, cheaply, for greying
  out a picker. Under the hood it's one `StackNew` op, so `canApply` works with it too.
- **`stack.combineWith(tile)`** / **`stack.startPicking()`** move an existing tile's widgets (with
  their props, names and any stack of their own) onto another tile, and remove the old tile.

```tsx
function StackWithSheet({ tile }: { readonly tile: Tile }) {
  const { stack } = useTile(tile);
  const { widgets } = useWidgetCatalog();
  return widgets.map((widget) => (
    <button key={widget.type} disabled={!stack.canAddWidget(widget.type)} onClick={() => stack.addWidget(widget.type)}>
      {widget.title}
    </button>
  ));
}
```

## Recipe: add-widget gallery

```tsx
import { useWidgetCatalog } from 'boardkit-react';

function AddWidgetMenu() {
  const { widgets, add } = useWidgetCatalog();
  return (
    <ul>
      {widgets.map((widget) => (
        <li key={widget.type}>
          <button onClick={() => add(widget.type)}>{widget.title}</button>
        </li>
      ))}
    </ul>
  );
}
```

`add(type, options?)` places a new tile at the widget's default (or given) size/position;
`options.at` or `options.float` pin it exactly, the same shapes as a layout entry's.

Pair this with `<Board emptyState={<AddWidgetMenu />}>` so an empty board offers it directly
instead of showing the default "No widgets on this page yet." message.

## Recipe: page dots

```tsx
import { useBoardList } from 'boardkit-react';

function PageDots() {
  const { boards, activeId, select, add } = useBoardList();
  return (
    <div>
      {boards.map((board) => (
        <button key={board.id} disabled={board.isActive} onClick={() => select(board.id)}>
          {board.isActive ? '●' : '○'}
        </button>
      ))}
      <button onClick={() => add()}>+</button>
      {activeId}
    </div>
  );
}
```

## Recipe: toasts on rejection

```tsx
import { useCallback } from 'react';
import { BoardProvider, describeRejection, type Rejection } from 'boardkit-react';

function App() {
  const onReject = useCallback((rejection: Rejection) => {
    console.warn(describeRejection(rejection));
  }, []);

  return <BoardProvider config={boards} onReject={onReject}>{/* ... */}</BoardProvider>;
}
```

Every dispatched action returns `{ ok: true, value }` or `{ ok: false, error }` (see
[API reference](api.md)) so a rejected call is a value to branch on locally too — `onReject` is
just the one place that sees every rejection a drag, resize or programmatic call produces,
regardless of where it came from. `describeRejection` turns the typed `Rejection` into one
ready-to-show English line, covering every `RejectReason` (collision, out of bounds, unknown
target, ...).

## Next

- [Styling](styling.md) — CSS variables and `data-bk-*` attributes for the pieces above.
- [API reference](api.md).
