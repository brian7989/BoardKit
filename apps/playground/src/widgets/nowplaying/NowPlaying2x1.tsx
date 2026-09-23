import { useState } from 'react';
import { ActionIcon, Group, Image, Progress, Stack, Text } from '@mantine/core';
import { IconPlayerPlayFilled, IconPlayerSkipBackFilled, IconPlayerSkipForwardFilled, IconPlayerPauseFilled } from '@tabler/icons-react';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { IMAGE_FALLBACK } from '../imageFallback';
import type { NowPlayingProps } from './manifest';

export function NowPlaying2x1({ props }: { readonly props: NowPlayingProps }) {
  const [playing, setPlaying] = useState(true);
  return (
    <Card>
      <Group wrap="nowrap" gap={13} align="center" h="100%">
        {/* Mantine's Image base class sets width: 100%, so override it inline to keep the square from stretching. */}
        <Image
          src={props.art}
          fallbackSrc={IMAGE_FALLBACK}
          alt=""
          fit="cover"
          h="100%"
          style={{ aspectRatio: '1', width: 'auto', flexShrink: 0 }}
          radius="sm"
        />
        <Stack gap={4} flex={1} style={{ minWidth: 0 }}>
          <div>
            <Text className={`${styles.body} ${styles.fit}`} fw={700}>
              {props.track}
            </Text>
            <Text className={`${styles.micro} ${styles.fit}`} c="dimmed">
              {props.artist}
            </Text>
          </div>
          <Progress value={props.progress * 100} size="xs" radius="xl" />
          <Group gap={6} justify="center" wrap="nowrap">
            <ActionIcon variant="subtle" color="gray" size="sm">
              <IconPlayerSkipBackFilled size={14} />
            </ActionIcon>
            <ActionIcon variant="filled" radius="xl" size="sm" onClick={() => setPlaying((value) => !value)}>
              {playing ? <IconPlayerPauseFilled size={14} /> : <IconPlayerPlayFilled size={14} />}
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="sm">
              <IconPlayerSkipForwardFilled size={14} />
            </ActionIcon>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}
