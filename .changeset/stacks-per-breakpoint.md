---
'boardkit-react': minor
'boardkit-core': minor
---

**Stacks per breakpoint.** Each breakpoint now keeps its own stacks, along with its own positions: a phone layout can stack `jobs` and `robots` on one tile while the wall keeps them apart, whether that's authored in `layout` or done by the user on that breakpoint.

The rule: a widget's content (the widget, its props, its name) is shared by every breakpoint; its arrangement (position, size, floating, hidden, which widgets share a tile, and which one a stack shows) is per breakpoint. A widget stacked onto a tile on one breakpoint joins the tile its stack-mates are on everywhere else (or gets a tile of its own where that tile is a size it doesn't allow).

The dev warning about layouts that stack differently is gone, since they now just work.

Core: a saved layout entry records its tile's widgets (`items`) and which one shows (`active`), and reflow rebuilds each breakpoint's tiles from them. Saves without them keep each tile's widgets as before.

### Upgrading from 0.3

Stacking or unstacking on one breakpoint no longer changes the others. Nothing else changes, and existing saves load as they are.
