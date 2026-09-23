# FAQ

## Widget or panel?

The rule: **would the user want it saved in their dashboard layout?** If yes, it's a widget on
the board. If it's a session or a tool you open, use, and close — something with a beginning and
an end, not a permanent fixture of the layout — it's an app-level panel that lives outside the
board.

**Worked example.** A fleet dashboard has a Robot Inspector widget showing one robot's status,
battery and last few alerts — a natural board tile, saved in the layout like any other. Its
"Open Teleop" button, though, starts a live joystick session for that robot. Rather than turning
the inspector into a teleop widget, the button calls into an app-level store:

```ts
// App-level, outside the board.
interface TeleopStore {
  open(robotId: string): void;
  close(): void;
}

function openTeleopFromInspector(teleop: TeleopStore, robotId: string) {
  teleop.open(robotId);
}
```

`teleop.open(robotId)` renders a `TeleopPanel` at the app root — a floating, freely-positioned
window (a library like `react-rnd` suits this well), independent of the board entirely. Both the
panel and, if an operator wants a permanent teleop tile for one robot they drive constantly, a
widget registered with `defineWidget`, render the same shared `TeleopView` component; only the
frame around it differs.

Why doesn't the session itself belong on the board:

- **Per-page visibility** — a board page is meant to be swapped to and from; a live joystick
  session shouldn't vanish because someone flipped to another page.
- **Persistence** — a widget's props round-trip through `storageKey`/`initialLayout`; a live
  session (open sockets, an active control loop) is not serializable state to reload later.
- **The solver moves tiles** — reflow (see [Layout & breakpoints](layout-and-breakpoints.md)) can
  relocate or resize any tile to keep a board valid; a control session shouldn't be silently
  resized or bumped to a new page mid-use.
- **The layout menu** — a board's add-widget gallery and per-tile menu are for things a user adds,
  arranges and removes at will; a teleop session is started and stopped by a workflow, not curated
  into a layout.
- **Whole-tile drag** — every tile is always draggable (see below); a panel meant to be dragged
  freely and precisely positioned wants its own gesture, not the board's tile-grid one.

## Browser support

The fixed design size (see [Widgets](widgets.md)) relies on CSS `zoom` to scale a widget's canvas
to its rendered cell size. That's supported in Chrome, Edge, Safari, and Firefox 126+.

## Performance

Each tile is its own React subtree, so dragging or resizing one tile re-renders that tile, not the
whole board. The collision solver runs on demand (a drag, a resize, an add) and is fast on
real-world boards; the case that costs the most is a fully packed board of many different tile
sizes, where finding a valid rearrangement has the most to search through.

## Next

- [Chrome](chrome.md).
- [API reference](api.md).
