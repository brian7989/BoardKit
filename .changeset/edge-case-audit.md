---
"boardkit-core": patch
"boardkit-react": patch
---

- **Fix: a widget no longer gets deleted by narrowing the window.** When a breakpoint's grid has no size a widget fits (a `4x2`-only widget on a 2-column phone grid), reflow used to delete it from the board for good, so widening again didn't bring it back and `storageKey` saved the loss. It's now parked: kept in the new `BoardsState.parked` list, hidden on that breakpoint, and restored (at its remembered spot when it has one) as soon as the board reaches a grid it fits. Saves without `parked` load as nothing parked.
- **Fix: a floating tile could vanish on a breakpoint switch** when the restored layout didn't have the page it was on. It now moves to the first page instead.
- **Duplicate ids are rejected, not thrown**: `Add`, `StackNew`, `AddBoard` and any op that would reuse a board, tile or widget id already in use (parked tiles included) now return a `DuplicateId` rejection, matching the engine's "returns a rejection, never throws" contract. `describeRejection` has a message for it.
- **`initialLayout` sizes a widget doesn't allow** now fall back to its default size with a dev warning, instead of silently leaving the widget out.
