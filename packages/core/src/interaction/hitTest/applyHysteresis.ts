const HALF_CELL = 0.5;

// Prevents flicker between adjacent cells; jumps > 1 cell snap directly.
export function applyHysteresis(previous: number, raw: number, threshold: number): number {
  const naive = Math.round(raw);
  if (Math.abs(naive - previous) > 1) return naive;
  if (naive === previous + 1) return raw >= previous + HALF_CELL + threshold ? naive : previous;
  if (naive === previous - 1) return raw <= previous - HALF_CELL - threshold ? naive : previous;
  return previous;
}
