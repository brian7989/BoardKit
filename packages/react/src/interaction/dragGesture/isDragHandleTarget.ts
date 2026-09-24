import { DragFrom } from '../../provider/DragFrom.js';
import { DataAttr } from '../../shared/index.js';

const NO_DRAG_SELECTOR = `[${DataAttr.NoDrag}]`;
const TILE_HEADER_SELECTOR = `[${DataAttr.TileHeader}]`;

// Excludes noDragProps always; with dragFrom 'header', also requires the header strip specifically.
export function isDragHandleTarget(target: EventTarget | null, dragFrom: DragFrom): boolean {
  if (!(target instanceof Element) || target.closest(NO_DRAG_SELECTOR)) return false;
  return dragFrom === DragFrom.Tile || target.closest(TILE_HEADER_SELECTOR) !== null;
}
