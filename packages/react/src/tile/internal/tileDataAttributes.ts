import type { Tile } from 'boardkit-core';
import { DataAttr } from '../../shared/index.js';
import type { DragFrom } from '../../provider/DragFrom.js';
import { TilePickingMode } from './TilePickingMode.js';

export function tileDataAttributes(tile: Tile): Record<string, string> {
  return { [DataAttr.TileId]: tile.id };
}

export function tileFloatDataAttributes(floating: boolean): Record<string, string> {
  return floating ? { [DataAttr.Floating]: 'true' } : {};
}

export function tileLiftedDataAttributes(lifted: boolean): Record<string, string> {
  return lifted ? { [DataAttr.Lifted]: 'true' } : {};
}

export function tileInteractionDataAttributes(active: boolean, valid: boolean): Record<string, string> {
  if (!active) return {};
  return { [DataAttr.Active]: 'true', [DataAttr.Valid]: valid ? 'true' : 'false' };
}

export function tileStackDataAttributes(mode: TilePickingMode): Record<string, string> {
  return mode === TilePickingMode.Idle ? {} : { [DataAttr.StackRole]: mode };
}

// Drives the default stylesheet's cursor: grab on whichever element is actually the drag handle.
export function tileDragFromDataAttributes(dragFrom: DragFrom): Record<string, string> {
  return { [DataAttr.DragFrom]: dragFrom };
}
