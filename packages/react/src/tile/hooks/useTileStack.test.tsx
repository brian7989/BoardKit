// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../../board/Board.js';
import { BoardProvider } from '../../provider/BoardProvider.js';
import type { ChangeMeta } from '../../provider/ChangeMeta.js';
import { defineBoards } from '../../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../../widget/index.js';
import { useTile } from '../useTile.js';
import type { TileOverlayProps } from '../TileOverlay.js';

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const SIZE_WIDE = { w: cell(2), h: cell(1) };
const BOARD = boardId('default');
const T1 = tileId('t1');
const T2 = tileId('t2');
const T3 = tileId('t3');
const W1 = widgetId('w1');
const W2 = widgetId('w2');
const W3 = widgetId('w3');

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const alphaWidget = defineWidget<LabelProps>({ type: 'alpha', title: 'Alpha', sizes: [SIZE_SMALL], component: Label });
const betaWidget = defineWidget<LabelProps>({ type: 'beta', title: 'Beta', sizes: [SIZE_SMALL], component: Label });
const gammaWidget = defineWidget<LabelProps>({ type: 'gamma', title: 'Gamma', sizes: [SIZE_WIDE], component: Label });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [alphaWidget, betaWidget, gammaWidget] });

interface AddInput {
  readonly state: BoardsState;
  readonly tile: typeof T1;
  readonly widget: typeof W1;
  readonly type: string;
  readonly at: { x: number; y: number };
  readonly size: typeof SIZE_SMALL;
}

function add({ state, tile, widget, type, at, size }: AddInput): BoardsState {
  const result = config.engine.apply(state, {
    type: OpType.Add,
    board: BOARD,
    tileId: tile,
    widget: { id: widget, type, props: { label: type } },
    size,
    at: { x: cell(at.x), y: cell(at.y) },
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

// t1/t2 are same-size siblings and can combine; t3 is a different size and cannot.
function seedSeparateState(): BoardsState {
  let state = config.engine.empty();
  state = add({ state, tile: T1, widget: W1, type: 'alpha', at: { x: 0, y: 0 }, size: SIZE_SMALL });
  state = add({ state, tile: T2, widget: W2, type: 'beta', at: { x: 1, y: 0 }, size: SIZE_SMALL });
  state = add({ state, tile: T3, widget: W3, type: 'gamma', at: { x: 0, y: 1 }, size: SIZE_WIDE });
  return state;
}

function seedStackedState(): BoardsState {
  const separate = seedSeparateState();
  const result = config.engine.apply(separate, { type: OpType.Stack, board: BOARD, from: T2, onto: T1 });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

function TestChrome({ tile }: TileOverlayProps) {
  const { stack } = useTile(tile);
  return (
    <div data-testid={`chrome-${tile.id}`}>
      <span data-testid="items">{stack.items.map((item) => item.name).join(',')}</span>
      <span data-testid="active">{stack.active?.name ?? ''}</span>
      <span data-testid="can-combine">{String(stack.canCombine)}</span>
      <button onClick={() => stack.combineWith(T2)}>combine-onto-t2</button>
      <button onClick={() => stack.select(W1)}>select-w1</button>
      <button onClick={() => stack.unstack(W2)}>unstack-w2</button>
      <button onClick={() => stack.reorder(W2, 0)}>reorder-w2-first</button>
      <button onClick={() => stack.renameItem(W1, 'Renamed')}>rename-w1</button>
    </div>
  );
}

function chromeFor(tile: typeof T1): HTMLElement {
  return screen.getByTestId(`chrome-${tile}`);
}

afterEach(cleanup);

describe('useTileStack', () => {
  it('lists every item and marks which one is active', () => {
    render(
      <BoardProvider config={config} defaultValue={seedStackedState()} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    const chrome = chromeFor(T1);
    expect(within(chrome).getByTestId('items')).toHaveTextContent('Alpha,Beta');
    expect(within(chrome).getByTestId('active')).toHaveTextContent('Beta');
  });

  it('select(widget) makes it the active item', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedStackedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(within(chromeFor(T1)).getByRole('button', { name: 'select-w1' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles[0]).toMatchObject({ active: 0 });
  });

  it('unstack(widget) pops it back into its own tile', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedStackedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(within(chromeFor(T1)).getByRole('button', { name: 'unstack-w2' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards).toHaveLength(1);
    expect(state?.boards[0]?.tiles).toHaveLength(3);
    expect(state?.boards[0]?.tiles.find((tile) => tile.id === 't1')?.items.map((item) => item.id)).toEqual(['w1']);
  });

  it('reorder(widget, toIndex) moves it within the stack', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedStackedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(within(chromeFor(T1)).getByRole('button', { name: 'reorder-w2-first' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles[0]?.items.map((item) => item.id)).toEqual(['w2', 'w1']);
  });

  it('renameItem(widget, name) sets its displayName', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedStackedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(within(chromeFor(T1)).getByRole('button', { name: 'rename-w1' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles[0]?.items.find((item) => item.id === 'w1')).toMatchObject({ displayName: 'Renamed' });
  });

  it('canCombine is true next to a same-size sibling and false otherwise', () => {
    render(
      <BoardProvider config={config} defaultValue={seedSeparateState()} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    expect(within(chromeFor(T1)).getByTestId('can-combine')).toHaveTextContent('true');
    expect(within(chromeFor(T3)).getByTestId('can-combine')).toHaveTextContent('false');
  });

  it('combineWith(target) stacks this tile onto the target directly', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedSeparateState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(within(chromeFor(T1)).getByRole('button', { name: 'combine-onto-t2' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    const tiles = state?.boards[0]?.tiles ?? [];
    expect(tiles).toHaveLength(2);
    const merged = tiles.find((tile) => tile.id === 't2');
    expect(merged?.items.map((item) => item.id)).toEqual(['w2', 'w1']);
    expect(merged).toMatchObject({ active: 1 });
  });
});
