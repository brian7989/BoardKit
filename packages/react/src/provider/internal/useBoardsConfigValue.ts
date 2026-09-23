import { useMemo } from 'react';
import type { BoardId, BoardsState, Engine, Op } from 'boardkit-core';
import type { BoardsConfigContextValue } from './BoardsConfigContext.js';
import type { Dispatch } from './useDispatch.js';
import type { BoardProviderProps } from '../BoardProvider.js';

export interface UseBoardsConfigValueInput {
  readonly props: BoardProviderProps;
  readonly engine: Engine;
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly activeBoardId: BoardId;
  readonly locked: boolean;
  readonly dispatch: Dispatch;
  readonly canApply: (op: Op) => boolean;
  readonly getState: () => BoardsState;
  readonly subscribeState: (listener: () => void) => () => void;
  readonly reportWidth: (width: number) => void;
}

function toConfigValue(input: UseBoardsConfigValueInput): BoardsConfigContextValue {
  const { engine, grid, activeBoardId, locked, dispatch, canApply, getState, subscribeState, reportWidth, props: { config, onWidgetError } } = input;
  return {
    engine,
    grid,
    widgets: config.widgets,
    createId: config.createId,
    designCellSize: config.designCellSize,
    headerHeight: config.headerHeight,
    locked,
    activeBoardId,
    ...(onWidgetError ? { onWidgetError } : {}),
    dispatch,
    canApply,
    getState,
    subscribeState,
    reportWidth,
  };
}

export function useBoardsConfigValue(input: UseBoardsConfigValueInput): BoardsConfigContextValue {
  const { engine, grid, activeBoardId, locked, dispatch, canApply, getState, subscribeState, reportWidth, props: { config, onWidgetError } } = input;
  return useMemo<BoardsConfigContextValue>(
    () => toConfigValue(input),
    [engine, grid, config, locked, activeBoardId, onWidgetError, dispatch, canApply, getState, subscribeState, reportWidth],
  );
}
