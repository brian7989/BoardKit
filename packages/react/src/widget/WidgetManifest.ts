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
  /** Set false to ask the host's tile for no header, so this widget fills the whole tile (default true). */
  readonly header?: boolean;
  /** Background/text color for the widget body, also handed to the host's tile so its frame can match. */
  readonly surface?: { readonly background?: string; readonly color?: string };
}

/** Input to `defineWidget`: like `WidgetManifest`, but `sizes` may also be `"2x1"`-style strings. */
export interface WidgetManifestInput<P extends object = Record<string, unknown>> extends Omit<WidgetManifest<P>, 'sizes'> {
  readonly sizes: readonly SizeInput[];
}
