/** One entry of a responsive grid: the grid it uses once the board is at least `minWidth` wide. */
export interface GridBreakpoint {
  readonly minWidth: number;
  readonly cols: number;
  readonly rows: number;
  readonly cellAspect?: number;
}
