declare const tileIdBrand: unique symbol;
/** A tile's unique id. */
export type TileId = string & { readonly [tileIdBrand]: true };

/** Brands a plain string as a `TileId`. */
export function tileId(value: string): TileId {
  return value as TileId;
}
