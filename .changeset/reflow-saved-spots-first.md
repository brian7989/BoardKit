---
"boardkit-core": patch
"boardkit-react": patch
---

- **Fix: crash when switching breakpoints after adding a tile**: a tile added on one breakpoint could take the saved spot of a tile being restored on another, and the board threw on the overlap. Saved positions are now restored first, and new tiles fill the space that is left.
