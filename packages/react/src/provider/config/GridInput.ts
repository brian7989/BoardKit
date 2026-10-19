import type { SizeKey } from '../../shared/size/SizeKey.js';

/** A grid's columns and rows: `'12x6'`, or `{ cols: 12, rows: 6 }`. */
export type GridInput = SizeKey | { readonly cols: number; readonly rows: number };
