import type { LayoutTile } from '../model/LayoutTile.js';
import type { Tile } from '../model/Tile.js';
import type { WidgetInstance } from '../model/WidgetInstance.js';
import type { EngineContext } from '../engine/EngineContext.js';
import { isSizeAllowed, type Size } from '../shared/sizes/Size.js';
import { tileId, type TileId } from '../shared/ids/TileId.js';
import type { WidgetId } from '../shared/ids/WidgetId.js';
import type { ReflowEntry } from './flattenReadingOrder.js';

/** A tile rebuilt from a saved layout entry, to go back exactly where that entry says. */
export interface SavedPlacement {
  readonly entry: ReflowEntry;
  readonly at: LayoutTile;
}

/** The tiles a reflow places: those its target grid's saved layout describes, and the rest, placed fresh. */
export interface Recomposition {
  readonly saved: readonly SavedPlacement[];
  readonly fresh: readonly ReflowEntry[];
}

interface Pool {
  readonly widgets: ReadonlyMap<WidgetId, WidgetInstance>;
  readonly tiles: ReadonlyMap<TileId, Tile>;
  readonly claimed: Set<WidgetId>;
}

function clampActive(active: number, items: readonly WidgetInstance[]): number {
  return active >= 0 && active < items.length ? active : 0;
}

// A save from before stacks varied by breakpoint names no widgets: its tile keeps whatever it holds now.
function savedItems(at: LayoutTile, pool: Pool): readonly WidgetInstance[] {
  const items = at.items ? at.items.flatMap((id) => pool.widgets.get(id) ?? []) : (pool.tiles.get(at.tile)?.items ?? []);
  return items.filter((item) => !pool.claimed.has(item.id));
}

function savedActive(at: LayoutTile, pool: Pool): number {
  return at.active ?? pool.tiles.get(at.tile)?.active ?? 0;
}

function placementFor(at: LayoutTile, pool: Pool): SavedPlacement | null {
  const items = savedItems(at, pool);
  if (items.length === 0) return null;
  for (const item of items) pool.claimed.add(item.id);
  const tile: Tile = { id: at.tile, col: at.col, row: at.row, size: at.size, items, active: clampActive(savedActive(at, pool), items) };
  return { entry: { tile, board: at.board }, at };
}

function fits(size: Size, items: readonly WidgetInstance[], ctx: EngineContext): boolean {
  return items.every((item) => isSizeAllowed(size, ctx.catalog[item.type]?.sizes ?? []));
}

// `t-a`, then `t-a-2`, `t-a-3`, …
const FIRST_SUFFIX = 2;

function uniqueId(id: TileId, used: Set<string>): TileId {
  let candidate: string = id;
  for (let suffix = FIRST_SUFFIX; used.has(candidate); suffix += 1) candidate = `${id}-${suffix}`;
  used.add(candidate);
  return tileId(candidate);
}

interface Leftover {
  readonly entry: ReflowEntry;
  readonly rest: readonly WidgetInstance[];
}

// A widget the saved layout doesn't know (added since) joins the saved tile its old tile-mates are on, when it fits there.
function adopt(leftover: Leftover, saved: SavedPlacement[], ctx: EngineContext): boolean {
  const index = saved.findIndex((placement) => placement.entry.tile.items.some((item) => leftover.entry.tile.items.some((mate) => mate.id === item.id)));
  const host = saved[index];
  if (!host || !fits(host.entry.tile.size, leftover.rest, ctx)) return false;
  const tile = { ...host.entry.tile, items: [...host.entry.tile.items, ...leftover.rest] };
  saved[index] = { entry: { ...host.entry, tile }, at: host.at };
  return true;
}

function freshEntry(leftover: Leftover, used: Set<string>): ReflowEntry {
  const { entry, rest } = leftover;
  const shown = entry.tile.items[entry.tile.active];
  const active = Math.max(0, rest.findIndex((item) => item.id === shown?.id));
  return { tile: { ...entry.tile, id: uniqueId(entry.tile.id, used), items: rest, active }, board: entry.board };
}

/** Rebuilds the tiles a saved layout describes from the widgets `entries` hold: each breakpoint keeps its own stacks. */
export function recompose(entries: readonly ReflowEntry[], layout: readonly LayoutTile[], ctx: EngineContext): Recomposition {
  const pool: Pool = {
    widgets: new Map(entries.flatMap((entry) => entry.tile.items.map((item) => [item.id, item] as const))),
    tiles: new Map(entries.map((entry) => [entry.tile.id, entry.tile] as const)),
    claimed: new Set(),
  };
  const saved = layout.flatMap((at) => placementFor(at, pool) ?? []);
  const used = new Set<string>(saved.map((placement) => placement.entry.tile.id));
  const fresh: ReflowEntry[] = [];
  for (const entry of entries) {
    const rest = entry.tile.items.filter((item) => !pool.claimed.has(item.id));
    if (rest.length === 0 || adopt({ entry, rest }, saved, ctx)) continue;
    fresh.push(freshEntry({ entry, rest }, used));
  }
  return { saved, fresh };
}
