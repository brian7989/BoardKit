export interface FloatPositionField {
  readonly float?: { readonly x: number; readonly y: number; readonly free?: boolean };
}

function isFloatPosition(value: unknown): value is { readonly x: number; readonly y: number; readonly free?: unknown } {
  if (typeof value !== 'object' || value === null) return false;
  if (!('x' in value) || !('y' in value)) return false;
  return typeof value.x === 'number' && typeof value.y === 'number';
}

// Duck-typed, not Result-based: a malformed float is dropped rather than failing the whole parse.
// `legacyDefaultFree` is true for a pre-v3 document, where every float meant today's Free behaviour.
export function parseFloatPosition(value: unknown, legacyDefaultFree = false): FloatPositionField {
  if (!isFloatPosition(value)) return {};
  const free = typeof value.free === 'boolean' ? value.free : legacyDefaultFree;
  return free ? { float: { x: value.x, y: value.y, free: true } } : { float: { x: value.x, y: value.y } };
}
