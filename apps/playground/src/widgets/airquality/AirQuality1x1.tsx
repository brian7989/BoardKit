import { RingProgress, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { categoryOf } from './manifest';
import type { AirQualityProps } from './manifest';

// Sized for the fixed 1×1 body (160×128 — the design cell minus the header strip), leaving
// room for the category label below it.
const RING_SIZE = 74;
const RING_THICKNESS = 8;

export function AirQuality1x1({ props }: { readonly props: AirQualityProps }) {
  const category = categoryOf(props.aqi);
  return (
    <Card align="center" justify="center" gap={2}>
      <RingProgress
        size={RING_SIZE}
        thickness={RING_THICKNESS}
        roundCaps
        label={
          <Text className={styles.value} fw={800} ta="center">
            {props.aqi}
          </Text>
        }
        sections={[{ value: Math.min(100, (props.aqi / 200) * 100), color: category.color }]}
      />
      <Text className={styles.micro} c={`${category.color}.7`} fw={700}>
        {category.label}
      </Text>
    </Card>
  );
}
