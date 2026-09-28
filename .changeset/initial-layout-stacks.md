---
"boardkit-core": patch
"boardkit-react": patch
---

- **Default stacks in `initialLayout`**: an entry's new `stack` lists more widgets (each with optional `props` and `name`) stacked under its own widget on the same tile, which shows the entry's widget first. Without a `size`, a stack takes the largest size every widget in it allows. Stacks are shared across breakpoints like any other widget, and a widget one layout stacks and another lists on its own is still one widget.
- **`Add` op `stack`**: the core `Add` op takes an optional `stack` of extra widgets, adding a stacked tile in one step; it's rejected with `SizeNotAllowed` if any widget in it doesn't allow the size.
