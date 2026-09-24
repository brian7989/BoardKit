// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { cell, type BoardsState } from 'boardkit-core';
import { BoardProvider } from '../BoardProvider.js';
import { defineBoards } from '../config/defineBoards.js';
import { defineWidget, type WidgetProps } from '../../widget/index.js';
import { useWidgetCatalog, type WidgetCatalog } from './useWidgetCatalog.js';

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const SIZE_SMALL = { w: cell(1), h: cell(1) };
const SIZE_WIDE = { w: cell(2), h: cell(1) };

const labelWidget = defineWidget<LabelProps>({ type: 'label', title: 'Label', sizes: [SIZE_SMALL, SIZE_WIDE], component: Label });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [labelWidget] });

let captured: WidgetCatalog | undefined;

function CatalogProbe() {
  captured = useWidgetCatalog();
  return (
    <div>
      <span data-testid="types">{captured.widgets.map((widget) => widget.type).join(',')}</span>
      <button onClick={() => captured?.add('label')}>add-default</button>
      <button onClick={() => captured?.add('label', { size: SIZE_WIDE })}>add-wide</button>
      <button onClick={() => captured?.add('label', { float: { x: 1, y: 1 } })}>add-snapped</button>
      <button onClick={() => captured?.add('label', { float: { x: 1.4, y: 1.6, free: true } })}>add-free</button>
    </div>
  );
}

let committed: BoardsState | undefined;

afterEach(() => {
  cleanup();
  committed = undefined;
  captured = undefined;
});

describe('useWidgetCatalog', () => {
  it('lists every registered widget type', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <CatalogProbe />
      </BoardProvider>,
    );

    expect(screen.getByTestId('types')).toHaveTextContent('label');
  });

  it('add(type) places it at the manifest\'s first size', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()} onChange={(next) => (committed = next)}>
        <CatalogProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-default' }));

    expect(committed?.boards[0]?.tiles[0]?.size).toEqual(SIZE_SMALL);
  });

  it('add(type, { size }) overrides the default size', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()} onChange={(next) => (committed = next)}>
        <CatalogProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-wide' }));

    expect(committed?.boards[0]?.tiles[0]?.size).toEqual(SIZE_WIDE);
  });

  it('add(type, { float }) places it snapped into the Overlay layer by default', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()} onChange={(next) => (committed = next)}>
        <CatalogProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-snapped' }));

    expect(committed?.boards[0]?.tiles[0]?.float).toEqual({ x: 1, y: 1 });
  });

  it('add(type, { float: { free: true } }) places it Free, fractional and unclamped by the grid', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()} onChange={(next) => (committed = next)}>
        <CatalogProbe />
      </BoardProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-free' }));

    expect(committed?.boards[0]?.tiles[0]?.float).toEqual({ x: 1.4, y: 1.6, free: true });
  });

  it('add(type) throws for an unregistered type', () => {
    render(
      <BoardProvider config={config} defaultValue={config.engine.empty()}>
        <CatalogProbe />
      </BoardProvider>,
    );

    expect(() => captured?.add('missing')).toThrow('Widget type "missing" is not registered.');
  });
});
