// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { cell } from 'boardkit-core';
import { BoardProvider } from '../BoardProvider.js';
import { defineBoards } from '../config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../../widget/index.js';
import { useBoardList } from './useBoardList.js';

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [{ w: cell(1), h: cell(1) }], component: Label });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [labelWidget] });

function ListProbe() {
  const list = useBoardList();
  return (
    <div>
      <span data-testid="active">{list.activeId}</span>
      <span data-testid="ids">{list.boards.map((board) => board.id).join(',')}</span>
      <span data-testid="can-remove-active">{String(list.canRemove(list.activeId))}</span>
      <button onClick={() => list.add()}>add</button>
      <button onClick={() => list.remove(list.activeId)}>remove-active</button>
      <button onClick={() => list.select(list.boards.find((board) => !board.isActive)?.id ?? list.activeId)}>select-other</button>
    </div>
  );
}

afterEach(cleanup);

describe('useBoardList', () => {
  it('starts with the one default board active, which cannot be removed', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <ListProbe />
      </BoardProvider>,
    );

    expect(screen.getByTestId('ids')).toHaveTextContent('default');
    expect(screen.getByTestId('active')).toHaveTextContent('default');
    expect(screen.getByTestId('can-remove-active')).toHaveTextContent('false');
  });

  it('add() appends a new empty board and switches to it', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <ListProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    const ids = screen.getByTestId('ids').textContent?.split(',') ?? [];
    expect(ids).toHaveLength(2);
    expect(screen.getByTestId('active')).toHaveTextContent(ids[1] ?? '');
  });

  it('select(board) switches the active board without dispatching an op', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <ListProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('active')).not.toHaveTextContent('default');
    fireEvent.click(screen.getByRole('button', { name: 'select-other' }));

    expect(screen.getByTestId('active')).toHaveTextContent('default');
  });

  it('canRemove is true once there is more than one board, and remove() takes it out', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <ListProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('can-remove-active')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'remove-active' }));

    expect(screen.getByTestId('ids').textContent?.split(',')).toHaveLength(1);
  });
});
