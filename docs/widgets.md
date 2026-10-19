# Widgets

A widget is a manifest plus a component, declared once with `defineWidget` at module scope:

```tsx
import { defineWidget, type WidgetProps } from 'boardkit-react';

function Weather({ props, name }: WidgetProps<{ readonly city: string }>) {
  return (
    <div>
      <strong>{name}</strong>
      <div>{props.city}</div>
    </div>
  );
}

const weather = defineWidget({
  type: 'weather',
  title: 'Weather',
  sizes: ['1x1', '2x1', '2x2'],
  defaultProps: { city: 'Seoul' },
  component: Weather,
});
```

Type the component's props and let `defineWidget` infer the rest, rather than passing
`defineWidget<Props>`. Inference also captures the widget's `type` and `sizes`, which is what lets
a layout check `{ widget: 'weather', size: '2x1' }`; with an explicit `<Props>`, layouts accept any
name and size for that widget.

## Sizes

`sizes` lists every size, in grid cells, this widget can be placed or resized to — the first is
its default when added. Each entry is a `{ w, h }` object or a `'2x1'`-style string shorthand
(`cols`x`rows`); the two are interchangeable everywhere a size is accepted, including
`useTileSize`'s `set` and `useWidgetCatalog`'s `add`.

## The fixed design size

A widget is designed once, at a fixed pixel size — never against the screen. Every cell of the
grid is a fixed design canvas, `designCellSize` design px per cell (`160` by default, set on
`defineBoards`), and BoardKit renders each widget into a box of exactly `cells.w`/`cells.h` cells'
worth of that canvas, then scales the whole box to fit however large the tile actually renders,
with CSS `zoom`.

That means a widget author writes plain pixel values as if targeting one known screen size —
`width: 200px`, `fontSize: 14`, a canvas sized numerically — with **no responsive CSS**: no
`cqw`/`cqh`, no container queries, no `clamp()`. The same design renders crisply from a phone's
small cell up to a wide desktop board, because BoardKit handles the scaling, not the widget.

`WidgetProps.designSize` (also returned by `useWidget()`) exposes this canvas as
`{ width, height }` in design px — useful when a widget needs to size a child numerically (a
chart, a `<canvas>`) instead of through CSS. It's the box the widget is actually given, so a
header or padding in a host's `tile` is already taken out of it.

## `useWidget`

Inside a widget's own tree, `useWidget()` reads the same props a top-level widget component
receives — handy for a child component a few levels down that doesn't want props threaded to it:

```tsx
import { useWidget } from 'boardkit-react';

function Readout() {
  const { props, designSize } = useWidget();
  return <span style={{ width: designSize.width / 2 }}>{JSON.stringify(props)}</span>;
}
```

## Saving view state: `setProps`

`WidgetProps.setProps(patch)` (also on `useWidget()`) shallow-merges `patch` into this widget's
props and saves it with the board, so per-widget view state, such as a table/cards toggle,
survives a reload and is the same on every breakpoint:

```tsx
function Robots({ props, setProps }: WidgetProps<{ view: 'table' | 'cards' }>) {
  return <button onClick={() => setProps({ view: props.view === 'table' ? 'cards' : 'table' })}>{props.view}</button>;
}
```

## `name` and renaming

Every widget instance has a display name — the manifest's `title` unless a host renamed it via
`useTile(tile).name.set(...)` or `useTileStack`'s `renameItem`. `WidgetProps.name` (and
`useWidget().name`) is always the current one; a widget doesn't manage naming itself.

## `header: false`

Set `header: false` on a manifest to tell a host's `tile` (see [Chrome](chrome.md)) that this
widget wants the full tile box: useful for a widget that draws its own name and controls, or a
photo that should run edge to edge. The host's `tile` receives `header: false` and decides what to
drop; a tile it renders without a drag handle drags from anywhere.

## `surface`

```ts
defineWidget({
  // ...
  surface: { background: '#0f172a', color: '#e2e8f0' },
});
```

Applied as inline styles on the widget's body, and passed to a host's `tile` as its `surface`
prop, so a dark widget's header can match its own body instead of the host's usual tile look.

## Interactive controls: `noDragProps`

A tile without a drag handle (see [Chrome](chrome.md)) drags from anywhere on it,
including on top of your widget. There, a control that needs its own pointer gesture (a slider, a
drag-to-reorder list, a canvas you pan) must opt out, or dragging it will instead drag the tile:

```tsx
import { noDragProps } from 'boardkit-react';

function Slider() {
  return <input type="range" {...noDragProps()} />;
}
```

Spread it on the interactive element itself, not on a wrapper around your whole widget — the rest
of the widget should stay draggable.

## Next

- [Boards & state](boards-and-state.md) — placing widgets via `layout`, persistence.
- [Chrome](chrome.md) — your own `tile`, menus, and an add-widget gallery.
- [API reference](api.md).
