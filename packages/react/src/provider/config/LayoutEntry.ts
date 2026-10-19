import type { Size } from 'boardkit-core';
import type { AnyWidget, WidgetManifest } from '../../widget/index.js';
import type { SizeKey } from '../../shared/size/SizeKey.js';
import type { AtInput } from './AtInput.js';

/** A widget stacked under a layout entry's own widget, on the same tile. */
export type LayoutStackEntry<W extends AnyWidget = AnyWidget> =
  W extends WidgetManifest<infer P, infer T, SizeKey>
    ? { readonly widget: T; readonly props?: Readonly<Partial<P>>; readonly name?: string }
    : never;

// `M` is narrowed to one widget per union member; `W` stays every widget, for what `stack` may hold.
type EntryFor<M extends AnyWidget, W extends AnyWidget> =
  M extends WidgetManifest<infer P, infer T, infer S>
    ? {
        readonly widget: T;
        readonly size?: S | Size;
        readonly at?: AtInput;
        readonly props?: Readonly<Partial<P>>;
        readonly name?: string;
        readonly page?: number;
        /** Starts the tile floating at this position: snapped into the Overlay layer, or unsnapped with `free: true`. */
        readonly float?: { readonly x: number; readonly y: number; readonly free?: boolean };
        /** More widgets stacked under this one on the same tile, which shows `widget` first. */
        readonly stack?: readonly LayoutStackEntry<W>[];
      }
    : never;

/**
 * One widget a layout starts with. Omit `at` for first-fit placement (spilling onto a new page
 * once earlier ones are full); give `page` to put it on a specific extra page instead, 0-indexed
 * after however many that first-fit fill used.
 */
export type LayoutEntry<W extends AnyWidget = AnyWidget> = EntryFor<W, W>;
