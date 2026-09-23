import type { CSSProperties } from 'react';

export function letterboxStyle(): CSSProperties {
  return {
    containerType: 'size',
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
  };
}
