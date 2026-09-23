import type { Engine } from '../engine/Engine.js';
import type { BoardsState } from '../model/index.js';
import type { BoardId } from '../shared/ids/BoardId.js';
import type { Rect } from '../shared/geometry/Rect.js';
import type { Px } from '../shared/units/Px.js';
import type { InteractionOptions } from './state/InteractionOptions.js';

// `state` reflects the last committed op, never a stale snapshot.
export interface StepContext {
  readonly engine: Engine;
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly boardRectPx: Rect<Px>;
  readonly options: InteractionOptions;
}
