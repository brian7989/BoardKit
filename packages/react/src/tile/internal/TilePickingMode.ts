import type { ValueOf } from 'boardkit-core';

/** A tile's role while the board is picking a "Stack with…" target. */
export const TilePickingMode = {
  Idle: 'idle',
  Source: 'source',
  Eligible: 'eligible',
  Ineligible: 'ineligible',
} as const;

export type TilePickingMode = ValueOf<typeof TilePickingMode>;
