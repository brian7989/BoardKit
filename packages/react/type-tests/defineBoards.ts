import { defineBoards, defineWidget, type LayoutEntry, type WidgetProps } from '../src/index.js';

function Live(_: WidgetProps<{ readonly camera: string }>) {
  return null;
}
function Plain(_: WidgetProps) {
  return null;
}

const liveView = defineWidget({ type: 'liveView', title: 'Live', sizes: ['8x6', '8x4', '4x4'], defaultProps: { camera: 'a' }, component: Live });
const jobs = defineWidget({ type: 'jobs', title: 'Jobs', sizes: ['8x2', '4x4'], component: Plain });
const robots = defineWidget({ type: 'robots', title: 'Robots', sizes: ['4x4', '4x3'], component: Plain });
const widgets = [liveView, jobs, robots];

export const valid = defineBoards({
  widgets,
  breakpoints: {
    wall: {
      minWidth: 1800,
      grid: '16x8',
      cellAspect: 1.125,
      layout: [
        { widget: 'liveView', size: '8x6', at: [0, 0], props: { camera: 'b' } },
        { widget: 'jobs', size: '8x2', at: [0, 6] },
        { widget: 'robots', size: '4x4', at: [8, 0] },
      ],
    },
    phone: {
      minWidth: 0,
      grid: '4x12',
      hide: ['robots'],
      layout: [{ widget: 'jobs', size: '4x4', stack: [{ widget: 'liveView', props: { camera: 'c' } }] }],
    },
    tablet: { minWidth: 600, grid: { cols: 8, rows: 10 } },
  },
});

export const single = defineBoards({ widgets, grid: '12x6', layout: [{ widget: 'robots' }] });

export const typedArray: readonly LayoutEntry<(typeof widgets)[number]>[] = [{ widget: 'jobs', size: '4x4' }];

// @ts-expect-error a widget the list doesn't have
export const typo = defineBoards({ widgets, grid: '12x6', layout: [{ widget: 'livView' }] });

// @ts-expect-error a size this widget doesn't allow
export const wrongSize = defineBoards({ widgets, grid: '12x6', layout: [{ widget: 'robots', size: '8x2' }] });

// @ts-expect-error props of the wrong type
export const wrongProps = defineBoards({ widgets, grid: '12x6', layout: [{ widget: 'liveView', props: { camera: 2 } }] });

export const wrongHide = defineBoards({
  widgets,
  // @ts-expect-error hiding a widget the list doesn't have
  breakpoints: { wall: { minWidth: 0, grid: '4x4', hide: ['alerts'] } },
});

// @ts-expect-error a stacked widget the list doesn't have
export const wrongStack = defineBoards({ widgets, grid: '12x6', layout: [{ widget: 'jobs', stack: [{ widget: 'alerts' }] }] });
