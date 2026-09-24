// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../board/Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { useBoards } from '../provider/hooks/useBoards.js';
import { DataAttr, noDragProps } from '../shared/index.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';
import type { TileHeaderProps } from './TileHeader.js';

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
const DESIGN_CELL_SIZE = 160;
const DEFAULT_HEADER_HEIGHT = 32;
const BODY_HEIGHT_WITH_HEADER = DESIGN_CELL_SIZE - DEFAULT_HEADER_HEIGHT;

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props, designSize }: WidgetProps<LabelProps>) {
  return (
    <span>
      {props.label} {designSize.width}x{designSize.height}
    </span>
  );
}

function Boom(): never {
  throw new Error('widget exploded');
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: Label });
const boomWidget = defineWidget({ type: 'boom', title: 'Boom', sizes: [SIZE_SMALL], component: Boom });
const noHeaderWidget = defineWidget<LabelProps>({ type: 'no-header', title: 'NoHeader', sizes: [SIZE_SMALL], header: false, component: Label });
const config = defineBoards({ grid: { cols: GRID_COLS, rows: GRID_ROWS }, widgets: [labelWidget, boomWidget, noHeaderWidget] });

function TestHeader({ name, placement }: TileHeaderProps) {
  return (
    <div>
      <span>header:{name}</span>
      <span data-testid="header-placement">{placement}</span>
      <button {...noDragProps()}>menu</button>
    </div>
  );
}

const headerRenders: Record<string, number> = {};

function CountingHeader({ tile }: TileHeaderProps) {
  headerRenders[tile.id] = (headerRenders[tile.id] ?? 0) + 1;
  return <span>header:{tile.id}</span>;
}

function seedState(type: string): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: T1,
    widget: { id: widgetId('w1'), type, props: { label: 'Alpha' } },
    size: SIZE_SMALL,
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

function seedTwoTiles(): BoardsState {
  interface AddInput {
    readonly tile: typeof T1;
    readonly id: string;
    readonly at: { x: number; y: number };
  }
  let state = config.engine.empty();
  const add = ({ tile, id, at }: AddInput) => {
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
  add({ tile: T1, id: 'w1', at: { x: 0, y: 0 } });
  add({ tile: T2, id: 'w2', at: { x: 1, y: 0 } });
  return state;
}

function tileElement(id: typeof T1): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-bk-tile-id="${id}"]`);
  if (!el) throw new Error(`tile ${id} not found`);
  return el;
}

function RenameButton() {
  const { dispatch, activeBoardId, state } = useBoards();
  const tile = state.boards.find((board) => board.id === activeBoardId)?.tiles[0];
  return (
    <button
      onClick={() => tile && dispatch({ type: OpType.RenameWidget, board: activeBoardId, tile: tile.id, widget: tile.items[0].id, name: 'Renamed' })}
    >
      rename
    </button>
  );
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
  Object.keys(headerRenders).forEach((key) => delete headerRenders[key]);
});

describe('tileHeader', () => {
  it('renders the header with the widget name, updating after a rename', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('label')} tileHeader={TestHeader}>
        <RenameButton />
        <Board />
      </BoardProvider>,
    );

    expect(screen.getByText('header:Label')).toBeInTheDocument();
    fireEvent.click(screen.getByText('rename'));
    expect(screen.getByText('header:Renamed')).toBeInTheDocument();
  });

  it('excludes the header strip from the body designSize, placed as a strip', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('label')} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.getByText(`Alpha ${DESIGN_CELL_SIZE}x${BODY_HEIGHT_WITH_HEADER}`)).toBeInTheDocument();
    expect(tileElement(T1).querySelector('[data-bk-tile-header]')).toHaveAttribute(DataAttr.TileHeaderPlacement, 'strip');
  });

  it('renders the header as an overlay for a widget with header: false, keeping the body at full design size', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('no-header')} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.getByText('header:NoHeader')).toBeInTheDocument();
    expect(tileElement(T1).querySelector('[data-bk-tile-header]')).toHaveAttribute(DataAttr.TileHeaderPlacement, 'overlay');
    expect(screen.getByText(`Alpha ${DESIGN_CELL_SIZE}x${DESIGN_CELL_SIZE}`)).toBeInTheDocument();
  });

  it('still shows the header when the widget crashes', () => {
    const onWidgetError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <BoardProvider config={config} defaultValue={seedState('boom')} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.getByText('header:Boom')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    onWidgetError.mockRestore();
  });

  it('starts a drag from a pointerdown on the header strip', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('label')} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    const header = tileElement(T1).querySelector('[data-bk-tile-header]');
    if (!header) throw new Error('header strip not found');
    fireEvent.pointerDown(header, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 60, clientY: 10 });
    expect(tileElement(T1)).toHaveAttribute('data-bk-active', 'true');

    fireEvent.pointerUp(window, { clientX: 60, clientY: 10 });
  });

  it('does not start a drag from a pointerdown on a noDragProps button inside the header', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState('label')} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.pointerDown(screen.getByText('menu'), { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 60, clientY: 10 });
    expect(tileElement(T1)).not.toHaveAttribute('data-bk-active');

    fireEvent.pointerUp(window, { clientX: 60, clientY: 10 });
  });

  it("never re-renders a sibling tile's header on another tile's drag", () => {
    render(
      <BoardProvider config={config} defaultValue={seedTwoTiles()} tileHeader={CountingHeader}>
        <Board />
      </BoardProvider>,
    );

    const siblingRenders = headerRenders[T2];
    const header = within(tileElement(T1)).getByText(`header:${T1}`);

    // Small moves within T1's own cell, released outside the board to cancel: T2 is never
    // displaced, so its memoized Tile (and header) should see no re-render at all.
    fireEvent.pointerDown(header, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { clientX: 30, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 50, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 60, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 1000, clientY: 1000 });

    expect(headerRenders[T1]).toBeGreaterThan(1);
    expect(headerRenders[T2]).toBe(siblingRenders);
  });
});
