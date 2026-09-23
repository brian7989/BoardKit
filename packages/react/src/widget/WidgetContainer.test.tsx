// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { boardId, cell, tileId, widgetId, type Tile } from 'boardkit-core';
import { WidgetContainer } from './WidgetContainer.js';
import { defineWidget } from './defineWidget.js';
import { widgetRegistry } from './widgetRegistry.js';

function Boom(): never {
  throw new Error('widget exploded');
}

const SIZE_SMALL = { w: cell(1), h: cell(1) };

const boomWidget = defineWidget({
  type: 'boom',
  title: 'Boom',
  sizes: [SIZE_SMALL],
  component: Boom,
});

const okWidget = defineWidget({
  type: 'ok',
  title: 'Ok',
  sizes: [SIZE_SMALL],
  component: () => <span>fine</span>,
});

const namedWidget = defineWidget({
  type: 'named',
  title: 'Named',
  sizes: [SIZE_SMALL],
  component: ({ name }) => <span>{name}</span>,
});

const widgets = widgetRegistry([boomWidget, okWidget, namedWidget]);

interface FakeResizeObserverEntry {
  readonly contentRect: { readonly width: number; readonly height: number };
}

type FakeResizeObserverCallback = (entries: readonly FakeResizeObserverEntry[]) => void;

// Real jsdom has no ResizeObserver; this stands in for one, firing synchronously with a fixed
// rect so a test can assert on the design size and zoom it produces for a known cell size.
class FakeResizeObserver {
  private readonly callback: FakeResizeObserverCallback;

  public constructor(callback: FakeResizeObserverCallback) {
    this.callback = callback;
  }

  public observe(): void {
    this.callback([{ contentRect: { width: 320, height: 240 } }]);
  }

  public unobserve(): void {}

  public disconnect(): void {}
}

function tileFor(type: string, displayName?: string): Tile {
  return {
    id: tileId('t1'),
    col: cell(0),
    row: cell(0),
    size: SIZE_SMALL,
    items: [{ id: widgetId('w1'), type, props: {}, ...(displayName ? { displayName } : {}) }],
    active: 0,
  };
}

afterEach(cleanup);

describe('WidgetContainer', () => {
  it('renders the widget component', () => {
    render(<WidgetContainer tile={tileFor('ok')} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} />);
    expect(screen.getByText('fine')).toBeInTheDocument();
  });

  it('shows a fallback and calls onWidgetError when a widget crashes, without unmounting the board', () => {
    const onWidgetError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handleError = vi.fn();

    render(
      <div>
        <WidgetContainer tile={tileFor('boom')} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} onWidgetError={handleError} />
        <span>sibling tile</span>
      </div>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError.mock.calls[0]?.[1]).toBe('boom');
    expect(screen.getByText('sibling tile')).toBeInTheDocument();

    onWidgetError.mockRestore();
  });

  it('passes the manifest title as name by default', () => {
    render(<WidgetContainer tile={tileFor('named')} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} />);
    expect(screen.getByText('Named')).toBeInTheDocument();
  });

  it('passes the renamed displayName as name once set', () => {
    render(<WidgetContainer tile={tileFor('named', 'Renamed')} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} />);
    expect(screen.getByText('Renamed')).toBeInTheDocument();
  });

  it('sizes and zooms the inner design box from a measured real cell', () => {
    Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: FakeResizeObserver });

    render(<WidgetContainer tile={tileFor('ok')} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} />);

    const inner = screen.getByText('fine').closest('[data-bk-tile-frame]')?.parentElement;
    // 320×240 real px for a 1×1 cell at 160 design px/cell: zoom 2, design box 160×120.
    // jsdom doesn't serialize `zoom` into cssText, so it's read as a property, not via toHaveStyle.
    expect(inner).toHaveStyle({ width: '160px', height: '120px' });
    expect(inner?.style.zoom).toBe('2');

    Reflect.deleteProperty(globalThis, 'ResizeObserver');
  });

  it('throws inside its own boundary when the widget type is not registered', () => {
    const onWidgetError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handleError = vi.fn();

    render(
      <WidgetContainer tile={tileFor('missing')} widgets={widgets} cells={{ w: 1, h: 1 }} locked={false} designCellSizePx={160} headerHeightPx={32} onWidgetError={handleError} />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(handleError).toHaveBeenCalledTimes(1);

    onWidgetError.mockRestore();
  });
});
