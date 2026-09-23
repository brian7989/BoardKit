import { useMemo } from 'react';
import type { BoardId, BoardsState, Engine } from 'boardkit-core';
import type { BoardsContextValue } from '../BoardsContext.js';
import type { BoardProviderProps } from '../BoardProvider.js';

export interface UseBoardsContextValueInput {
  readonly props: BoardProviderProps;
  readonly state: BoardsState;
  readonly engine: Engine;
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly activeBoardId: BoardId;
  readonly setActiveBoard: BoardsContextValue['setActiveBoard'];
  readonly locked: boolean;
  readonly dispatch: BoardsContextValue['dispatch'];
  readonly canApply: BoardsContextValue['canApply'];
}

export function useBoardsContextValue(input: UseBoardsContextValueInput): BoardsContextValue {
  const { state, engine, grid, activeBoardId, setActiveBoard, locked, dispatch, canApply, props: { config, onWidgetError } } = input;
  return useMemo<BoardsContextValue>(
    () => ({
      state,
      activeBoardId,
      setActiveBoard,
      engine,
      grid,
      widgets: config.widgets,
      createId: config.createId,
      locked,
      ...(onWidgetError ? { onWidgetError } : {}),
      dispatch,
      canApply,
    }),
    [state, activeBoardId, setActiveBoard, engine, grid, config, locked, dispatch, canApply, onWidgetError],
  );
}
