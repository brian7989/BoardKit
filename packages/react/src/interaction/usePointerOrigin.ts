import { useEffect, useState } from 'react';
import type { FractionalCell, PointerSnapshot, TileId } from 'boardkit-core';

export interface UsePointerOriginInput {
  readonly subscribePointer: (listener: () => void) => () => void;
  readonly getPointerSnapshot: () => PointerSnapshot;
  readonly tile: TileId;
}

function select(input: UsePointerOriginInput): FractionalCell | null {
  const snapshot = input.getPointerSnapshot();
  return snapshot && snapshot.tile === input.tile ? snapshot.origin : null;
}

function sameOrigin(a: FractionalCell | null, b: FractionalCell | null): boolean {
  if (a === b) return true;
  return a !== null && b !== null && a.x === b.x && a.y === b.y;
}

// Bails out of setState with the same object when the selected slice is unchanged, so only the dragged tile re-renders.
export function usePointerOrigin(input: UsePointerOriginInput): FractionalCell | null {
  const { subscribePointer, tile } = input;
  const [origin, setOrigin] = useState<FractionalCell | null>(() => select(input));

  useEffect(() => {
    setOrigin(select(input));
    return subscribePointer(() => {
      setOrigin((previous) => {
        const next = select(input);
        return sameOrigin(previous, next) ? previous : next;
      });
    });
  }, [subscribePointer, tile]);

  return origin;
}
