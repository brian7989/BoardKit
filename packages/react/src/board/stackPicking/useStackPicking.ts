import { useMemo } from 'react';
import type { TileId } from 'boardkit-core';
import { useStackPicker } from './useStackPicker.js';

/** The board's active "Stack with…" pick: which tile started it, and how to cancel. */
export interface StackPicking {
  readonly sourceTile: TileId;
  readonly cancel: () => void;
}

/** The board's "Stack with…" picking mode, or null when none is under way. */
export function useStackPicking(): StackPicking | null {
  const picker = useStackPicker();

  return useMemo(() => {
    if (!picker || picker.pickingFrom === null) return null;
    return { sourceTile: picker.pickingFrom, cancel: picker.cancel };
  }, [picker]);
}
