# Widgets

A widget is a manifest plus a component, declared once with `defineWidget` at module scope:

```tsx
import { defineWidget } from 'boardkit-react';

interface WeatherProps {
  readonly city: string;
}

const weather = defineWidget<WeatherProps>({
  type: 'weather',
  title: 'Weather',
  sizes: ['1x1', '2x1', '2x2'],
  defaultProps: { city: 'Seoul' },
  component: ({ props, name }) => (
    <div>
      <strong>{name}</strong>
      <div>{props.city}</div>
    </div>
  ),
});
```

The `P` generic is only needed when TypeScript can't infer it from `component`/`defaultProps`
alone (as with the object literal above); a component with an inline, typed destructure usually
needs no generic at all, as in the [quick start](../README.md#quick-start).

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
chart, a `<canvas>`) instead of through CSS. It excludes the `tileHeader` strip when the widget
has one, so a widget's own layout never has to account for it.

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

## `name` and renaming

Every widget instance has a display name — the manifest's `title` unless a host renamed it via
`useTile(tile).name.set(...)` or `useTileStack`'s `renameItem`. `WidgetProps.name` (and
`useWidget().name`) is always the current one; a widget doesn't manage naming itself.

## `header: false`

By default, a host's `tileHeader` (see [Chrome](chrome.md)) reserves a strip above every widget's
body. Set `header: false` on a manifest to opt that widget out and get the full tile box back —
useful for a widget that wants to draw its own name and controls. `tileOverlay` then receives
`hasHeader: false` for that tile, so a host's overlay chrome can float its own controls only when
there's no strip to put them in.

## `surface`

```ts
defineWidget({
  // ...
  surface: { background: '#0f172a', color: '#e2e8f0' },
});
```

Applied as inline styles on the tile's frame (header strip and body together), so a dark widget's
header matches its own body instead of defaulting to the host's usual tile look.

## Interactive controls: `noDragProps`

A tile without a header strip, or any tile under `dragFrom="tile"`, drags from anywhere on it,
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

- [Boards & state](boards-and-state.md) — placing widgets via `initialLayout`, persistence.
- [Chrome](chrome.md) — `tileHeader`, `tileOverlay`, and an add-widget gallery.
- [API reference](api.md).
