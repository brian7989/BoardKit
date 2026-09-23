declare const cellBrand: unique symbol;
/** A grid unit — one column or row of the board. */
export type Cell = number & { readonly [cellBrand]: true };

/** Brands a number as a `Cell` — a grid unit, never interchangeable with `Px`. */
export function cell(value: number): Cell {
  return value as Cell;
}
