export type HandlerMap<U extends { readonly type: string }, A extends unknown[], R> = {
  readonly [K in U['type']]: (value: Extract<U, { type: K }>, ...args: A) => R;
};
