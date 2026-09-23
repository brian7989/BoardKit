// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../../board/Board.js';
import { useStackPicking } from '../../board/stackPicking/useStackPicking.js';
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
  readonly tile: typeof T1;
  readonly id: string;
  readonly type: string;
  readonly at: { x: number; y: number };
  readonly size: typeof SIZE_SMALL;
}

function seedState(): BoardsState {
  let state = config.engine.empty();
  const add = ({ tile, id, type, at, size }: AddInput) => {
    const result = config.engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tile,
      widget: { id: widgetId(id), type, props: { label: type } },
      size,
      at: { x: cell(at.x), y: cell(at.y) },
    });
    if (!result.ok) throw new Error('fixture setup failed');
    state = result.value.state;
  };
  add({ tile: T1, id: 'w1', type: 'alpha', at: { x: 0, y: 0 }, size: SIZE_SMALL });
  add({ tile: T2, id: 'w2', type: 'beta', at: { x: 1, y: 0 }, size: SIZE_SMALL });
  add({ tile: T3, id: 'w3', type: 'gamma', at: { x: 0, y: 1 }, size: SIZE_WIDE });
  return state;
}

function TestChrome({ tile }: TileOverlayProps) {
  const { stack } = useTile(tile);
  const picking = useStackPicking();
  return (
    <div data-testid={`chrome-${tile.id}`}>
      <button onClick={() => stack.startPicking()}>start</button>
      <span data-testid="picking-status">{picking ? `picking:${picking.sourceTile}` : 'idle'}</span>
    </div>
  );
}

function tileElement(id: typeof T1): Element {
  const el = document.querySelector(`[data-bk-tile-id="${id}"]`);
  if (!el) throw new Error(`tile ${id} not found`);
  return el;
}

function pickingStatus(): HTMLElement {
  const [first] = screen.getAllByTestId('picking-status');
  if (!first) throw new Error('no picking-status span found');
  return first;
}

function startPickingFrom(): void {
  const button = document.querySelector(`[data-testid="chrome-${T1}"] button`);
  if (!button) throw new Error('start button not found');
  fireEvent.click(button);
}

afterEach(cleanup);

describe('stack picking mode', () => {
  it('is null while idle', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    expect(pickingStatus()).toHaveTextContent('idle');
  });

  it('marks the source, an eligible same-size target, and an ineligible one while picking', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    startPickingFrom();

    expect(pickingStatus()).toHaveTextContent(`picking:${T1}`);
    expect(tileElement(T1)).toHaveAttribute('data-bk-stack-role', 'source');
    expect(tileElement(T2)).toHaveAttribute('data-bk-stack-role', 'eligible');
    expect(tileElement(T3)).toHaveAttribute('data-bk-stack-role', 'ineligible');
  });

  it('clicking the source tile again cancels without stacking', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    startPickingFrom();
    fireEvent.click(tileElement(T1));

    expect(pickingStatus()).toHaveTextContent('idle');
    expect(tileElement(T1)).not.toHaveAttribute('data-bk-stack-role');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking an eligible target completes the stack', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    startPickingFrom();
    fireEvent.click(tileElement(T2));

    expect(onChange).toHaveBeenCalled();
    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles).toHaveLength(2);
    expect(pickingStatus()).toHaveTextContent('idle');
  });

  it('Escape cancels picking', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={TestChrome}>
        <Board />
      </BoardProvider>,
    );

    startPickingFrom();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(pickingStatus()).toHaveTextContent('idle');
  });
});
