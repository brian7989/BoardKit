import type { BoardsConfig } from './BoardsConfig.js';

/** Shared context threaded through initial-layout placement: the config, and each type's id counter. */
export interface InitialPlacementCtx {
  readonly config: BoardsConfig;
  readonly counts: Map<string, number>;
}
