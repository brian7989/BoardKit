import type { Point } from '../../shared/geometry/Point.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { Px } from '../../shared/units/Px.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { Applied } from '../../ops/outcome/Applied.js';
import type { Rejection } from '../../ops/outcome/Rejection.js';
import type { Result } from '../../shared/result/Result.js';
import { InteractionPhase } from './InteractionPhase.js';

// preview is recomputed on every move, so always current.
export type InteractionState =
  | { readonly phase: typeof InteractionPhase.Idle }
  | {
      readonly phase: typeof InteractionPhase.Armed;
      readonly tile: TileId;
      readonly origin: Point<Px>;
      readonly grabOffset: Point<Px>;
    }
  | {
      readonly phase: typeof InteractionPhase.Dragging;
      readonly tile: TileId;
      readonly grabOffset: Point<Px>;
      readonly target: Point<Cell>;
      readonly preview: Result<Applied, Rejection>;
    };

// Narrowed aliases for phase handlers that only ever see one phase.
export type ArmedInteractionState = Extract<InteractionState, { readonly phase: typeof InteractionPhase.Armed }>;
export type DraggingInteractionState = Extract<InteractionState, { readonly phase: typeof InteractionPhase.Dragging }>;
