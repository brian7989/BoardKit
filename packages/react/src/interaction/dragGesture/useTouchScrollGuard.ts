import { useEffect } from 'react';
import type { RefObject } from 'react';

export interface UseTouchScrollGuardInput {
  readonly ref: RefObject<HTMLDivElement>;
  readonly enabled: boolean;
  readonly activeRef: { readonly current: boolean };
}

function preventIfActive(activeRef: { readonly current: boolean }, event: TouchEvent): void {
  if (activeRef.current && event.cancelable) event.preventDefault();
}

// Registered on the tile element before any touch begins: Chrome fixes cancelability from listeners present at touchstart.
export function useTouchScrollGuard(input: UseTouchScrollGuardInput): void {
  const { ref, enabled, activeRef } = input;
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;
    const onTouchMove = (event: TouchEvent) => preventIfActive(activeRef, event);
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => element.removeEventListener('touchmove', onTouchMove);
  }, [ref, enabled, activeRef]);
}
