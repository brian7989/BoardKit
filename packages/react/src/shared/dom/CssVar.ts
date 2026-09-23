import type { ValueOf } from 'boardkit-core';

export const CssVar = {
  Col: '--bk-col',
  Row: '--bk-row',
  Cols: '--bk-cols',
  Rows: '--bk-rows',
} as const;

export type CssVar = ValueOf<typeof CssVar>;
