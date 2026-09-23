// The key `layouts` is stored under: dimensions alone identify a breakpoint's grid.
export function gridKey(grid: { readonly cols: number; readonly rows: number }): string {
  return `${grid.cols}x${grid.rows}`;
}
