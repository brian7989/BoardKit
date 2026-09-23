import { DataAttr } from './DataAttr.js';

/** Spread onto a host-rendered element to opt it out of starting a tile drag. */
export function noDragProps(): Record<string, string> {
  return { [DataAttr.NoDrag]: 'true' };
}
