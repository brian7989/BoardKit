function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function itemTypes(item: unknown): readonly string[] {
  return isRecord(item) && typeof item.type === 'string' ? [item.type] : [];
}

function tileTypes(tile: unknown): readonly string[] {
  return isRecord(tile) && Array.isArray(tile.items) ? tile.items.flatMap(itemTypes) : [];
}

function boardTypes(board: unknown): readonly string[] {
  return isRecord(board) && Array.isArray(board.tiles) ? board.tiles.flatMap(tileTypes) : [];
}

// Reads defensively, before any parsing: `raw` is untrusted JSON, not yet known to have this shape.
export function readCandidateWidgetTypes(raw: unknown): readonly string[] {
  if (!isRecord(raw) || !Array.isArray(raw.boards)) return [];
  return raw.boards.flatMap(boardTypes);
}
