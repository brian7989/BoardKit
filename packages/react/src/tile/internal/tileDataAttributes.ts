import type { Tile } from 'boardkit-core';
import { DataAttr } from '../../shared/index.js';
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
