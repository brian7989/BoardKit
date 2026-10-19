import type { BoardsState, WidgetInstance } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { LayoutEntry } from './LayoutEntry.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import type { ResolvedInitialTile } from './resolveInitialTile.js';
import { resolveEntries } from './resolveEntries.js';
import { placeFirstFit, type PageProgress } from './placeFirstFit.js';
import { heroSize } from './heroSize.js';
import { tileIdForWidget } from './nextInitialId.js';
import { allTiles } from './allTiles.js';

export interface AddMissingTilesInput {
  // The primary breakpoint's config, and the state built on it so far.
  readonly config: BoardsConfig;
  readonly state: BoardsState;
  // Another breakpoint's config and layout, which may list widgets `state` lacks.
  readonly from: BoardsConfig;
  readonly entries: readonly LayoutEntry[];
}

// By widget, not tile: a widget one layout stacks and another lists on its own is still one widget.
function widgetIds(state: BoardsState): ReadonlySet<string> {
  return new Set(allTiles(state).flatMap((tile) => tile.items.map((item) => item.id)));
}

// Its authored spot belongs to the other grid, so here it just goes wherever first-fit finds room.
function unpositioned(resolved: ResolvedInitialTile): ResolvedInitialTile {
  const { float: _float, ...rest } = resolved;
  return rest;
}

// A stacked widget whose stack's own widget is already here goes on a tile of its own.
function ownTile(config: BoardsConfig, widget: WidgetInstance): ResolvedInitialTile | null {
  const manifest = config.widgets.get(widget.type);
  if (!manifest) return null;
  return { manifest, size: heroSize(manifest, config.grid), widget, tileId: tileIdForWidget(widget.id), stack: [] };
}

function missingTiles(input: AddMissingTilesInput): readonly ResolvedInitialTile[] {
  const present = widgetIds(input.state);
  const out: ResolvedInitialTile[] = [];
  for (const { resolved } of resolveEntries({ config: input.from, counts: new Map() }, input.entries)) {
    if (!present.has(resolved.widget.id)) out.push(unpositioned(resolved));
    else out.push(...resolved.stack.filter((widget) => !present.has(widget.id)).flatMap((widget) => ownTile(input.config, widget) ?? []));
  }
  return out;
}

/** Adds every widget another breakpoint's layout lists but `state` doesn't have yet, so each breakpoint shares one set of widgets. */
export function addMissingTiles(input: AddMissingTilesInput): BoardsState {
  const ctx: InitialPlacementCtx = { config: input.config, counts: new Map() };
  let progress: PageProgress = { state: input.state, pages: input.state.boards.map((board) => board.id) };
  for (const resolved of missingTiles(input)) progress = placeFirstFit(ctx, progress, resolved);
  return progress.state;
}
