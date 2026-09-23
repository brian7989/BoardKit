import { createContext } from 'react';
import type { Applied, BoardId, BoardsState, Engine, Op, Rejection, Result } from 'boardkit-core';
import type { WidgetManifest } from '../widget/index.js';

/** The board-level context every hook reads: live state, engine, widgets, and dispatch. */
export interface BoardsContextValue {
  readonly state: BoardsState;
  readonly activeBoardId: BoardId;
  readonly engine: Engine;
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly createId: () => string;
  readonly locked: boolean;
  readonly onWidgetError?: (error: Error, widgetType: string) => void;
  setActiveBoard(board: BoardId): void;
  dispatch(op: Op): Result<Applied, Rejection>;
  canApply(op: Op): boolean;
}

export const BoardsContext = createContext<BoardsContextValue | null>(null);
