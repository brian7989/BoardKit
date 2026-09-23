import type { ValueOf } from '../../../shared/unions/ValueOf.js';

export const Direction = {
  Down: 'down',
  Right: 'right',
  Up: 'up',
  Left: 'left',
} as const;

export type Direction = ValueOf<typeof Direction>;
