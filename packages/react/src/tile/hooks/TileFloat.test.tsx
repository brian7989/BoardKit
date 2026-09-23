// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../../board/Board.js';
import { BoardProvider } from '../../provider/BoardProvider.js';
import type { ChangeMeta } from '../../provider/ChangeMeta.js';
import { defineBoards } from '../../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../../widget/index.js';
import { useTile } from '../useTile.js';
import type { TileOverlayProps } from '../TileOverlay.js';

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
const LONG_PRESS_MS = 250;
const BOARD = boardId('default');

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

function TestChrome({ tile }: TileOverlayProps) {
  const { float } = useTile(tile);
  return <button onClick={() => float.toggle()}>{float.isFloating ? 'Unfloat' : 'Float'}</button>;
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: Label });
const config = defineBoards({ grid: { cols: GRID_COLS, rows: GRID_ROWS }, widgets: [labelWidget] });

function seedState(): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t1'),
    widget: { id: widgetId('w1'), type: 'label', props: { label: 'hello' } },
    size: SIZE_SMALL,
    at: { x: cell(0), y: cell(0) },
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

function getTileElement(): Element {
  const el = screen.getByText('hello').closest('[data-bk-tile-id]');
  if (!el) throw new Error('tile element not found');
  return el;
}

function enterFloat(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Float' }));
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
  vi.useRealTimers();
});

describe('floating a tile', () => {
  it('toggles floating on and off through the host chrome', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    const { rerender } = render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    enterFloat();
    let state = onChange.mock.calls.at(-1)?.[0];
    if (!state) throw new Error('expected a committed state after floating');
    expect(state.boards[0]?.tiles[0]).toMatchObject({ float: { x: 0, y: 0 } });
    rerender(
      <BoardProvider config={config} value={state} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );
    expect(getTileElement()).toHaveAttribute('data-bk-floating', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Unfloat' }));

    state = onChange.mock.calls.at(-1)?.[0];
    if (!state) throw new Error('expected a committed state after unfloating');
    expect(state.boards[0]?.tiles[0]).not.toHaveProperty('float');
    rerender(
      <BoardProvider config={config} value={state} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );
    expect(getTileElement()).not.toHaveAttribute('data-bk-floating');
  });

  it('drags a floating tile freely, not snapped to the grid', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    const { rerender } = render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    enterFloat();
    let state = onChange.mock.calls.at(-1)?.[0];
    if (!state) throw new Error('expected a committed state after floating');
    rerender(
      <BoardProvider config={config} value={state} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.pointerDown(getTileElement(), { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 60, clientY: 35 });
    fireEvent.pointerUp(window, { clientX: 60, clientY: 35 });
    fireEvent.click(window);

    state = onChange.mock.calls.at(-1)?.[0];
    if (!state) throw new Error('expected a committed state after dragging');
    // 4x4 grid at 100px/cell: moving 50px right, 25px down is +0.5 cols, +0.25 rows.
    const dragged = state.boards[0]?.tiles[0];
    expect(dragged?.float?.x).toBeCloseTo(0.5);
    expect(dragged?.float?.y).toBeCloseTo(0.25);
  });

  it('touch: a still long-press lifts a floating tile, then a move commits MoveFloating', () => {
    vi.useFakeTimers();
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    const { rerender } = render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    enterFloat();
    let state = onChange.mock.calls.at(-1)?.[0];
    if (!state) throw new Error('expected a committed state after floating');
    rerender(
      <BoardProvider config={config} value={state} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 10, clientY: 10, button: 0, pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    expect(tileEl).toHaveAttribute('data-bk-lifted', 'true');

    fireEvent.pointerMove(window, { clientX: 60, clientY: 35, pointerType: 'touch' });
    fireEvent.pointerUp(window, { clientX: 60, clientY: 35, pointerType: 'touch' });

    state = onChange.mock.calls.at(-1)?.[0];
    if (!state) throw new Error('expected a committed state after dragging');
    const dragged = state.boards[0]?.tiles[0];
    expect(dragged?.float?.x).toBeCloseTo(0.5);
    expect(dragged?.float?.y).toBeCloseTo(0.25);
  });
});
