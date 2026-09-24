# Styling

BoardKit ships no chrome, so there's very little to style: interaction feedback (drag, resize,
float, stacking) is driven entirely by `data-bk-*` attributes on plain DOM elements, and one CSS
custom property for spacing. Importing `boardkit-react/styles.css` gives you a sensible default
look for that feedback; skip it and style the same attributes yourself for a fully custom look.

## `--bk-tile-gap`

The gutter between tiles, default `0px`. Set it on any ancestor of `<Board>` — see
[Layout & breakpoints](layout-and-breakpoints.md#--bk-tile-gap) for varying it per breakpoint.

```css
.board-area {
  --bk-tile-gap: 12px;
}
```

## `data-bk-*` attributes

| Attribute | Where | Meaning |
|---|---|---|
| `data-bk-tile-id` | Every tile | Present on every tile's root element (its value is the tile's id). |
| `data-bk-draggable` | Every tile | `"true"` once a tile is draggable — effectively always. |
| `data-bk-drag-from` | Every tile | `"header"` or `"tile"` — which element is that tile's actual drag handle, per `dragFrom`. |
| `data-bk-lifted` | A tile | `"true"` for the brief lift just before a drag becomes active. |
| `data-bk-active` | A tile | `"true"` while a tile is actively being dragged or resized. |
| `data-bk-valid` | A tile | `"true"`/`"false"` during an active drag: whether the current position is a legal drop. |
| `data-bk-floating` | A tile | `"true"` for a tile currently floating above the grid (not just mid-drag). |
| `data-bk-placeholder` | The drop halo | `"true"` on the placeholder shown at the drop target mid-drag. |
| `data-bk-stack-role` | A tile | During a "stack with…" pick: `"eligible"`, `"source"`, or `"ineligible"`. |
| `data-bk-no-drag` | Your own elements | Set via `noDragProps()` — stops pointer activity there from starting a tile drag. |
| `data-bk-tile-frame` | Inside a tile | Wraps a widget's header strip and body together. |
| `data-bk-tile-header` | Inside a tile | Wraps the `tileHeader` strip specifically. |
| `data-bk-tile-body` | Inside a tile | Wraps a widget's own rendered body. |

Selector examples, without the default stylesheet:

```css
[data-bk-tile-id][data-bk-active='true'] {
  z-index: 10;
  filter: drop-shadow(0 6px 10px rgba(15, 23, 42, 0.18));
}

[data-bk-placeholder='true'][data-bk-valid='false'] {
  background: rgba(220, 38, 38, 0.08);
}

[data-bk-stack-role='ineligible'] {
  opacity: 0.35;
  pointer-events: none;
}
```

See [Chrome](chrome.md) for `noDragProps` in a real control, and
[`packages/react/src/styles.css`](../packages/react/src/styles.css) for the full default rules.

## Next

- [API reference](api.md).
