export interface InitialIds {
  readonly tile: string;
  readonly widget: string;
}

// `t-${type}` / `w-${type}` for a type's first use in the layout, `-2`, `-3`, … after — so a
// unique widget type keeps a stable, readable id and a repeated one (a packed page) still works.
export function nextInitialId(counts: Map<string, number>, type: string): InitialIds {
  const count = (counts.get(type) ?? 0) + 1;
  counts.set(type, count);
  const suffix = count > 1 ? `-${count}` : '';
  return { tile: `t-${type}${suffix}`, widget: `w-${type}${suffix}` };
}

/** The tile id `nextInitialId` pairs with a widget id, for a widget that ends up on a tile of its own. */
export function tileIdForWidget(widget: string): string {
  return `t${widget.slice(1)}`;
}
