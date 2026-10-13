export interface SavedGrid {
  readonly cols: number;
  readonly rows: number;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null && key in value ? Reflect.get(value, key) : undefined;
}

/** The `{ cols, rows }` a saved board claims to be on, or null if it doesn't hold a usable one. */
export function readSavedGrid(raw: unknown): SavedGrid | null {
  const grid = field(raw, 'grid');
  const cols = field(grid, 'cols');
  const rows = field(grid, 'rows');
  return isPositiveInteger(cols) && isPositiveInteger(rows) ? { cols, rows } : null;
}
