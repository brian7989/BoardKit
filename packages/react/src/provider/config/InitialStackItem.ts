/** A widget stacked under an `initialLayout` entry's own widget, on the same tile. */
export interface InitialStackItem {
  readonly widget: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly name?: string;
}
