import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { createInitialState, type CreateInitialStateOptions } from '../config/createInitialState.js';
import { restoreSave } from './restoreSave.js';

/**
 * Turns a board your app saved (in Zustand, a backend, anywhere) back into a valid one: migrated,
 * repaired, and on the grid it was saved on. Nothing saved, or nothing usable, gives the authored layouts.
 */
export function restoreBoards(config: BoardsConfig, saved: unknown, options: CreateInitialStateOptions = {}): BoardsState {
  return restoreSave(config, saved, 'the saved board') ?? createInitialState(config, options);
}
