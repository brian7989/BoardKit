import { describe, expect, it } from 'vitest';
import { buildInitialWidget } from './buildInitialWidget.js';
import type { WidgetManifest } from '../../widget/index.js';
import type { WidgetProps } from '../../widget/WidgetProps.js';

function Clock(_props: WidgetProps) {
  return null;
}

const MANIFEST: WidgetManifest = { type: 'clock', title: 'Clock', sizes: [], defaultProps: { label: 'Local' }, component: Clock };
const BARE: WidgetManifest = { type: 'clock', title: 'Clock', sizes: [], component: Clock };

describe('buildInitialWidget', () => {
  it('merges default and entry props', () => {
    const widget = buildInitialWidget({ widget: 'clock', props: { label: 'UTC' } }, MANIFEST, 'w-clock');
    expect(widget).toMatchObject({ id: 'w-clock', type: 'clock', props: { label: 'UTC' } });
  });

  it('omits props entirely when there are none', () => {
    const widget = buildInitialWidget({ widget: 'clock' }, BARE, 'w-clock');
    expect(widget.props).toBeUndefined();
  });

  it('carries an explicit name through as displayName', () => {
    const widget = buildInitialWidget({ widget: 'clock', name: 'Kitchen' }, MANIFEST, 'w-clock');
    expect(widget.displayName).toBe('Kitchen');
  });
});
