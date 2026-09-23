import type { Point } from '../../shared/geometry/Point.js';
import type { Px } from '../../shared/units/Px.js';
import type { TileId } from '../../shared/ids/TileId.js';
import { InteractionEventType } from './InteractionEventType.js';

// No DOM types cross this boundary.
export type InteractionEvent =
  | { readonly type: typeof InteractionEventType.Grab; readonly tile: TileId; readonly at: Point<Px> }
  | { readonly type: typeof InteractionEventType.Move; readonly at: Point<Px> }
  | { readonly type: typeof InteractionEventType.Release; readonly at: Point<Px> }
  | { readonly type: typeof InteractionEventType.Cancel };
