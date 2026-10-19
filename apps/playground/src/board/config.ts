import { cell, defineBoards, type LayoutEntry } from 'boardkit-react';
import { widgets } from '../widgets';

type Entry = LayoutEntry<(typeof widgets)[number]>;

// The desktop grid, reused below to size the packed page.
const DESKTOP_GRID = { cols: 6, rows: 4 };

// One of each widget, first-fit across pages, spilling onto new ones as they fill. Photo is
// pinned to 2x2 so its extra 6x4 size below doesn't take over this page as heroSize's default pick.
const showcase: Entry[] = widgets.map((widget): Entry => (widget.type === 'photo' ? { widget: 'photo', size: '2x2' } : { widget: widget.type }));

// An extra page after the showcase ones, every cell packed with a 1×1 widget that supports it. A
// `{ w, h }` size isn't checked per widget, which is fine here: the filter guarantees it fits.
const ONE_BY_ONE = { w: cell(1), h: cell(1) };
const packable = widgets.filter((widget) => widget.sizes.some((size) => size.w === 1 && size.h === 1));
const packed: Entry[] = Array.from({ length: DESKTOP_GRID.cols * DESKTOP_GRID.rows }, (_, index) => {
  const widget = packable[index % packable.length];
  return { widget: widget?.type ?? 'countdown', size: ONE_BY_ONE, at: [index % DESKTOP_GRID.cols, Math.floor(index / DESKTOP_GRID.cols)], page: 0 };
});

// A fleet-dashboard page: a big Photo "map" filling the grid, with two tiles snapped over it
// into the Overlay layer (pushing each other, never the map underneath) and one floating free.
const fleetDashboard: Entry[] = [
  { widget: 'photo', size: '6x4', at: [0, 0], page: 1 },
  { widget: 'weather', size: '2x2', float: { x: 0, y: 0 }, page: 1 },
  { widget: 'stocks', size: '2x1', float: { x: 2, y: 0 }, page: 1 },
  { widget: 'countdown', size: '1x1', float: { x: 5, y: 3, free: true }, page: 1 },
];

// Each breakpoint's cols:rows ratio matches the aspect of space left for the board. boardkit-react
// picks whichever applies to the board's own measured width; tablet and phone start from desktop.
export const boards = defineBoards({
  widgets,
  breakpoints: {
    desktop: { minWidth: 900, grid: DESKTOP_GRID, layout: [...showcase, ...packed, ...fleetDashboard] },
    tablet: { minWidth: 480, grid: '4x5' },
    phone: { minWidth: 0, grid: '2x4' },
  },
});
