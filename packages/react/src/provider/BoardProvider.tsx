import { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { BoardId, BoardsState, Op, Rejection } from 'boardkit-core';
import { TileOverlayContext, TileHeaderContext, type TileOverlayComponent, type TileHeaderComponent } from '../tile/index.js';
import { BoardsContext } from './BoardsContext.js';
import { BoardsConfigContext } from './internal/BoardsConfigContext.js';
import { useControllableActiveBoard } from './internal/useControllableActiveBoard.js';
import { useControllableBoardsState } from './internal/useControllableBoardsState.js';
import { useControllableLocked } from './internal/useControllableLocked.js';
import { useBoardsStateStore } from './internal/useBoardsStateStore.js';
import { useActiveBreakpoint } from './internal/useActiveBreakpoint.js';
import { useDispatch } from './internal/useDispatch.js';
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
import type { DragFrom } from './DragFrom.js';

/** Props for `BoardProvider`: its config, controlled/uncontrolled state, and host callbacks. */
export interface BoardProviderProps {
  readonly config: BoardsConfig;
  /** The host's own tile chrome, rendered on top of every tile. Omit for no chrome. */
  readonly tileOverlay?: TileOverlayComponent;
  /** The host's tile header, rendered as a strip above the body, or as an overlay over a `header: false` widget's full-size body. Omit for no header. */
  readonly tileHeader?: TileHeaderComponent;
  /** Where a tile's drag gesture may start: `'header'` (default) restricts it to the header strip when the tile has one; `'tile'` allows anywhere on the tile. */
  readonly dragFrom?: DragFrom;
  readonly value?: BoardsState;
  readonly defaultValue?: BoardsState;
  /** Persists uncontrolled state to `localStorage` under this key, loading it back on mount. */
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

function TileChromeProviders({ tileOverlay, tileHeader, children }: BoardProviderProps) {
  return (
    <TileOverlayContext.Provider value={tileOverlay ?? null}>
      <TileHeaderContext.Provider value={tileHeader ?? null}>{children}</TileHeaderContext.Provider>
    </TileOverlayContext.Provider>
  );
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
  useBoardsPersistence(toPersistenceInput(props, props.config.engine, state));
  const contextValue = useBoardsContextValue({ props, state, engine, grid, activeBoardId, setActiveBoard, locked, dispatch, canApply });
  const configInput = { props, engine, grid, activeBoardId, locked, dispatch, canApply, getState: stateStore.getState, subscribeState: stateStore.subscribe, reportWidth };
  const configValue = useBoardsConfigValue(configInput);

  return (
    <BoardsContext.Provider value={contextValue}>
      <BoardsConfigContext.Provider value={configValue}>
        <TileChromeProviders {...props} />
      </BoardsConfigContext.Provider>
    </BoardsContext.Provider>
  );
}
