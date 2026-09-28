import type { Size, WidgetInstance } from 'boardkit-core';
import { isSizeAllowed } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { heroSize } from './heroSize.js';
import { parseSizeInput } from '../../shared/size/parseSizeInput.js';
import { buildInitialWidget } from './buildInitialWidget.js';
import { nextInitialId } from './nextInitialId.js';
import { warnOnce } from '../../shared/dev/warnOnce.js';

export interface ResolvedInitialTile {
  readonly manifest: WidgetManifest;
  readonly size: Size;
  readonly widget: WidgetInstance;
  readonly tileId: string;
  readonly float?: { readonly x: number; readonly y: number; readonly free?: boolean };
  // Widgets stacked under `widget`; empty for a plain tile.
  readonly stack: readonly WidgetInstance[];
}

interface StackedWidget {
  readonly manifest: WidgetManifest;
  readonly widget: WidgetInstance;
}

// Unregistered stack widgets are skipped, like unregistered entries.
function resolveStack(ctx: InitialPlacementCtx, entry: InitialLayoutTile): readonly StackedWidget[] {
  const out: StackedWidget[] = [];
  for (const item of entry.stack ?? []) {
    const manifest = ctx.config.widgets.get(item.widget);
    if (manifest) out.push({ manifest, widget: buildInitialWidget(item, manifest, nextInitialId(ctx.counts, item.widget).widget) });
  }
  return out;
}

// A stack's tile needs a size every widget in it allows, so the default picks the largest shared one.
function defaultSize(ctx: InitialPlacementCtx, manifest: WidgetManifest, stacked: readonly StackedWidget[]): Size {
  const shared = manifest.sizes.filter((size) => stacked.every((item) => isSizeAllowed(size, item.manifest.sizes)));
  if (shared.length === 0) warnOnce(`stack-size:${manifest.type}`, `Boards: no size fits every widget in the "${manifest.type}" stack.`);
  return heroSize(shared.length > 0 ? { ...manifest, sizes: shared } : manifest, ctx.config.grid);
}

/** Resolves one layout entry's manifest, size, ids and widget instances, or null if unregistered. */
export function resolveInitialTile(ctx: InitialPlacementCtx, entry: InitialLayoutTile): ResolvedInitialTile | null {
  const manifest = ctx.config.widgets.get(entry.widget);
  if (!manifest) return null;
  const ids = nextInitialId(ctx.counts, entry.widget);
  const stacked = resolveStack(ctx, entry);
  const size = entry.size ? parseSizeInput(entry.size) : defaultSize(ctx, manifest, stacked);
  return {
    manifest,
    size,
    tileId: ids.tile,
    widget: buildInitialWidget(entry, manifest, ids.widget),
    stack: stacked.map((item) => item.widget),
    ...(entry.float ? { float: entry.float } : {}),
  };
}
