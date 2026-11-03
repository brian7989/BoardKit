---
'boardkit-core': patch
'boardkit-react': patch
---

**Fix: releasing a drag past the board's edge no longer throws the move away.** The drag preview keeps the tile inside the board even when the pointer wanders past its edge, but releasing out there used to cancel the drag and snap the tile back, so the board undid what it had just shown. A release now always drops onto the previewed spot, wherever the pointer is. To leave a tile where it was, drag it back to where it started. A browser-cancelled pointer (a system gesture interrupting a touch, say) still commits nothing.
