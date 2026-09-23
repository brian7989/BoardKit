export interface FloatPositionField {
  readonly float?: { readonly x: number; readonly y: number };
}

function isFloatPosition(value: unknown): value is { readonly x: number; readonly y: number } {
  if (typeof value !== 'object' || value === null) return false;
  if (!('x' in value) || !('y' in value)) return false;
  return typeof value.x === 'number' && typeof value.y === 'number';
}

// Duck-typed, not Result-based: a malformed float is dropped rather than failing the whole parse.
export function parseFloatPosition(value: unknown): FloatPositionField {
  return isFloatPosition(value) ? { float: value } : {};
}
