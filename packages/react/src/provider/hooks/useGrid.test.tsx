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
  return <span>{`${grid.name} ${grid.cols}x${grid.rows}`}</span>;
}

describe('useGrid', () => {
  it('reads the active breakpoint\'s grid from context', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <GridLabel />
      </BoardProvider>,
    );
    expect(screen.getByText('default 3x5')).toBeInTheDocument();
  });

  it('names the active breakpoint', () => {
    const named = defineBoards({ breakpoints: { desktop: { minWidth: 0, grid: '4x2' } }, widgets: [] });
    render(
      <BoardProvider config={named} defaultValue={named.engine.empty()}>
        <GridLabel />
      </BoardProvider>,
    );
    expect(screen.getByText('desktop 4x2')).toBeInTheDocument();
  });
});
