import type { HandlerMap } from './HandlerMap.js';

// TypeScript cannot relate `handlers[value.type]` to `value`'s narrowed type (a correlated
// union). HandlerMap guarantees the pairing, so this single cast is safe. Nowhere else casts.
export function dispatchByType<U extends { readonly type: string }, A extends unknown[], R>(
  handlers: HandlerMap<U, A, R>,
  value: U,
  ...args: A
): R {
  const handler = handlers[value.type as U['type']] as (value: U, ...args: A) => R;
  return handler(value, ...args);
}
