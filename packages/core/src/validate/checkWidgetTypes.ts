import { IssueKind, type Issue } from '../issues/index.js';
import { isSizeAllowed, type BoardId } from '../shared/index.js';
import type { Tile, ValidCandidate, WidgetInstance } from '../model/index.js';
import type { EngineContext } from '../engine/index.js';

export function checkWidgetTypes(state: ValidCandidate, ctx: EngineContext): readonly Issue[] {
  return state.boards.flatMap((board) => board.tiles.flatMap((tile) => issuesForTile({ tile, boardId: board.id, ctx })));
}

interface TileCtx {
  readonly tile: Tile;
  readonly boardId: BoardId;
  readonly ctx: EngineContext;
}

function issuesForTile(input: TileCtx): readonly Issue[] {
  return input.tile.items.flatMap((item) => issueForItem({ ...input, item }));
}

interface ItemCtx extends TileCtx {
  readonly item: WidgetInstance;
}

function issueForItem(input: ItemCtx): readonly Issue[] {
  const { item, tile, boardId, ctx } = input;
  const manifest = ctx.catalog[item.type];
  if (!manifest) {
    return [{ kind: IssueKind.UnknownWidgetType, board: boardId, tile: tile.id, message: `Widget type "${item.type}" is not registered.` }];
  }
  if (!isSizeAllowed(tile.size, manifest.sizes)) {
    return [{ kind: IssueKind.SizeUnsupported, board: boardId, tile: tile.id, message: `Widget "${item.type}" does not support this tile's size.` }];
  }
  return [];
}
