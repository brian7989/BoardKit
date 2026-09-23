import { RingProgress } from '@mantine/core';
import { Card } from '../Card';
import type { ActivityRingsProps } from './manifest';

// Sized for the fixed 1×1 body (160×128, the design cell minus the header strip), not measured
// — boardkit-react zooms this whole box to fit the real cell, so a plain px size scales with it.
const RING_SIZE = 88;
const RING_THICKNESS = 10;

export function ActivityRings1x1({ props }: { readonly props: ActivityRingsProps }) {
  return (
    <Card align="center" justify="center">
      <RingProgress
        size={RING_SIZE}
        thickness={RING_THICKNESS}
        roundCaps
        sections={[{ value: Math.min(100, (props.move.value / props.move.goal) * 100), color: 'red.6' }]}
      />
    </Card>
  );
}
