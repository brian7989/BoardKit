declare const boardIdBrand: unique symbol;
/** A board's unique id. */
export type BoardId = string & { readonly [boardIdBrand]: true };

/** Brands a plain string as a `BoardId`. The only place a `BoardId` is minted. */
export function boardId(value: string): BoardId {
  return value as BoardId;
}
