// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardProvider } from '../BoardProvider.js';
import { defineBoards } from '../config/defineBoards.js';
import { useGrid } from './useGrid.js';

const config = defineBoards({ grid: { cols: 3, rows: 5 }, widgets: [] });

function GridLabel() {
  const grid = useGrid();
  return <span>{`${grid.cols}x${grid.rows}`}</span>;
}

describe('useGrid', () => {
  it('reads the active breakpoint\'s grid from context', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <GridLabel />
      </BoardProvider>,
    );
    expect(screen.getByText('3x5')).toBeInTheDocument();
  });
});
