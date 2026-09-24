import { createContext } from 'react';
import type { BoardId, BoardsState, Engine, Op } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';
import type { Dispatch } from './useDispatch.js';
import type { DragFrom } from '../DragFrom.js';

// Split from BoardsContextValue so a Tile can read it without subscribing to `state`, which changes on every committed op.
export interface BoardsConfigContextValue {
  readonly engine: Engine;
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly createId: () => string;
  readonly designCellSize: number;
  readonly headerHeight: number;
  readonly locked: boolean;
  readonly dragFrom: DragFrom;
  readonly activeBoardId: BoardId;
  readonly onWidgetError?: (error: Error, widgetType: string) => void;
  readonly dispatch: Dispatch;
  readonly canApply: (op: Op) => boolean;
  readonly getState: () => BoardsState;
  readonly subscribeState: (listener: () => void) => () => void;
  // <Board> reports its measured container width here; a breakpoint change reflows and commits.
  readonly reportWidth: (width: number) => void;
}

export const BoardsConfigContext = createContext<BoardsConfigContextValue | null>(null);
