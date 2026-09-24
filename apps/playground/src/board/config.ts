import { defineBoards, type InitialLayoutTile } from 'boardkit-react';
import { widgets } from '../widgets';

// The widest breakpoint's grid, reused below to size the packed page.
const WIDEST_GRID = { cols: 6, rows: 4 };

// One of each widget, first-fit across pages, spilling onto new ones as they fill. Photo is
// pinned to 2x2 so its extra 6x4 size below doesn't take over this page as heroSize's default pick.
const showcase: InitialLayoutTile[] = widgets.map((widget) => ({ widget: widget.type, ...(widget.type === 'photo' ? { size: '2x2' as const } : {}) }));

// An extra page after the showcase ones, every cell packed with a 1×1 widget, cycling through
// whichever ones support that size — shows the solver working a fully packed board.
const packable = widgets.filter((widget) => widget.sizes.some((size) => size.w === 1 && size.h === 1));
const packed: InitialLayoutTile[] = Array.from({ length: WIDEST_GRID.cols * WIDEST_GRID.rows }, (_, index) => {
  const widget = packable[index % packable.length];
  return { widget: widget?.type ?? 'countdown', size: '1x1', at: [index % WIDEST_GRID.cols, Math.floor(index / WIDEST_GRID.cols)], page: 0 };
});

// A fleet-dashboard page: a big Photo "map" filling the grid, with two tiles snapped over it
// into the Overlay layer (pushing each other, never the map underneath) and one floating free.
const fleetDashboard: InitialLayoutTile[] = [
  { widget: 'photo', size: '6x4', at: [0, 0], page: 1 },
  { widget: 'weather', size: '2x2', float: { x: 0, y: 0 }, page: 1 },
  { widget: 'stocks', size: '2x1', float: { x: 2, y: 0 }, page: 1 },
  { widget: 'countdown', size: '1x1', float: { x: 5, y: 3, free: true }, page: 1 },
];

// Each breakpoint's cols:rows ratio matches the aspect of space left for the board. boardkit-react
// picks whichever applies to the board's own measured width and reflows onto it automatically.
export const boards = defineBoards({
  grid: [
    { minWidth: 900, ...WIDEST_GRID },
    { minWidth: 480, cols: 4, rows: 5 },
    { minWidth: 0, cols: 2, rows: 4 },
  ],
  widgets,
  initialLayout: [...showcase, ...packed, ...fleetDashboard],
});
