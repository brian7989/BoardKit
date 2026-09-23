import type { WidgetId } from '../shared/ids/WidgetId.js';

export interface WidgetInstance {
  readonly id: WidgetId;
  readonly type: string;
  readonly props?: Readonly<Record<string, unknown>>;
  // User-given label; can't be derived from opaque props.
  readonly displayName?: string;
}
