import { useCallback, useEffect, useMemo, useState } from 'react';
import { OpType, type TileId } from 'boardkit-core';
import { useBoards } from '../../provider/hooks/useBoards.js';
import type { StackPickerContextValue } from './StackPickerContext.js';

const ESCAPE_KEY = 'Escape';

function useCancelOnEscape(active: boolean, cancel: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === ESCAPE_KEY) cancel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, cancel]);
}

export function useStackPickerValue(): StackPickerContextValue {
  const { dispatch, activeBoardId } = useBoards();
  const [pickingFrom, setPickingFrom] = useState<TileId | null>(null);

  const cancel = useCallback(() => setPickingFrom(null), []);
  const startPicking = useCallback((tile: TileId) => setPickingFrom(tile), []);
  const pick = useCallback(
    (target: TileId) => {
      setPickingFrom((from) => {
        if (from) dispatch({ type: OpType.Stack, board: activeBoardId, from, onto: target });
        return null;
      });
    },
    [dispatch, activeBoardId],
  );

  useCancelOnEscape(pickingFrom !== null, cancel);
  return useMemo(() => ({ pickingFrom, startPicking, pick, cancel }), [pickingFrom, startPicking, pick, cancel]);
}
