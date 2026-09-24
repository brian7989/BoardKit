// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../board/Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';
import { useTile } from './useTile.js';
import type { TileHeaderProps } from './TileHeader.js';
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

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

function TestHeader({ name }: TileHeaderProps) {
  return <span>header:{name}</span>;
}

function FloatToggle({ tile }: TileOverlayProps) {
  const { float } = useTile(tile);
  return <button onClick={() => float.toggle()}>{float.isFloating ? 'Unfloat' : 'Float'}</button>;
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: Label });
const config = defineBoards({ grid: { cols: GRID_COLS, rows: GRID_ROWS }, widgets: [labelWidget] });

function seedState(): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: T1,
    widget: { id: widgetId('w1'), type: 'label', props: { label: 'Alpha' } },
    size: SIZE_SMALL,
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

function tileElement(): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-bk-tile-id="${T1}"]`);
  if (!el) throw new Error('tile not found');
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

describe('dragFrom', () => {
  it('does not start a drag from a pointerdown on a header-dragged tile\'s body', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    drag(screen.getByText('Alpha'), 60);
    expect(tileElement()).not.toHaveAttribute('data-bk-active');
    release(60);
  });

  it('starts a drag from a pointerdown on the header strip', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileHeader={TestHeader}>
        <Board />
      </BoardProvider>,
    );

    const header = within(tileElement()).getByText('header:Label');
    drag(header, 60);
    expect(tileElement()).toHaveAttribute('data-bk-active', 'true');
    release(60);
  });

  it('drags a headerless tile from its body', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );

    drag(screen.getByText('Alpha'), 60);
    expect(tileElement()).toHaveAttribute('data-bk-active', 'true');
    release(60);
  });

  it('dragFrom="tile" restores whole-tile dragging even with a header', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileHeader={TestHeader} dragFrom="tile">
        <Board />
      </BoardProvider>,
    );

    drag(screen.getByText('Alpha'), 60);
    expect(tileElement()).toHaveAttribute('data-bk-active', 'true');
    release(60);
  });

  it('a floating tile with a header follows the same header-only rule', () => {
    const onChange = vi.fn<(next: BoardsState) => void>();
    const { rerender } = render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileHeader={TestHeader} tileOverlay={FloatToggle}>
        <Board />
      </BoardProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Float' }));
    const floated = onChange.mock.calls.at(-1)?.[0];
    if (!floated) throw new Error('expected a committed state after floating');
    rerender(
      <BoardProvider config={config} value={floated} onChange={onChange} tileHeader={TestHeader} tileOverlay={FloatToggle}>
        <Board />
      </BoardProvider>,
    );
    expect(tileElement()).toHaveAttribute('data-bk-floating', 'true');

    // A body drag never attaches a window pointermove listener, so no further MoveFloating commits.
    const callsBeforeBodyDrag = onChange.mock.calls.length;
    drag(screen.getByText('Alpha'), 60);
    release(60);
    expect(onChange.mock.calls.length).toBe(callsBeforeBodyDrag);

    const header = within(tileElement()).getByText('header:Label');
    drag(header, 60);
    release(60);
    const moved = onChange.mock.calls.at(-1)?.[0];
    expect(moved?.boards[0]?.tiles[0]?.float?.x).not.toBe(floated.boards[0]?.tiles[0]?.float?.x);
  });
});
