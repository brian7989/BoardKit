import { useMemo } from 'react';
import type { BoardId, BoardsState, Engine, Op } from 'boardkit-core';
import type { BoardsConfigContextValue } from './BoardsConfigContext.js';
import type { Dispatch } from './useDispatch.js';
import type { BoardProviderProps } from '../BoardProvider.js';
import { DragFrom } from '../DragFrom.js';

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
  readonly reset: () => void;
}

function toConfigValue(input: UseBoardsConfigValueInput): BoardsConfigContextValue {
  const { engine, grid, activeBoardId, locked, dispatch, canApply, getState, subscribeState, reportWidth, reset, props: { config, onWidgetError, dragFrom } } = input;
  return {
    engine,
    grid,
    widgets: config.widgets,
    createId: config.createId,
    designCellSize: config.designCellSize,
    headerHeight: config.headerHeight,
    locked,
    dragFrom: dragFrom ?? DragFrom.Header,
    activeBoardId,
    ...(onWidgetError ? { onWidgetError } : {}),
    dispatch, canApply, getState, subscribeState, reportWidth, reset,
  };
}

export function useBoardsConfigValue(input: UseBoardsConfigValueInput): BoardsConfigContextValue {
  const { engine, grid, activeBoardId, locked, dispatch, canApply, getState, subscribeState, reportWidth, reset, props: { config, onWidgetError, dragFrom } } = input;
  return useMemo<BoardsConfigContextValue>(
    () => toConfigValue(input),
    [engine, grid, config, locked, dragFrom, activeBoardId, onWidgetError, dispatch, canApply, getState, subscribeState, reportWidth, reset],
  );
}
