import type { ComponentType } from 'react';
import type { Size } from 'boardkit-core';
import type { SizeInput } from '../shared/size/SizeInput.js';
import type { WidgetProps } from './WidgetProps.js';

/** A widget's registration: its type, sizes, default props, and rendering component. */
export interface WidgetManifest<P extends object = Record<string, unknown>> {
  readonly type: string;
  readonly title: string;
  readonly sizes: readonly Size[];
  readonly defaultProps?: Readonly<P>;
  readonly component: ComponentType<WidgetProps<P>>;
  /** Set false to opt this widget out of the host's tileHeader strip entirely (default true). */
  readonly header?: boolean;
  /** Applied as inline background/color on the tile frame, so a dark widget gets a matching dark header. */
  readonly surface?: { readonly background?: string; readonly color?: string };
}

/** Input to `defineWidget`: like `WidgetManifest`, but `sizes` may also be `"2x1"`-style strings. */
export interface WidgetManifestInput<P extends object = Record<string, unknown>> extends Omit<WidgetManifest<P>, 'sizes'> {
  readonly sizes: readonly SizeInput[];
}
