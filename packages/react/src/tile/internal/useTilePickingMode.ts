import { useSyncExternalStore } from 'react';
import { findTile, sizesEqual, type BoardId, type BoardsState, type Tile, type TileId } from 'boardkit-core';
import type { StackPickerContextValue } from '../../board/stackPicking/StackPickerContext.js';
import { useStackPicker } from '../../board/stackPicking/useStackPicker.js';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';
import { TilePickingMode } from './TilePickingMode.js';

export interface UseTilePickingModeResult {
  readonly mode: TilePickingMode;
  readonly onClick: (() => void) | undefined;
}

interface ResolveEligibleInput {
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly pickingFrom: TileId | null;
  readonly tile: Tile;
}

// A primitive, read through useSyncExternalStore, so a tile re-renders only when eligibility flips.
function resolveEligible(input: ResolveEligibleInput): boolean {
  const { state, board, pickingFrom, tile } = input;
  if (pickingFrom === null || pickingFrom === tile.id) return false;
  const source = findTile(state, board, pickingFrom);
  return source !== undefined && sizesEqual(source.size, tile.size);
}

function resolveMode(picker: StackPickerContextValue | null, tile: Tile, eligible: boolean): TilePickingMode {
  if (!picker || picker.pickingFrom === null) return TilePickingMode.Idle;
  if (picker.pickingFrom === tile.id) return TilePickingMode.Source;
  return eligible ? TilePickingMode.Eligible : TilePickingMode.Ineligible;
}

function resolveOnClick(picker: StackPickerContextValue | null, tile: Tile, mode: TilePickingMode): (() => void) | undefined {
  if (mode === TilePickingMode.Source) return picker?.cancel;
  if (mode === TilePickingMode.Eligible) return () => picker?.pick(tile.id);
  return undefined;
}

export function useTilePickingMode(tile: Tile): UseTilePickingModeResult {
  const picker = useStackPicker();
  const { activeBoardId, getState, subscribeState } = useBoardsConfig();
  const pickingFrom = picker?.pickingFrom ?? null;
  const getEligible = () => resolveEligible({ state: getState(), board: activeBoardId, pickingFrom, tile });
  const eligible = useSyncExternalStore(subscribeState, getEligible, getEligible);
  const mode = resolveMode(picker, tile, eligible);

  return { mode, onClick: resolveOnClick(picker, tile, mode) };
}
