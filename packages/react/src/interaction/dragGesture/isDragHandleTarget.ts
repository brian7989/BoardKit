import { DataAttr } from '../../shared/index.js';

const NO_DRAG_SELECTOR = `[${DataAttr.NoDrag}]`;
const TILE_SELECTOR = `[${DataAttr.TileId}]`;
const HANDLE_SELECTOR = `[${DataAttr.DragHandle}]`;

// Never from noDragProps. A tile that renders a drag handle drags only from it; one that doesn't drags from anywhere.
export function isDragHandleTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element) || target.closest(NO_DRAG_SELECTOR)) return false;
  const hasHandle = target.closest(TILE_SELECTOR)?.querySelector(HANDLE_SELECTOR);
  return !hasHandle || target.closest(HANDLE_SELECTOR) !== null;
}
