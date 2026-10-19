import type { BoardsConfig } from './BoardsConfig.js';
import { createInitialState } from './createInitialState.js';

const NODE_ENV_PRODUCTION = 'production';

/** Dev-only: builds the initial state once, so a layout's warnings show as soon as the config is defined. */
export function checkLayouts(config: BoardsConfig): void {
  if (process.env.NODE_ENV === NODE_ENV_PRODUCTION) return;
  createInitialState(config);
}
