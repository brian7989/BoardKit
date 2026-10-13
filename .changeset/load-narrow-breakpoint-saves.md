---
"boardkit-react": patch
---

- **Fix: saves made at a narrower breakpoint were discarded on reload.** `storageKey` loading (and `loadBoards`) checked every save against the widest breakpoint's grid, so a board saved at any narrower breakpoint failed with a grid mismatch and silently fell back to the initial layout, and the next save then overwrote it. A save is now checked against the breakpoint whose grid it was made on. A save from a grid no breakpoint uses any more is repaired on its own grid and reflowed onto the widest, instead of being thrown away.
- **Dev warning when a save can't be used**: if a save is still unusable, a development-only console warning names the storage key and the reason before the board starts from its initial layout.
