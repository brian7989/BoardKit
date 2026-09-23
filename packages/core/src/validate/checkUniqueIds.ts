import { IssueKind, type Issue } from '../issues/index.js';
import type { Board, Tile, ValidCandidate } from '../model/index.js';
import type { BoardId } from '../shared/index.js';

interface SeenSets {
  readonly boards: Set<string>;
  readonly tiles: Set<string>;
  readonly widgets: Set<string>;
}

export function checkUniqueIds(state: ValidCandidate): readonly Issue[] {
  const seen: SeenSets = { boards: new Set(), tiles: new Set(), widgets: new Set() };
  return state.boards.flatMap((board) => issuesForBoard(board, seen));
}

function issuesForBoard(board: Board, seen: SeenSets): readonly Issue[] {
  const boardIssues = markSeen({ seen: seen.boards, id: board.id, message: `Duplicate board id ${board.id}.` });
  const tileIssues = board.tiles.flatMap((tile) => issuesForTile(tile, board.id, seen));
  return [...boardIssues, ...tileIssues];
}

function issuesForTile(tile: Tile, boardId: BoardId, seen: SeenSets): readonly Issue[] {
  const tileIssues = markSeen({ seen: seen.tiles, id: tile.id, message: `Duplicate tile id ${tile.id}.`, board: boardId, tile: tile.id });
  const widgetIssues = tile.items.flatMap((item) =>
    markSeen({ seen: seen.widgets, id: item.id, message: `Duplicate widget id ${item.id}.`, board: boardId, tile: tile.id }),
  );
  return [...tileIssues, ...widgetIssues];
}

interface MarkSeenInput {
  readonly seen: Set<string>;
  readonly id: string;
  readonly message: string;
  readonly board?: Issue['board'];
  readonly tile?: Issue['tile'];
}

function markSeen(input: MarkSeenInput): readonly Issue[] {
  if (!input.seen.has(input.id)) {
    input.seen.add(input.id);
    return [];
  }
  return [
    {
      kind: IssueKind.DuplicateId,
      message: input.message,
      ...(input.board !== undefined ? { board: input.board } : {}),
      ...(input.tile !== undefined ? { tile: input.tile } : {}),
    },
  ];
}
