import { useCallback, useState } from 'react';

export interface UseControllableLockedInput {
  readonly locked?: boolean;
  readonly defaultLocked?: boolean;
  readonly onLockedChange?: (next: boolean) => void;
}

const DEFAULT_LOCKED = false;

export function useControllableLocked(input: UseControllableLockedInput): readonly [boolean, (next: boolean) => void] {
  const [uncontrolled, setUncontrolled] = useState(input.defaultLocked ?? DEFAULT_LOCKED);
  const controlled = input.locked;
  const locked = controlled ?? uncontrolled;

  const onLockedChange = input.onLockedChange;
  const setLocked = useCallback(
    (next: boolean) => {
      if (controlled === undefined) setUncontrolled(next);
      onLockedChange?.(next);
    },
    [controlled, onLockedChange],
  );

  return [locked, setLocked];
}
