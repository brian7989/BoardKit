// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { defineBoards } from '../provider/config/defineBoards.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';
import type { TileOverlayProps } from '../tile/TileOverlay.js';
import { Board } from './Board.js';
import { useBoardTiles } from './useBoardTiles.js';

class PointerEventPolyfill extends MouseEvent {
  public readonly pointerId: number;
  public readonly pointerType: string;
  public readonly isPrimary: boolean;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? 'mouse';
    this.isPrimary = params.isPrimary ?? true;
  }
}

if (typeof window.PointerEvent === 'undefined') {
  Object.assign(window, { PointerEvent: PointerEventPolyfill });
}

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const CELL_PX = 100;
const GRID_COLS = 4;
const GRID_ROWS = 4;
const BOARD = boardId('default');
const T1 = tileId('t1');
const T2 = tileId('t2');

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: Label });
const config = defineBoards({ grid: { cols: GRID_COLS, rows: GRID_ROWS }, widgets: [labelWidget] });

function seedState(): BoardsState {
  let state = config.engine.empty();
  const add = (tile: typeof T1, id: string, at: { x: number; y: number }) => {
    const result = config.engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tile,
      widget: { id: widgetId(id), type: 'label', props: { label: id } },
      size: SIZE_SMALL,
      at: { x: cell(at.x), y: cell(at.y) },
    });
    if (!result.ok) throw new Error('fixture setup failed');
    state = result.value.state;
  };
  add(T1, 'w1', { x: 0, y: 0 });
  add(T2, 'w2', { x: 2, y: 0 });
  return state;
}

function positionsOf(tiles: readonly { id: string; col: number; row: number }[]): Record<string, { col: number; row: number }> {
  return Object.fromEntries(tiles.map((tile) => [tile.id, { col: tile.col, row: tile.row }]));
}

function CommittedProbe() {
  const tiles = useBoardTiles();
  return <pre data-testid="tiles">{JSON.stringify(positionsOf(tiles))}</pre>;
}

function PreviewProbe({ tile }: TileOverlayProps) {
  const tiles = useBoardTiles();
  if (tile.id !== T1) return null;
  return <pre data-testid="tiles">{JSON.stringify(positionsOf(tiles))}</pre>;
}

function tileElement(id: typeof T1): Element {
  const el = document.querySelector(`[data-bk-tile-id="${id}"]`);
  if (!el) throw new Error(`tile ${id} not found`);
  return el;
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: GRID_COLS * CELL_PX,
    bottom: GRID_ROWS * CELL_PX,
    width: GRID_COLS * CELL_PX,
    height: GRID_ROWS * CELL_PX,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useBoardTiles', () => {
  it('returns the committed tiles at rest, falling back outside an interactive Board', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <CommittedProbe />
      </BoardProvider>,
    );

    expect(JSON.parse(screen.getByTestId('tiles').textContent ?? '{}')).toEqual({
      t1: { col: 0, row: 0 },
      t2: { col: 2, row: 0 },
    });
  });

  it('returns the previewed arrangement while a valid drag is in progress', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={PreviewProbe}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.pointerDown(tileElement(T1), { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 110, clientY: 10 });

    const tiles = JSON.parse(screen.getByTestId('tiles').textContent ?? '{}');
    expect(tiles.t1).toEqual({ col: 1, row: 0 });
    expect(tiles.t2).toEqual({ col: 2, row: 0 });

    fireEvent.pointerUp(window, { clientX: 110, clientY: 10 });
  });
});
