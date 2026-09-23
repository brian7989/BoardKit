declare const widgetIdBrand: unique symbol;
/** A widget instance's unique id. */
export type WidgetId = string & { readonly [widgetIdBrand]: true };

/** Brands a plain string as a `WidgetId`. */
export function widgetId(value: string): WidgetId {
  return value as WidgetId;
}
