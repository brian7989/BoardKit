// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../board/Board.js';
import { BoardProvider } from './BoardProvider.js';
import type { ChangeMeta } from './ChangeMeta.js';
import { defineBoards } from './config/defineBoards.js';
import { useBoards } from './hooks/useBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';

afterEach(cleanup);

interface CounterProps extends Record<string, unknown> {
  readonly label: string;
}

function Counter({ props }: WidgetProps<CounterProps>) {
  const { dispatch, state, activeBoardId } = useBoards();
  const board = state.boards.find((candidate) => candidate.id === activeBoardId);
  const tile = board?.tiles[0];
  const moveTile = () => {
    if (!tile) return;
    dispatch({ type: OpType.Move, board: activeBoardId, tile: tile.id, to: { x: cell(1), y: cell(0) } });
  };
  return (
    <div>
      <span>{props.label}</span>
      <button onClick={moveTile}>move</button>
    </div>
  );
}

const SIZE_SMALL = { w: cell(1), h: cell(1) };

const counterWidget = defineWidget<CounterProps>({
  type: 'counter',
  title: 'Counter',
  sizes: [SIZE_SMALL],
  component: Counter,
});

const config = defineBoards({
  grid: { cols: 4, rows: 4 },
  widgets: [counterWidget],
});

function seedState(): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: boardId('default'),
    tileId: tileId('t1'),
    widget: { id: widgetId('w1'), type: 'counter', props: { label: 'hello' } },
    size: SIZE_SMALL,
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

describe('BoardProvider', () => {
  it('renders a widget from state', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('round-trips uncontrolled state through onChange', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByText('move'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextState = onChange.mock.calls[0]?.[0];
    expect(nextState?.boards[0]?.tiles[0]?.col).toBe(1);
  });

  it('stays on `value` when controlled and the host ignores onChange', () => {
    const initial = seedState();
    const onChange = vi.fn();
    render(
      <BoardProvider config={config} value={initial} onChange={onChange}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByText('move'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
