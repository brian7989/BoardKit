// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BoardProvider } from '../BoardProvider.js';
import { defineBoards } from '../config/defineBoards.js';
import { useLocked } from './useLocked.js';

const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [] });

function LockedProbe() {
  return <span data-testid="locked">{String(useLocked())}</span>;
}

afterEach(cleanup);

describe('useLocked', () => {
  it('defaults to false (draggable)', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <LockedProbe />
      </BoardProvider>,
    );

    expect(screen.getByTestId('locked')).toHaveTextContent('false');
  });

  it('reflects the `locked` prop', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()} locked>
        <LockedProbe />
      </BoardProvider>,
    );

    expect(screen.getByTestId('locked')).toHaveTextContent('true');
  });
});
