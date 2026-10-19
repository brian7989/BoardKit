import type { LayoutEntry } from './LayoutEntry.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { resolveInitialTile, type ResolvedInitialTile } from './resolveInitialTile.js';

/** One layout entry with its manifest, size and ids already resolved. */
export interface ResolvedEntry {
  readonly entry: LayoutEntry;
  readonly resolved: ResolvedInitialTile;
}

// Ids are handed out in authoring order, before placement reorders anything, so the same widget
// gets the same tile id in every breakpoint's layout. Unregistered widget types are skipped.
export function resolveEntries(ctx: InitialPlacementCtx, entries: readonly LayoutEntry[]): readonly ResolvedEntry[] {
  const out: ResolvedEntry[] = [];
  for (const entry of entries) {
    const resolved = resolveInitialTile(ctx, entry);
    if (resolved) out.push({ entry, resolved });
  }
  return out;
}
