import { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { BoardId, BoardsState, Op, Rejection } from 'boardkit-core';
import { TileContext, type TileComponent } from '../tile/index.js';
import { BoardsContext } from './BoardsContext.js';
import { BoardsConfigContext } from './internal/BoardsConfigContext.js';
import { useControllableActiveBoard } from './internal/useControllableActiveBoard.js';
import { useControllableBoardsState } from './internal/useControllableBoardsState.js';
import { useControllableLocked } from './internal/useControllableLocked.js';
import { useBoardsStateStore } from './internal/useBoardsStateStore.js';
import { useActiveBreakpoint } from './internal/useActiveBreakpoint.js';
import { useDispatch } from './internal/useDispatch.js';
import { useReset } from './internal/useReset.js';
import { useEngineGuard } from './internal/useEngineGuard.js';
import { toActiveBoardInput } from './internal/toActiveBoardInput.js';
import { toLockedInput } from './internal/toLockedInput.js';
import { toPersistenceInput } from './internal/toPersistenceInput.js';
import { toStateInput } from './internal/toStateInput.js';
import { useBoardsContextValue } from './internal/useBoardsContextValue.js';
import { useBoardsConfigValue } from './internal/useBoardsConfigValue.js';
import { useBoardsPersistence } from './persistence/useBoardsPersistence.js';
import type { ChangeMeta } from './ChangeMeta.js';
import type { BoardsConfig } from './config/BoardsConfig.js';

/** Props for `BoardProvider`: its config, controlled/uncontrolled state, and host callbacks. */
export interface BoardProviderProps {
  readonly config: BoardsConfig;
  /** The host's own tile: its card, header, menu and so on, wrapped around the widget it's given. Omit to render just the widget. */
  readonly tile?: TileComponent;
  readonly value?: BoardsState;
  readonly defaultValue?: BoardsState;
  /** Uncontrolled boards only: saves to `localStorage` under this key and loads it back on mount. A controlled board is saved by your own store; use `restoreBoards` when loading it. */
  readonly storageKey?: string;
  readonly onChange?: (next: BoardsState, meta: ChangeMeta) => void;
  readonly activeBoard?: BoardId;
  readonly defaultActiveBoard?: BoardId;
  readonly onActiveBoardChange?: (next: BoardId) => void;
  readonly locked?: boolean;
  readonly defaultLocked?: boolean;
  readonly onLockedChange?: (next: boolean) => void;
  readonly onReject?: (rejection: Rejection, op: Op) => void;
  readonly onWidgetError?: (error: Error, widgetType: string) => void;
  readonly children?: ReactNode;
}

function TileProvider({ tile, children }: BoardProviderProps) {
  return <TileContext.Provider value={tile ?? null}>{children}</TileContext.Provider>;
}

/** Owns controlled/uncontrolled board state and provides it to `children` through context. */
export function BoardProvider(props: BoardProviderProps) {
  const { state, commit, getState } = useControllableBoardsState(toStateInput(props));
  const [activeBoardId, setActiveBoard] = useControllableActiveBoard(toActiveBoardInput(props, state));
  const [locked] = useControllableLocked(toLockedInput(props));
  const { engine, grid, reportWidth } = useActiveBreakpoint({ breakpoints: props.config.breakpoints, getState, commit });
  useEngineGuard(engine, state);
  const stateStore = useBoardsStateStore(state);

  const dispatch = useDispatch({ engine, getState, commit, ...(props.onReject ? { onReject: props.onReject } : {}) });
  const canApply = useCallback((op: Op) => engine.apply(getState(), op).ok, [engine, getState]);
  const reset = useReset({ config: props.config, engine, commit });
  useBoardsPersistence(toPersistenceInput(props, props.config.engine, state));
  const contextValue = useBoardsContextValue({ props, state, engine, grid, activeBoardId, setActiveBoard, locked, dispatch, canApply });
  const configInput = { props, engine, grid, activeBoardId, locked, dispatch, canApply, getState: stateStore.getState, subscribeState: stateStore.subscribe, reportWidth, reset };
  const configValue = useBoardsConfigValue(configInput);

  return (
    <BoardsContext.Provider value={contextValue}>
      <BoardsConfigContext.Provider value={configValue}>
        <TileProvider {...props} />
      </BoardsConfigContext.Provider>
    </BoardsContext.Provider>
  );
}
