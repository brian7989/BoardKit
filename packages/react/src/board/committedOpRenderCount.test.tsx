// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from './Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { useBoards } from '../provider/hooks/useBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';
import type { TileOverlayProps } from '../tile/index.js';

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const GRID_SIZE = 10;
const BOARD = boardId('default');
const T0 = tileId('t0');
const T1 = tileId('t1');

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function MoverLabel({ props }: WidgetProps<LabelProps>) {
  const { dispatch } = useBoards();
  const move = () => dispatch({ type: OpType.Move, board: BOARD, tile: T0, to: { x: cell(1), y: cell(0) } });
  return (
    <div>
      <span>{props.label}</span>
      <button onClick={move}>move</button>
    </div>
  );
}

const widget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL], component: MoverLabel });
const config = defineBoards({ grid: { cols: GRID_SIZE, rows: GRID_SIZE }, widgets: [widget] });

interface TileFixture {
  readonly id: string;
  readonly col: number;
  readonly row: number;
}

function addTile(state: BoardsState, fixture: TileFixture): BoardsState {
  const { id, col, row } = fixture;
  const result = config.engine.apply(state, {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId(id),
    widget: { id: widgetId(`${id}-w`), type: 'label', props: { label: id } },
    size: SIZE_SMALL,
    at: { x: cell(col), y: cell(row) },
  });
  if (!result.ok) throw new Error(`fixture setup failed for ${id}`);
  return result.value.state;
}

function seedState(): BoardsState {
  let state = config.engine.empty();
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      state = addTile(state, { id: `t${row * GRID_SIZE + col}`, col, row });
    }
  }
  return state;
}

const renderCounts: Record<string, number> = {};

function CountingOverlay({ tile }: TileOverlayProps) {
  renderCounts[tile.id] = (renderCounts[tile.id] ?? 0) + 1;
  return null;
}

function tileElement(id: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-bk-tile-id="${id}"]`);
  if (!el) throw new Error(`tile ${id} not found`);
  return el;
}

beforeEach(() => {
  Object.keys(renderCounts).forEach((key) => delete renderCounts[key]);
});

afterEach(cleanup);

describe('a committed op on a 100-tile board', () => {
  it('re-renders only the moved tile and the tile it displaces', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={CountingOverlay}>
        <Board />
      </BoardProvider>,
    );

    const before = { ...renderCounts };
    fireEvent.click(within(tileElement('t0')).getByText('move'));

    const untouched = Object.keys(before).filter((id) => id !== 't0' && id !== 't1');
    expect(untouched.length).toBe(GRID_SIZE * GRID_SIZE - 2);
    untouched.forEach((id) => expect(renderCounts[id]).toBe(before[id]));

    expect(renderCounts.t0).toBeGreaterThan(before.t0 ?? 0);
    expect(renderCounts.t1).toBeGreaterThan(before.t1 ?? 0);
  });
});
