import type { SizeInput } from '../../shared/size/SizeInput.js';
import type { AtInput } from './AtInput.js';

/**
 * One widget an uncontrolled `BoardProvider` starts with. Omit `page` for the default
 * first-fit placement (spills onto a new page once earlier ones are full); give `page` to
 * target a specific extra page instead, 0-indexed after however many that default fill used.
 */
export interface InitialLayoutTile {
  readonly widget: string;
  readonly size?: SizeInput;
  readonly at?: AtInput;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly name?: string;
  readonly page?: number;
  /**
   * Places this tile already floating at this position, instead of onto the grid: snapped into
   * the Overlay layer by default, or unsnapped and collision-free with `free: true`.
   */
  readonly float?: { readonly x: number; readonly y: number; readonly free?: boolean };
}
