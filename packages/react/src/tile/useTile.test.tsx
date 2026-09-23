// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from '../board/Board.js';
import { BoardProvider } from '../provider/BoardProvider.js';
import type { ChangeMeta } from '../provider/ChangeMeta.js';
import { defineBoards } from '../provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../widget/index.js';
import { useTile, type UseTileResult } from './useTile.js';
import type { TileOverlayProps } from './TileOverlay.js';

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const SIZE_WIDE = { w: cell(2), h: cell(1) };
const SIZE_NOT_ALLOWED = { w: cell(3), h: cell(3) };
const BOARD = boardId('default');

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL, SIZE_WIDE], component: Label });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [labelWidget] });

function seedState(): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t1'),
    widget: { id: widgetId('w1'), type: 'label', props: { label: 'hello' } },
    size: SIZE_SMALL,
    at: { x: cell(0), y: cell(0) },
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

let captured: UseTileResult | undefined;

function CaptureChrome({ tile }: TileOverlayProps) {
  captured = useTile(tile);
  return null;
}

function ActionChrome({ tile }: TileOverlayProps) {
  const { size, name, remove } = useTile(tile);
  const [lastResult, setLastResult] = useState('');
  return (
    <div>
      <span data-testid="current-size">{`${size.current.w}x${size.current.h}`}</span>
      <button onClick={() => setLastResult(size.set(SIZE_WIDE).ok ? 'ok' : 'rejected')}>resize</button>
      <button onClick={() => setLastResult(size.set(SIZE_NOT_ALLOWED).ok ? 'ok' : 'rejected')}>bad-resize</button>
      <button onClick={() => name.set('Renamed')}>rename</button>
      <button onClick={() => remove()}>remove</button>
      <span data-testid="last-result">{lastResult}</span>
    </div>
  );
}

afterEach(() => {
  cleanup();
  captured = undefined;
});

describe('useTile', () => {
  it('groups every tile action under its own area, in a stable order', () => {
    render(
      <BoardProvider config={config} defaultValue={seedState()} tileOverlay={CaptureChrome}>
        <Board />
      </BoardProvider>,
    );

    expect(captured).toBeDefined();
    expect(Object.keys(captured ?? {})).toEqual(['tile', 'size', 'float', 'stack', 'name', 'interaction', 'remove']);
  });

  it('size.set commits a Resize', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={ActionChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'resize' }));

    expect(screen.getByTestId('last-result')).toHaveTextContent('ok');
    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles[0]?.size).toEqual(SIZE_WIDE);
  });

  it('name.set commits a RenameWidget', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={ActionChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'rename' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles[0]?.items[0]).toMatchObject({ displayName: 'Renamed' });
  });

  it('remove() deletes the tile', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={ActionChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'remove' }));

    const state = onChange.mock.calls.at(-1)?.[0];
    expect(state?.boards[0]?.tiles).toHaveLength(0);
  });

  it('a rejected action returns ok:false and commits nothing', () => {
    const onChange = vi.fn<(next: BoardsState, meta: ChangeMeta) => void>();
    render(
      <BoardProvider config={config} defaultValue={seedState()} onChange={onChange} tileOverlay={ActionChrome}>
        <Board />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'bad-resize' }));

    expect(screen.getByTestId('last-result')).toHaveTextContent('rejected');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('current-size')).toHaveTextContent('1x1');
  });
});
