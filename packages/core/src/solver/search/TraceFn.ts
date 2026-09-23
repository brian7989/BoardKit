export type TraceFn<S> = (event: { readonly node: S; readonly cost: number }) => void;
