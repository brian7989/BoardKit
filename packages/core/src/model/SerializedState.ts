import type { BoardsState } from './BoardsState.js';

// Strips symbols and unwraps branded primitives (BoardId → string, Cell → number, …).
type StripPrimitiveBrand<T> = T extends string ? string : T extends number ? number : T;

type Unbranded<T> = T extends readonly (infer U)[]
  ? readonly Unbranded<U>[]
  : T extends object
    ? { [K in keyof T as K extends symbol ? never : K]: Unbranded<T[K]> }
    : StripPrimitiveBrand<T>;

// The wire format: same shape as BoardsState with every brand erased. A plain JSON-compatible
// object, so `JSON.stringify` needs no help.
export type SerializedState = Unbranded<BoardsState>;
