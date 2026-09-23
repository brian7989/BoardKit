import type { InteractionOptions } from './InteractionOptions.js';

const DEFAULT_DRAG_THRESHOLD_PX = 4;
const DEFAULT_HYSTERESIS_FRACTION = 0.3;

export const InteractionDefaults: InteractionOptions = {
  dragThresholdPx: DEFAULT_DRAG_THRESHOLD_PX,
  hysteresisFraction: DEFAULT_HYSTERESIS_FRACTION,
};
