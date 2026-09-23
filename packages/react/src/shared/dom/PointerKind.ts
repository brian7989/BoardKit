import type { ValueOf } from 'boardkit-core';

export const PointerKind = {
  Mouse: 'mouse',
  Pen: 'pen',
  Touch: 'touch',
} as const;

export type PointerKind = ValueOf<typeof PointerKind>;
