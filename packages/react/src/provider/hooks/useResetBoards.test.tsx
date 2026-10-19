// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../../board/Board.js';
import { BoardProvider } from '../BoardProvider.js';
import type { ChangeMeta } from '../ChangeMeta.js';
import { ChangeReason } from '../ChangeReason.js';
import { defineBoards } from '../config/defineBoards.js';
import { restoreBoards } from '../persistence/restoreBoards.js';
import { createInitialState } from '../config/createInitialState.js';
import { defineWidget, type WidgetProps } from '../../widget/index.js';
import { useBoards } from './useBoards.js';
import { useResetBoards } from './useResetBoards.js';

const KEY = 'reset-test';

function Toggle({ props, setProps }: WidgetProps<{ readonly view: string }>) {
  return <button onClick={() => setProps({ view: props.view === 'table' ? 'cards' : 'table' })}>view:{props.view}</button>;
}

const toggle = defineWidget({ type: 'toggle', title: 'Toggle', sizes: ['1x1'], defaultProps: { view: 'table' }, component: Toggle });
const config = defineBoards({ grid: { cols: 3, rows: 1 }, widgets: [toggle], layout: [{ widget: 'toggle', at: [1, 0] }] });

function loadSaved(): BoardsState {
  return restoreBoards(config, JSON.parse(window.localStorage.getItem(KEY) ?? 'null'));
}

function Controls() {
  const reset = useResetBoards();
  const { dispatch } = useBoards();
  const move = () => dispatch({ type: OpType.Move, board: boardId('default'), tile: tileId('t-toggle'), to: { x: cell(2), y: cell(0) } });
  return (
    <>
      <button onClick={move}>move</button>
      <button onClick={reset}>reset</button>
    </>
  );
}

function colOf(state: BoardsState | undefined): number | undefined {
  return state?.boards[0]?.tiles.find((tile) => tile.id === tileId('t-toggle'))?.col;
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useResetBoards', () => {
  it('restores the authored layout and reports ChangeReason.Reset', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} onChange={onChange}>
        <Controls />
        <Board />
      </BoardProvider>,
    );
    act(() => screen.getByText('move').click());
    expect(colOf(onChange.mock.calls.at(-1)?.[0])).toBe(2);

    act(() => screen.getByText('reset').click());
    expect(colOf(onChange.mock.calls.at(-1)?.[0])).toBe(1);
    expect(onChange.mock.calls.at(-1)?.[1]).toEqual({ reason: ChangeReason.Reset });
  });
});

describe('WidgetProps.setProps', () => {
  it('merges a patch into the widget props, saved with the board', () => {
    render(
      <BoardProvider config={config} storageKey={KEY}>
        <Board />
      </BoardProvider>,
    );
    act(() => screen.getByText('view:table').click());
    expect(screen.getByText('view:cards')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(250));
    expect(loadSaved().boards[0]?.tiles[0]?.items[0]?.props).toEqual({ view: 'cards' });
  });
});

describe('setProps on a stack', () => {
  it('updates the widget showing, not the first one in the stack', () => {
    const single = defineBoards({ grid: { cols: 3, rows: 1 }, widgets: [toggle], layout: [{ widget: 'toggle', props: { view: 'grid' } }] });
    const base = createInitialState(single);
    const added = single.engine.apply(base, { type: OpType.StackNew, board: boardId('default'), onto: tileId('t-toggle'), widget: { id: widgetId('w-second'), type: 'toggle', props: { view: 'table' } } });
    if (!added.ok) throw new Error('fixture StackNew should succeed');
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={single} defaultValue={added.value.state} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );
    act(() => screen.getByText('view:table').click());
    const items = onChange.mock.calls.at(-1)?.[0].boards[0]?.tiles[0]?.items;
    expect(items?.map((item) => item.props)).toEqual([{ view: 'grid' }, { view: 'cards' }]);
  });
});

describe('persistence for controlled boards', () => {
  it('leaves saving a controlled board to the host', () => {
    const initial = loadSaved();
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} value={initial} onChange={onChange} storageKey={KEY}>
        <Board />
      </BoardProvider>,
    );
    act(() => vi.advanceTimersByTime(250));
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('keeps loading a save from before authored layouts existed, as the layout for its own grid', () => {
    const saved = { version: 3, grid: { cols: 3, rows: 1 }, boards: [{ id: 'default', tiles: [{ id: 't-toggle', col: 2, row: 0, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w-toggle', type: 'toggle' }] }] }] };
    window.localStorage.setItem(KEY, JSON.stringify(saved));
    expect(colOf(loadSaved())).toBe(2);
  });
});
