// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from './Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import type { ChangeMeta } from '../provider/ChangeMeta.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';

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

// jsdom does not implement PointerEvent; shim so fireEvent gets clientX/clientY/button.
if (typeof window.PointerEvent === 'undefined') {
  Object.assign(window, { PointerEvent: PointerEventPolyfill });
}

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const CELL_PX = 100;
const GRID_COLS = 4;
const GRID_ROWS = 4;
const LONG_PRESS_MS = 250;

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

let buttonClicks = 0;

function Label({ props }: WidgetProps<LabelProps>) {
  return (
    <div>
      <span>{props.label}</span>
      <button onClick={() => (buttonClicks += 1)}>click</button>
    </div>
  );
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: Label });
const config = defineBoards({ grid: { cols: GRID_COLS, rows: GRID_ROWS }, widgets: [labelWidget] });

function seedState(): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: boardId('default'),
    tileId: tileId('t1'),
    widget: { id: widgetId('w1'), type: 'label', props: { label: 'hello' } },
    size: SIZE_SMALL,
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

function getTileElement(): Element {
  const el = screen.getByText('hello').closest('[data-bk-tile-id]');
  if (!el) throw new Error('tile element not found');
  return el;
}

beforeEach(() => {
  buttonClicks = 0;
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

describe('drag interaction', () => {
  it('drags a tile one cell right and commits the move', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50 });
    // Consumes this gesture's click-suppressor before the next test's click.
    fireEvent.click(window);

    expect(onChange).toHaveBeenCalled();
    const nextState = onChange.mock.calls.at(-1)?.[0];
    expect(nextState?.boards[0]?.tiles[0]).toMatchObject({ col: 1, row: 0 });
  });

  it('blocks the native browser drag only while a tile gesture is under way', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const nativeDrag = (): boolean => !document.body.dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));

    fireEvent.pointerDown(getTileElement(), { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 90, clientY: 90 });
    expect(nativeDrag()).toBe(true);

    fireEvent.pointerUp(window, { clientX: 90, clientY: 90 });
    fireEvent.click(window);
    expect(nativeDrag()).toBe(false);
  });

  it('does not attach a pointer handler when locked', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} locked>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();
    expect(tileEl).not.toHaveAttribute('data-bk-draggable');

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50 });

    expect(tileEl).not.toHaveAttribute('data-bk-active');
  });

  it('a pointerdown followed by pointerup with no movement commits nothing', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerUp(window, { clientX: 50, clientY: 50 });

    expect(onChange).not.toHaveBeenCalled();
    expect(tileEl).not.toHaveAttribute('data-bk-active');
  });

  it('a click on a plain button inside a widget fires its onClick and commits nothing', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const button = screen.getByRole('button', { name: 'click' });

    fireEvent.pointerDown(button, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerUp(window, { clientX: 10, clientY: 10 });
    fireEvent.click(button);

    expect(buttonClicks).toBe(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('suppresses the click fired after a real drag, so a button inside the tile does not receive it', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();
    const button = screen.getByRole('button', { name: 'click' });

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50 });
    fireEvent.click(button);

    expect(buttonClicks).toBe(0);
  });

  it('touch: moving past the jitter tolerance before the long-press fires starts no drag', () => {
    vi.useFakeTimers();
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0, pointerType: 'touch' });
    fireEvent.pointerMove(window, { clientX: 70, clientY: 50, pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));

    expect(tileEl).not.toHaveAttribute('data-bk-lifted');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('touch: a still long-press lifts the tile, and a further move then commits a Move', () => {
    vi.useFakeTimers();
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0, pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));

    expect(tileEl).toHaveAttribute('data-bk-lifted', 'true');

    fireEvent.pointerMove(window, { clientX: 150, clientY: 50, pointerType: 'touch' });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50, pointerType: 'touch' });

    const nextState = onChange.mock.calls.at(-1)?.[0];
    expect(nextState?.boards[0]?.tiles[0]).toMatchObject({ col: 1, row: 0 });
  });

  it('blocks a cancelable touchmove only once the touch drag is active', () => {
    vi.useFakeTimers();
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0, pointerType: 'touch' });

    const beforeActivation = new Event('touchmove', { cancelable: true, bubbles: true });
    tileEl.dispatchEvent(beforeActivation);
    expect(beforeActivation.defaultPrevented).toBe(false);

    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));

    const duringActiveDrag = new Event('touchmove', { cancelable: true, bubbles: true });
    tileEl.dispatchEvent(duringActiveDrag);
    expect(duringActiveDrag.defaultPrevented).toBe(true);
  });

  it('locked: neither mouse nor touch can drag, and clicks inside widgets still work', () => {
    vi.useFakeTimers();
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} locked onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();
    const button = screen.getByRole('button', { name: 'click' });

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50 });

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0, pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50, pointerType: 'touch' });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50, pointerType: 'touch' });

    expect(onChange).not.toHaveBeenCalled();
    expect(tileEl).not.toHaveAttribute('data-bk-lifted');

    fireEvent.click(button);
    expect(buttonClicks).toBe(1);
  });

  it('restores the previous userSelect value, not an empty string, after a mouse drag ends', () => {
    document.body.style.userSelect = 'text';
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });
    expect(document.body.style.userSelect).toBe('none');
    fireEvent.pointerUp(window, { clientX: 150, clientY: 50 });
    fireEvent.click(window);

    expect(document.body.style.userSelect).toBe('text');
    document.body.style.userSelect = '';
  });

  it('unmounting mid mouse-drag restores userSelect and removes the window listeners', () => {
    const { unmount } = render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 50 });
    expect(document.body.style.userSelect).toBe('none');

    unmount();

    expect(document.body.style.userSelect).toBe('');
    expect(() => fireEvent.pointerMove(window, { clientX: 300, clientY: 50 })).not.toThrow();
  });

  it('unmounting during a pending touch long-press clears the timer safely', () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0, pointerType: 'touch' });
    unmount();

    expect(() => act(() => vi.advanceTimersByTime(LONG_PRESS_MS))).not.toThrow();
  });

  it('unmounting during an active touch drag clears its listeners safely', () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    const tileEl = getTileElement();

    fireEvent.pointerDown(tileEl, { clientX: 50, clientY: 50, button: 0, pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    expect(tileEl).toHaveAttribute('data-bk-lifted', 'true');

    unmount();

    expect(() => fireEvent.pointerMove(window, { clientX: 300, clientY: 50, pointerType: 'touch' })).not.toThrow();
  });
});
