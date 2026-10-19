import type { ComponentType } from 'react';
import type { Size } from 'boardkit-core';
import type { SizeInput } from '../shared/size/SizeInput.js';
import type { SizeKey } from '../shared/size/SizeKey.js';
import type { WidgetProps } from './WidgetProps.js';

declare const allowedSizes: unique symbol;

/**
 * A widget's registration: its type, sizes, default props, and rendering component. `T` and `S`
 * carry its type name and size shorthands, so a layout naming it is checked against them.
 */
export interface WidgetManifest<P extends object = Record<string, unknown>, T extends string = string, S extends SizeKey = SizeKey> {
  readonly type: T;
  readonly title: string;
  readonly sizes: readonly Size[];
  readonly defaultProps?: Readonly<P>;
  readonly component: ComponentType<WidgetProps<P>>;
  /** Set false to ask the host's tile for no header, so this widget fills the whole tile (default true). */
  readonly header?: boolean;
  /** Background/text color for the widget body, also handed to the host's tile so its frame can match. */
  readonly surface?: { readonly background?: string; readonly color?: string };
  readonly [allowedSizes]?: S;
}

/** Any widget, whatever its props: the type of a list of different widgets. */
export type AnyWidget = WidgetManifest<any, string, SizeKey>;

/** Input to `defineWidget`: like `WidgetManifest`, but `sizes` may also be `"2x1"`-style strings. */
export interface WidgetManifestInput<P extends object, T extends string, S extends SizeInput> extends Omit<WidgetManifest<P, T>, 'sizes' | typeof allowedSizes> {
  readonly sizes: readonly S[];
}

/** The size shorthands a widget's `sizes` list, or any size when one is given as a `{ w, h }` object. */
export type SizeKeysOf<S extends SizeInput> = S extends SizeKey ? S : SizeKey;
