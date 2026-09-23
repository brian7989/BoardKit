import { boardId } from '../shared/ids/BoardId.js';
import { ReflowChangeKind } from './ReflowChangeKind.js';
import type { ReflowChange } from './ReflowChange.js';
import type { Page } from './Page.js';

const PAGE_PREFIX = 'reflow-page-';

// Deterministic on the input's shape: same tile order and page count in, same ids out.
export function openPage(pages: Page[], changes: ReflowChange[]): Page {
  const page: Page = { id: boardId(`${PAGE_PREFIX}${pages.length}`), tiles: [], isNew: true };
  pages.push(page);
  changes.push({ board: page.id, kind: ReflowChangeKind.PageAdded });
  return page;
}
