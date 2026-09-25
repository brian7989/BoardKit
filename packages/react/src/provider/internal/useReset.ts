import { useCallback } from 'react';
import type { Engine } from 'boardkit-core';
import { ChangeReason } from '../ChangeReason.js';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { createInitialState } from '../config/createInitialState.js';
import type { CommitBoardsState } from './useControllableBoardsState.js';

export interface UseResetInput {
  readonly config: BoardsConfig;
  // The active breakpoint's engine: the reset state is reflowed onto it, restoring its authored layout.
  readonly engine: Engine;
  readonly commit: CommitBoardsState;
}

export function useReset(input: UseResetInput): () => void {
  const { config, engine, commit } = input;
  return useCallback(() => commit(engine.reflow(createInitialState(config)).state, { reason: ChangeReason.Reset }), [config, engine, commit]);
}
