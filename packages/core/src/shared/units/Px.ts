declare const pxBrand: unique symbol;
/** A screen pixel. */
export type Px = number & { readonly [pxBrand]: true };

/** Brands a number as a `Px` — a screen pixel, never interchangeable with `Cell`. */
export function px(value: number): Px {
  return value as Px;
}
