import { Box, Image, Text } from '@mantine/core';
import { IMAGE_FALLBACK } from '../imageFallback';
import type { PhotoProps } from './manifest';

export function Photo2x2({ name, props }: { readonly name: string; readonly props: PhotoProps }) {
  return (
    <Box pos="relative" h="100%" w="100%">
      <Image src={props.src} fallbackSrc={IMAGE_FALLBACK} alt={props.caption} fit="cover" h="100%" w="100%" radius="md" />
      <Text
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
        c="white"
        fw={600}
        p={13}
        style={{ fontSize: 13, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
      >
        {name} · {props.caption}
      </Text>
    </Box>
  );
}
