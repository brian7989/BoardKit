import type { BoardsState } from 'boardkit-core';
import { warnOnce } from '../../shared/dev/warnOnce.js';

/** Warns about every tile `state` shows that the breakpoint's own layout doesn't list, naming the page it landed on. */
export function warnUnlisted(state: BoardsState, listed: ReadonlySet<string>, breakpoint: string): void {
  state.boards.forEach((board, index) => {
    for (const tile of board.tiles) {
      if (tile.items.some((item) => listed.has(item.id))) continue;
      const type = tile.items[0]?.type ?? tile.id;
      warnOnce(
        `unlisted:${breakpoint}:${tile.id}`,
        `Boards: "${type}" isn't in the "${breakpoint}" layout, so it was placed at the first free spot (page ${index + 1}). Add it to that layout, or to its \`hide\` list to leave it off.`,
      );
    }
  });
}
