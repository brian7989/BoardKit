import { Box, Image, Text } from '@mantine/core';
import { IMAGE_FALLBACK } from '../imageFallback';
import type { NowPlayingProps } from './manifest';

export function NowPlaying1x1({ props }: { readonly props: NowPlayingProps }) {
  return (
    <Box pos="relative" h="100%" w="100%">
      <Image src={props.art} fallbackSrc={IMAGE_FALLBACK} alt="" fit="cover" h="100%" w="100%" radius="md" />
      <Text
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
        c="white"
        fw={700}
        p={13}
        style={{ fontSize: 13, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}
        truncate
      >
        {props.track}
      </Text>
    </Box>
  );
}
