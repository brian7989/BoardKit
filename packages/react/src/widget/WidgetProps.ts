/** What a widget component receives: its live size, design canvas, props, and tile state. */
export interface WidgetProps<P extends object = Record<string, unknown>> {
  readonly cells: { readonly w: number; readonly h: number };
  /** This widget's rendered body box, in design px — excludes any tileHeader strip, never real screen pixels. */
  readonly designSize: { readonly width: number; readonly height: number };
  readonly props: Readonly<P>;
  readonly locked: boolean;
  readonly isActive: boolean;
  readonly name: string;
  /** Shallow-merges `patch` into this widget's saved props, so per-widget view state persists with the board. */
  readonly setProps: (patch: Partial<P>) => void;
}
