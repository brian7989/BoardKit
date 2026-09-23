// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BoardProvider, Board, defineBoards, defineWidget, type WidgetProps } from './index.js';

afterEach(cleanup);

function Clock({ name, props }: WidgetProps<{ label: string }>) {
  return (
    <div>
      <strong>{name}</strong> {props.label}
    </div>
  );
}

const clock = defineWidget({ type: 'clock', title: 'Clock', sizes: ['1x1', '2x1'], defaultProps: { label: 'Local' }, component: Clock });

const boards = defineBoards({ grid: { cols: 6, rows: 4 }, widgets: [clock], initialLayout: [{ widget: 'clock', size: '2x1' }] });

export const App = () => (
  <BoardProvider config={boards} storageKey="my-board">
    <Board />
  </BoardProvider>
);

describe('the minimal quick-start app', () => {
  it('compiles, persists, and renders a working, draggable board', () => {
    render(<App />);
    expect(screen.getByText('Clock')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(document.querySelector('[data-bk-tile-id][data-bk-draggable="true"]')).toBeInTheDocument();
  });
});
