import type { CSSProperties } from 'react';
import { AriaRole } from '../dom/AriaRole.js';

export interface LiveRegionProps {
  readonly message: string;
}

const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/** An off-screen aria-live region announcing `message` to screen readers. */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <div role={AriaRole.Status} aria-live="polite" style={VISUALLY_HIDDEN}>
      {message}
    </div>
  );
}
