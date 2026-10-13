// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../board/Board.js';
import { BoardProvider } from './BoardProvider.js';
import type { ChangeMeta } from './ChangeMeta.js';
import { ChangeReason } from './ChangeReason.js';
import { defineBoards } from './config/defineBoards.js';
import { defineWidget } from '../widget/index.js';
import { useBoards } from './hooks/useBoards.js';
import { useResetBoards } from './hooks/useResetBoards.js';
import { loadBoards } from './persistence/loadBoards.js';

afterEach(cleanup);

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const widget = defineWidget({ type: 'small', title: 'Small', sizes: [SIZE_SMALL], component: () => null });

const config = defineBoards({
  grid: [
    { minWidth: 600, cols: 6, rows: 4 },
    { minWidth: 0, cols: 2, rows: 4 },
  ],
  widgets: [widget],
});

const WIDE_WIDTH = 800;
const NARROW_WIDTH = 300;
const STILL_NARROW_WIDTH = 250;

function seedState(): BoardsState {
  const { engine } = config;
  const result = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: boardId('default'),
    tileId: tileId('t1'),
    widget: { id: widgetId('w1'), type: 'small' },
    size: SIZE_SMALL,
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

type FakeCallback = (entries: readonly ResizeObserverEntry[], observer: FakeResizeObserver) => void;

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly callback: FakeCallback;
  constructor(callback: FakeCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

let containerWidth = WIDE_WIDTH;

function rect(width: number): DOMRect {
  return { width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0, toJSON: () => ({}) };
}

function resizeTo(width: number): void {
  containerWidth = width;
  const observer = FakeResizeObserver.instances[FakeResizeObserver.instances.length - 1];
  if (!observer) throw new Error('no ResizeObserver instance to resize');
  act(() => observer.callback([], observer));
}

beforeEach(() => {
  FakeResizeObserver.instances = [];
  containerWidth = WIDE_WIDTH;
  Object.defineProperty(window, 'innerWidth', { value: WIDE_WIDTH, configurable: true });
  Object.defineProperty(globalThis, 'ResizeObserver', { value: FakeResizeObserver, configurable: true });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => rect(containerWidth));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('breakpoint reflow', () => {
  it('reflows and commits exactly once when the measured width crosses into a new breakpoint', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );

    resizeTo(NARROW_WIDTH);

    expect(onChange).toHaveBeenCalledTimes(1);
    const [next, meta] = onChange.mock.calls[0] ?? [];
    expect(next?.grid).toEqual({ cols: 2, rows: 4 });
    expect(meta).toEqual({ reason: ChangeReason.Reflow, changes: expect.any(Array) });
  });

  it('does not reflow when the width changes but stays within the same breakpoint', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );

    resizeTo(NARROW_WIDTH);
    onChange.mockClear();
    resizeTo(STILL_NARROW_WIDTH);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('delivers the reflowed state back to a controlled host', () => {
    function ControlledHost() {
      const [state, setState] = useState(seedState());
      return (
        <BoardProvider config={config} value={state} onChange={setState}>
          <Board />
        </BoardProvider>
      );
    }

    const { container } = render(<ControlledHost />);
    const board = () => container.querySelector('[role="group"]');
    expect(board()?.getAttribute('style')).toContain('aspect-ratio: 1.5');

    resizeTo(NARROW_WIDTH);

    expect(board()?.getAttribute('style')).toContain('aspect-ratio: 0.5');
  });

  it('trusts a seed state built for a narrower grid than the viewport suggests, with no mismatch', () => {
    // window.innerWidth says wide, but the seed state and the (not yet measured) container both
    // agree on narrow — the engine guard must not fire between mount and <Board>'s first measurement.
    Object.defineProperty(window, 'innerWidth', { value: WIDE_WIDTH, configurable: true });
    containerWidth = NARROW_WIDTH;
    const narrowEngine = config.breakpoints[config.breakpoints.length - 1]?.engine;
    if (!narrowEngine) throw new Error('fixture requires a narrow breakpoint');
    const { container } = render(
      <BoardProvider config={config} defaultValue={narrowEngine.empty()}>
        <Board />
      </BoardProvider>,
    );
    const board = container.querySelector('[role="group"]');
    expect(board?.getAttribute('style')).toContain('aspect-ratio: 0.5');
  });

  it('shows a narrower breakpoint its own authored layout when an uncontrolled board first reaches it', () => {
    const authored = defineBoards({
      grid: [
        { minWidth: 600, cols: 6, rows: 4 },
        { minWidth: 0, cols: 2, rows: 4, initialLayout: [{ widget: 'small', at: [1, 3] }] },
      ],
      widgets: [widget],
      initialLayout: [{ widget: 'small', at: [5, 0] }],
    });
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={authored} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );

    resizeTo(NARROW_WIDTH);

    const tile = onChange.mock.calls.at(-1)?.[0].boards[0]?.tiles[0];
    expect(tile).toMatchObject({ col: 1, row: 3 });
  });

  it('keeps a change made at a narrower breakpoint across a reload', () => {
    const saved = defineBoards({
      grid: [
        { minWidth: 600, cols: 6, rows: 4 },
        { minWidth: 0, cols: 2, rows: 4 },
      ],
      widgets: [widget],
      initialLayout: [{ widget: 'small' }, { widget: 'small' }],
    });
    const KEY = 'narrow-reload-test';
    window.localStorage.removeItem(KEY);
    function RemoveSecond() {
      const { dispatch } = useBoards();
      return <button onClick={() => dispatch({ type: OpType.Remove, board: boardId('default'), tile: tileId('t-small-2') })}>remove</button>;
    }
    const tree = (
      <BoardProvider config={saved} storageKey={KEY}>
        <RemoveSecond />
        <Board />
      </BoardProvider>
    );
    const first = render(tree);
    resizeTo(NARROW_WIDTH);
    act(() => screen.getByText('remove').click());
    act(() => window.dispatchEvent(new Event('pagehide')));
    first.unmount();

    containerWidth = NARROW_WIDTH;
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={saved} storageKey={KEY} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    const stored = saved.breakpoints[1]?.engine.parse(JSON.parse(window.localStorage.getItem(KEY) ?? 'null'));
    const tiles = stored?.ok ? stored.value.boards.flatMap((board) => board.tiles.map((tile) => tile.id)) : null;
    expect(tiles).toEqual(['t-small']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('brings back a widget that fit no size at the narrow breakpoint once the board widens again', () => {
    const wideOnly = defineWidget({ type: 'wideOnly', title: 'Wide only', sizes: ['3x1'], component: () => null });
    const parking = defineBoards({
      grid: [
        { minWidth: 600, cols: 6, rows: 4 },
        { minWidth: 0, cols: 2, rows: 4 },
      ],
      widgets: [widget, wideOnly],
      initialLayout: [{ widget: 'wideOnly', at: [3, 2] }, { widget: 'small' }],
    });
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={parking} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    resizeTo(NARROW_WIDTH);
    const narrow = onChange.mock.calls.at(-1)?.[0];
    expect(narrow?.boards[0]?.tiles.map((tile) => tile.id)).toEqual(['t-small']);
    resizeTo(WIDE_WIDTH);
    const wide = onChange.mock.calls.at(-1)?.[0];
    expect(wide?.boards[0]?.tiles.find((tile) => tile.id === tileId('t-wideOnly'))).toMatchObject({ col: 3, row: 2 });
  });

  it('resets to the narrow breakpoint authored layout while at that breakpoint, for a controlled host too', () => {
    const authored = defineBoards({
      grid: [
        { minWidth: 600, cols: 6, rows: 4 },
        { minWidth: 0, cols: 2, rows: 4, initialLayout: [{ widget: 'small', at: [1, 3] }] },
      ],
      widgets: [widget],
      initialLayout: [{ widget: 'small', at: [5, 0] }],
    });
    function ResetButton() {
      const reset = useResetBoards();
      return <button onClick={reset}>reset</button>;
    }
    function Host() {
      const [state, setState] = useState(() => loadBoards(authored));
      return (
        <BoardProvider config={authored} value={state} onChange={(next) => setState(next)}>
          <ResetButton />
          <Board />
          <span data-testid="spot">{state.boards[0]?.tiles.map((tile) => `${tile.col},${tile.row}`).join(' ')}</span>
        </BoardProvider>
      );
    }
    render(<Host />);
    resizeTo(NARROW_WIDTH);
    expect(screen.getByTestId('spot')).toHaveTextContent('1,3');
    act(() => screen.getByText('reset').click());
    expect(screen.getByTestId('spot')).toHaveTextContent('1,3');
  });

  it('keeps working when localStorage refuses to save', () => {
    const quota = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    render(
      <BoardProvider config={config} defaultValue={seedState()} storageKey="full-storage">
        <Board />
      </BoardProvider>,
    );
    expect(() => act(() => window.dispatchEvent(new Event('pagehide')))).not.toThrow();
    expect(quota).toHaveBeenCalled();
  });
});
