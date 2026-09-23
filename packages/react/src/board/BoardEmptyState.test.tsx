// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from './Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: Label });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [labelWidget] });

function emptyState(): BoardsState {
  return config.engine.empty();
}

afterEach(cleanup);

describe('Board empty state', () => {
  it('shows the default message when the board has no tiles', () => {
    render(
      <BoardProvider config={config} defaultValue={emptyState()}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.getByText('No widgets on this page yet.')).toHaveAttribute('data-bk-empty', 'true');
  });

  it('renders a custom emptyState node instead of the default', () => {
    render(
      <BoardProvider config={config} defaultValue={emptyState()}>
        <Board emptyState={<span>Nothing here</span>} />
      </BoardProvider>,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('No widgets on this page yet.')).not.toBeInTheDocument();
  });

  it('hides the empty state entirely when emptyState is null', () => {
    render(
      <BoardProvider config={config} defaultValue={emptyState()}>
        <Board emptyState={null} />
      </BoardProvider>,
    );

    expect(document.querySelector('[data-bk-empty]')).not.toBeInTheDocument();
  });

  it('does not show once the board has tiles', () => {
    const result = config.engine.apply(emptyState(), {
      type: OpType.Add,
      board: boardId('default'),
      tileId: tileId('t1'),
      widget: { id: widgetId('w1'), type: 'label', props: { label: 'hi' } },
      size: SIZE_SMALL,
    });
    if (!result.ok) throw new Error('fixture setup failed');

    render(
      <BoardProvider config={config} defaultValue={result.value.state}>
        <Board />
      </BoardProvider>,
    );

    expect(screen.queryByText('No widgets on this page yet.')).not.toBeInTheDocument();
  });
});
