import { useCallback, useMemo } from 'react';
import { OpType, tileId, widgetId, type Applied, type AddOp, type BoardId, type Cell, type Point, type Rejection, type Result, type WidgetInstance } from 'boardkit-core';
import { useBoards } from './useBoards.js';
import { parseSizeInput } from '../../shared/size/parseSizeInput.js';
import type { SizeInput } from '../../shared/size/SizeInput.js';
import type { WidgetManifest } from '../../widget/index.js';

/** Options for `WidgetCatalog.add`: where and how big to place the new tile. */
export interface AddWidgetOptions {
  readonly size?: SizeInput;
  readonly at?: Point<Cell>;
  /**
   * Adds the widget already floating at this position, instead of onto the grid: snapped into
   * the Overlay layer by default, or unsnapped and collision-free with `free: true`.
   */
  readonly float?: { readonly x: number; readonly y: number; readonly free?: boolean };
}

/** The result of `useWidgetCatalog`: every registered widget, plus `add` to place one. */
export interface WidgetCatalog {
  readonly widgets: readonly WidgetManifest[];
  readonly add: (type: string, options?: AddWidgetOptions) => Result<Applied, Rejection>;
}

function instanceOf(type: string, manifest: WidgetManifest, createId: () => string): WidgetInstance {
  return { id: widgetId(createId()), type, ...(manifest.defaultProps ? { props: manifest.defaultProps } : {}) };
}

interface BuildAddOpInput {
  readonly type: string;
  readonly manifest: WidgetManifest;
  readonly board: BoardId;
  readonly createId: () => string;
  readonly options: AddWidgetOptions | undefined;
}

function buildAddOp(input: BuildAddOpInput): AddOp | null {
  const { type, manifest, board, createId, options } = input;
  const size = options?.size ? parseSizeInput(options.size) : manifest.sizes[0];
  if (!size) return null;
  const widget = instanceOf(type, manifest, createId);
  return {
    type: OpType.Add,
    board,
    tileId: tileId(createId()),
    widget,
    size,
    ...(options?.at ? { at: options.at } : {}),
    ...(options?.float ? { float: options.float } : {}),
  };
}

/** The widget catalog to list, and `add` to place one at a default or given size/position. */
export function useWidgetCatalog(): WidgetCatalog {
  const { widgets, activeBoardId, dispatch, createId } = useBoards();
  const list = useMemo(() => [...widgets.values()], [widgets]);

  const add = useCallback(
    (type: string, options?: AddWidgetOptions) => {
      const manifest = widgets.get(type);
      if (!manifest) throw new Error(`Widget type "${type}" is not registered.`);
      const op = buildAddOp({ type, manifest, board: activeBoardId, createId, options });
      if (!op) throw new Error(`Widget type "${type}" has no sizes to add at.`);
      return dispatch(op);
    },
    [widgets, activeBoardId, dispatch, createId],
  );

  return useMemo(() => ({ widgets: list, add }), [list, add]);
}
