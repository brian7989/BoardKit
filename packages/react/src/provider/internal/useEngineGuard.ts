import { useEffect } from 'react';
import type { BoardsState, Engine } from 'boardkit-core';

const NODE_ENV_PRODUCTION = 'production';

// Dev-only: catches a state/engine mismatch early; production relies on `overflow: clip` instead.
export function useEngineGuard(engine: Engine, state: BoardsState): void {
  useEffect(() => {
    if (process.env.NODE_ENV === NODE_ENV_PRODUCTION) return;
    const issues = engine.check(state);
    if (issues.length > 0) {
      const detail = issues.map((issue) => issue.message).join('; ');
      throw new Error(`Boards: \`value\` is not valid for this engine's config: ${detail}`);
    }
  }, [engine, state]);
}
