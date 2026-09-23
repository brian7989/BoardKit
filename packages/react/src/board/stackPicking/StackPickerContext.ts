import { createContext } from 'react';
import type { TileId } from 'boardkit-core';

export interface StackPickerContextValue {
  readonly pickingFrom: TileId | null;
  readonly startPicking: (tile: TileId) => void;
  readonly pick: (target: TileId) => void;
  readonly cancel: () => void;
}

export const StackPickerContext = createContext<StackPickerContextValue | null>(null);
