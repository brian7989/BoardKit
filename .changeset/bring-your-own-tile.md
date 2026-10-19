---
'boardkit-react': minor
---

**Bring your own tile.** `BoardProvider` takes a `tile` component that renders around every widget, in place of `tileHeader` and `tileOverlay`. It receives `{ tile, widget, dragHandle, surface, header }`: put `widget` wherever the body goes, spread `dragHandle` on the element the tile should drag by, and use `header` (false when a manifest says `header: false`) to decide what to leave out. A tile with a drag handle drags only from it; one without drags from anywhere. The widget measures the box it's given, so headers, borders and padding no longer need a `headerHeight`.

**Saving a controlled board is the host's job.** New `restoreBoards(config, saved, options?)` turns whatever you saved (in Zustand's `persist`, a backend, anywhere) back into a valid state: migrated, repaired and on the breakpoint it was saved at, or the authored layouts when nothing usable was saved. `storageKey` now only saves uncontrolled boards.

### Migrating from 0.1

- `tileHeader={Header}` → `tile={Card}`, where `Card` renders the header itself plus `{widget}`:

  ```tsx
  // Before
  function Header({ tile, name }: TileHeaderProps) {
    return <div>{name}<Menu tile={tile} /></div>;
  }
  <BoardProvider config={boards} tileHeader={Header}>

  // After
  function Card({ tile, widget, dragHandle, surface, header }: TileProps) {
    const { name } = useTile(tile);
    return (
      <div className="card" style={surface}>
        {header ? <div {...dragHandle}>{name.current}<Menu tile={tile} /></div> : null}
        <div className="card-body">{widget}</div>
      </div>
    );
  }
  <BoardProvider config={boards} tile={Card}>
  ```

- `tileOverlay` is gone: render the same chrome inside your `tile`, wrapped in `noDragProps()`.
- `dragFrom` is gone: render a `dragHandle` to drag from it only, or none to drag from anywhere.
- `headerHeight` on `defineBoards` is gone, along with `TileHeaderProps`, `TileOverlayProps`, `TileHeaderPlacement` and `DragFrom`. The `data-bk-tile-frame`, `data-bk-tile-header` and `data-bk-drag-from` attributes are gone too; style your own tile instead.
- `loadBoards(config, key)` → `restoreBoards(config, saved)`, where `saved` is what you stored. To keep reading an old `storageKey` save once: `restoreBoards(config, JSON.parse(localStorage.getItem(key) ?? 'null'))`.
- A controlled board with `storageKey` no longer writes to `localStorage`; save it from `onChange` (or your store's persistence) instead.
