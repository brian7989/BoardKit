# Chrome

BoardKit renders the grid, the tiles and each widget's body — nothing you'd click to command a
tile or a board. All of that is plain React, built on the hooks below and handed to
`BoardProvider`.

## `tileHeader`: a strip above every widget

```tsx
import { noDragProps, type TileHeaderProps } from 'boardkit-react';

function TileHeader({ tile, name }: TileHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{name}</span>
      <button {...noDragProps()}>⋯</button>
    </div>
  );
}

<BoardProvider config={boards} tileHeader={TileHeader}>
```

Hand `BoardProvider` a `tileHeader` and BoardKit reserves a fixed strip above every widget's body
for it — sized by `headerHeight` on `defineBoards` (design px, default `32`), and excluded from
the widget's own `designSize` so a widget's layout never needs to know it exists. The strip is the
tile's drag grip — wrap only the buttons inside it in `noDragProps`, not the whole header.

A widget opts out of the strip entirely with `header: false` on its manifest (see
[Widgets](widgets.md)); `tileOverlay` then receives `hasHeader: false` for that tile, so an
overlay can float its own chrome only where there's no strip to hold it.

`TileHeaderProps` also carries `placement`, `'strip'` (the default) or `'overlay'`, so a header
for a `header: false` widget can still render — as a floating overlay on top of the widget's body
instead of a reserved strip — rather than being hidden outright.

### Dragging by the header

By default (`dragFrom="header"`) a tile with a header strip drags only from that strip — a click
in the widget's body, on a table row, map or chart, never starts a drag. A tile with no strip
(no `tileHeader`, `header: false`, or no strip room to hold it) still drags from anywhere on it,
since it has no other handle. Pass `dragFrom="tile"` on `BoardProvider` to restore whole-tile
dragging everywhere, as before.

```tsx
<BoardProvider config={boards} tileHeader={TileHeader} dragFrom="tile">
```

## `tileOverlay`: decoration on top of a tile

```tsx
import { type TileOverlayProps } from 'boardkit-react';

function TileDecoration({ tile, hasHeader }: TileOverlayProps) {
  return hasHeader ? null : <span style={{ position: 'absolute', top: 4, right: 4 }}>●</span>;
}

<BoardProvider config={boards} tileOverlay={TileDecoration}>
```

`tileOverlay` renders on top of every tile, wrapped so pointer activity inside it never starts a
tile drag. It's where a per-tile menu (below) usually lives.

## Recipe: a tile menu

```tsx
import { useTile, type TileOverlayProps } from 'boardkit-react';

function TileMenu({ tile }: TileOverlayProps) {
  const { size, float, stack, name, remove } = useTile(tile);
  return (
    <details>
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

`useTile` bundles the granular hooks (`useTileSize`, `useTileFloat`, `useTileStack`,
`useTileName`, `useTileInteraction`, `useTileRemove`) for a tile passed in by `tileOverlay` or
`tileHeader` — always pass along the `tile` those give you, not one captured earlier, since a
mid-drag tile is a preview copy.

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
`options.at` or `options.float` pin it exactly, the same shapes as `initialLayout`'s.

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
