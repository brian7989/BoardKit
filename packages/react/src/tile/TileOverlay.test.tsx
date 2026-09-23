// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../board/Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import type { ChangeMeta } from '../provider/ChangeMeta.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';
import type { TileOverlayProps } from './TileOverlay.js';

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
  interface AddInput {
    readonly tile: typeof T1;
    readonly id: string;
    readonly label: string;
    readonly at: { x: number; y: number };
  }
  const add = ({ tile, id, label, at }: AddInput) => {
    const result = config.engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tile,
      widget: { id: widgetId(id), type: 'label', props: { label } },
      size: SIZE_SMALL,
      at: { x: cell(at.x), y: cell(at.y) },
    });
    if (!result.ok) throw new Error('fixture setup failed');
    state = result.value.state;
  };
  add({ tile: T1, id: 'w1', label: 'Alpha', at: { x: 0, y: 0 } });
  add({ tile: T2, id: 'w2', label: 'Beta', at: { x: 1, y: 0 } });
  return state;
}

const renderCounts: Record<string, number> = {};
const mountCounts: Record<string, number> = {};

function CountingChrome({ tile }: TileOverlayProps) {
  renderCounts[tile.id] = (renderCounts[tile.id] ?? 0) + 1;
  useEffect(() => {
    mountCounts[tile.id] = (mountCounts[tile.id] ?? 0) + 1;
  }, [tile.id]);
  return <button>chrome-{tile.id}</button>;
}

function tileElement(id: typeof T1): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-bk-tile-id="${id}"]`);
  if (!el) throw new Error(`tile ${id} not found`);
  return el;
}

beforeEach(() => {
  Object.keys(renderCounts).forEach((key) => delete renderCounts[key]);
  Object.keys(mountCounts).forEach((key) => delete mountCounts[key]);
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

describe('TileOverlay', () => {
  it('renders the host chrome inside the tile', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={CountingChrome}>
        <Board />
      </BoardProvider>,
    );

    expect(within(tileElement(T1)).getByText(`chrome-${T1}`)).toBeInTheDocument();
  });

  it('renders nothing extra without a tileOverlay prop', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not start a drag from a pointerdown on the chrome', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={CountingChrome}>
        <Board />
      </BoardProvider>,
    );

    const chromeButton = within(tileElement(T1)).getByText(`chrome-${T1}`);
    fireEvent.pointerDown(chromeButton, { clientX: 10, clientY: 10, button: 0 });
    expect(tileElement(T1)).not.toHaveAttribute('data-bk-active');

    fireEvent.pointerMove(window, { clientX: 60, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 60, clientY: 10 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('never remounts, and never re-renders, a sibling tile whose preview is unaffected by another tile\'s drag', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={CountingChrome}>
        <Board />
      </BoardProvider>,
    );

    expect(mountCounts[T1]).toBe(1);
    expect(mountCounts[T2]).toBe(1);
    const siblingRenders = renderCounts[T2];

    // Released outside the board cancels rather than commits, isolating the interaction store from the board-data context.
    fireEvent.pointerDown(tileElement(T1), { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 30, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 50, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 60, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 1000, clientY: 1000 });

    expect(renderCounts[T1]).toBeGreaterThan(1);
    expect(renderCounts[T2]).toBe(siblingRenders);
    expect(mountCounts[T1]).toBe(1);
    expect(mountCounts[T2]).toBe(1);
  });

  it('re-renders a sibling tile that IS displaced by the dragged tile\'s preview', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={CountingChrome}>
        <Board />
      </BoardProvider>,
    );

    const siblingRenders = renderCounts[T2];
    const styleBeforeDrag = tileElement(T2).style.transform;

    fireEvent.pointerDown(tileElement(T1), { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });

    expect(renderCounts[T2]).toBeGreaterThan(siblingRenders);
    expect(tileElement(T2).style.transform).not.toBe(styleBeforeDrag);

    fireEvent.pointerUp(window, { clientX: 150, clientY: 50 });
  });
});
