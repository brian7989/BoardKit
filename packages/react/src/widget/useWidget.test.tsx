// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { cell, tileId, widgetId, type Tile } from 'boardkit-core';
import { WidgetContainer } from './WidgetContainer.js';
import { defineWidget } from './defineWidget.js';
import { useWidget } from './useWidget.js';
import { widgetRegistry } from './widgetRegistry.js';

const SIZE_SMALL = { w: cell(1), h: cell(1) };

function Nested() {
  const { isActive, cells, designSize } = useWidget();
  return <span>{`active=${isActive} cell=${cells.w}x${cells.h} design=${designSize.width}x${designSize.height}`}</span>;
}

const nestedWidget = defineWidget({
  type: 'nested',
  title: 'Nested',
  sizes: [SIZE_SMALL],
  component: () => <Nested />,
});

const widgets = widgetRegistry([nestedWidget]);

function tileFor(): Tile {
  return {
    id: tileId('t1'),
    col: cell(0),
    row: cell(0),
    size: SIZE_SMALL,
    items: [{ id: widgetId('w1'), type: 'nested', props: {} }],
    active: 0,
  };
}

afterEach(cleanup);

describe('useWidget', () => {
  it('exposes the same props to a component nested below the widget root', () => {
    render(<WidgetContainer tile={tileFor()} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} />);
    expect(screen.getByText('active=true cell=1x1 design=160x160')).toBeInTheDocument();
  });

  it('throws outside a widget rendered by WidgetContainer', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Nested />)).toThrow('useWidget must be used within a widget rendered by WidgetHost.');
    consoleError.mockRestore();
  });
});
