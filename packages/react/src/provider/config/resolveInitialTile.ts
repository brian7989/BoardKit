import type { Size, WidgetInstance } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { heroSize } from './heroSize.js';
import { parseSizeInput } from '../../shared/size/parseSizeInput.js';
import { buildInitialWidget } from './buildInitialWidget.js';
import { nextInitialId } from './nextInitialId.js';

export interface ResolvedInitialTile {
  readonly manifest: WidgetManifest;
  readonly size: Size;
  readonly widget: WidgetInstance;
  readonly tileId: string;
  readonly float?: { readonly x: number; readonly y: number; readonly free?: boolean };
}

/** Resolves one layout entry's manifest, size, ids and widget instance, or null if unregistered. */
export function resolveInitialTile(ctx: InitialPlacementCtx, entry: InitialLayoutTile): ResolvedInitialTile | null {
  const manifest = ctx.config.widgets.get(entry.widget);
  if (!manifest) return null;
  const size = entry.size ? parseSizeInput(entry.size) : heroSize(manifest, ctx.config.grid);
  const ids = nextInitialId(ctx.counts, entry.widget);
  return {
    manifest,
    size,
    tileId: ids.tile,
    widget: buildInitialWidget(entry, manifest, ids.widget),
    ...(entry.float ? { float: entry.float } : {}),
  };
}
