import { useCallback } from 'react';
import type { InteractionController, InteractionEvent } from 'boardkit-core';

export function useDispatchAt(
  controller: InteractionController,
  syncBeforeDispatch: (event: InteractionEvent) => void,
): (event: InteractionEvent) => void {
  return useCallback(
    (event: InteractionEvent) => {
      syncBeforeDispatch(event);
      controller.dispatch(event);
    },
    [controller, syncBeforeDispatch],
  );
}
