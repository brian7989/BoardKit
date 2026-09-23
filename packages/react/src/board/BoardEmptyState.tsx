import type { CSSProperties, ReactNode } from 'react';
import { DataAttr } from '../shared/index.js';

export interface BoardEmptyStateProps {
  readonly emptyState: ReactNode | undefined;
  readonly empty: boolean;
}

const DEFAULT_MESSAGE = 'No widgets on this page yet.';

const wrapperStyle: CSSProperties = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };

/** The board's empty message (or a host's `emptyState`), hidden by `null` or while a drag is live. */
export function BoardEmptyState({ emptyState, empty }: BoardEmptyStateProps) {
  if (!empty || emptyState === null) return null;

  return (
    <div style={wrapperStyle} {...{ [DataAttr.Empty]: 'true' }}>
      {emptyState ?? DEFAULT_MESSAGE}
    </div>
  );
}
