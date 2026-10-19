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
import { useTile } from './useTile.js';
import type { TileProps } from './TileContext.js';

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

const labelWidget = defineWidget<LabelProps>({
  type: 'label',
  title: 'Label',
  sizes: [SIZE_SMALL],
  surface: { background: 'rgb(1, 2, 3)' },
  component: Label,
});
const bareWidget = defineWidget<LabelProps>({ type: 'bare', title: 'Bare', sizes: [SIZE_SMALL], header: false, component: Label });
const config = defineBoards({ grid: { cols: GRID_COLS, rows: GRID_ROWS }, widgets: [labelWidget, bareWidget] });

function seedState(type: 'label' | 'bare' = 'label'): BoardsState {
  let state = config.engine.empty();
  for (const [tile, label, x] of [[T1, 'Alpha', 0], [T2, 'Beta', 1]] as const) {
    const result = config.engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tile,
      widget: { id: widgetId(`w-${tile}`), type, props: { label } },
      size: SIZE_SMALL,
      at: { x: cell(x), y: cell(0) },
    });
    if (!result.ok) throw new Error('fixture setup failed');
    state = result.value.state;
  }
  return state;
}

const renderCounts: Record<string, number> = {};
const mountCounts: Record<string, number> = {};

function HandleTile({ tile, widget, dragHandle, surface, header }: TileProps) {
  renderCounts[tile.id] = (renderCounts[tile.id] ?? 0) + 1;
  useEffect(() => {
    mountCounts[tile.id] = (mountCounts[tile.id] ?? 0) + 1;
  }, [tile.id]);
  return (
    <div data-testid={`card-${tile.id}`} style={surface}>
      {header ? <div {...dragHandle}>handle-{tile.id}</div> : null}
      {widget}
    </div>
  );
}

function PlainTile({ tile, widget }: TileProps) {
  const { remove } = useTile(tile);
  return (
    <div>
      {widget}
      <button data-bk-no-drag="true" onClick={() => remove()}>
        remove-{tile.id}
      </button>
    </div>
  );
}

function tileElement(id: typeof T1 = T1): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-bk-tile-id="${id}"]`);
  if (!el) throw new Error(`tile ${id} not found`);
  return el;
}

function drag(target: Element, dx: number): void {
  fireEvent.pointerDown(target, { clientX: 10, clientY: 10, button: 0 });
  fireEvent.pointerMove(window, { clientX: 10 + dx, clientY: 10 });
}

// Ends the gesture and consumes the click-suppressor a real drag arms, so it never swallows a later test's click.
function release(dx: number): void {
  fireEvent.pointerUp(window, { clientX: 10 + dx, clientY: 10 });
  fireEvent.click(window);
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

describe('tile slot', () => {
  it('renders the widget inside the host tile, with the manifest surface', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tile={HandleTile}>
        <Board />
      </BoardProvider>,
    );

    const card = within(tileElement()).getByTestId(`card-${T1}`);
    expect(within(card).getByText('Alpha')).toBeInTheDocument();
    expect(card).toHaveStyle({ background: 'rgb(1, 2, 3)' });
  });

  it('renders the widget alone without a tile prop', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );

    expect(within(tileElement()).getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByTestId(`card-${T1}`)).not.toBeInTheDocument();
  });

  it('passes header=false for a widget whose manifest opts out of a header', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('bare')} tile={HandleTile}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.queryByText(`handle-${T1}`)).not.toBeInTheDocument();
    expect(within(tileElement()).getByText('Alpha')).toBeInTheDocument();
  });

  it('drags only from the drag handle when the tile has one', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tile={HandleTile}>
        <Board />
      </BoardProvider>,
    );

    drag(screen.getByText('Alpha'), 60);
    expect(tileElement()).not.toHaveAttribute('data-bk-active');
    release(60);

    drag(screen.getByText(`handle-${T1}`), 60);
    expect(tileElement()).toHaveAttribute('data-bk-active', 'true');
    release(60);
  });

  it('drags from anywhere on a tile without a drag handle', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('bare')} tile={HandleTile}>
        <Board />
      </BoardProvider>,
    );

    drag(screen.getByText('Alpha'), 60);
    expect(tileElement()).toHaveAttribute('data-bk-active', 'true');
    release(60);
  });

  it('never drags from no-drag controls, and their hooks commit', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tile={PlainTile}>
        <Board />
      </BoardProvider>,
    );

    const button = screen.getByText(`remove-${T1}`);
    drag(button, 60);
    expect(tileElement()).not.toHaveAttribute('data-bk-active');
    release(60);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(onChange.mock.calls.at(-1)?.[0].boards[0]?.tiles.map((tile) => tile.id)).toEqual([T2]);
  });

  it('never remounts or re-renders a sibling host tile the drag leaves alone', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tile={HandleTile}>
        <Board />
      </BoardProvider>,
    );
    const siblingRenders = renderCounts[T2];

    // Released outside the board cancels rather than commits.
    const handle = screen.getByText(`handle-${T1}`);
    fireEvent.pointerDown(handle, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 30, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 60, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 1000, clientY: 1000 });

    expect(renderCounts[T1]).toBeGreaterThan(1);
    expect(renderCounts[T2]).toBe(siblingRenders);
    expect(mountCounts).toEqual({ [T1]: 1, [T2]: 1 });
  });
});
