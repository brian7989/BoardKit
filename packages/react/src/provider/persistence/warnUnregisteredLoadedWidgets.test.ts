import { afterEach, describe, expect, it, vi } from 'vitest';
import { warnUnregisteredLoadedWidgets } from './warnUnregisteredLoadedWidgets.js';
import type { WidgetManifest } from '../../widget/index.js';

const WIDGETS: ReadonlyMap<string, WidgetManifest> = new Map([['clock', { type: 'clock', title: 'Clock', sizes: [], component: () => null }]]);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('warnUnregisteredLoadedWidgets', () => {
  it('warns about a loaded tile type that is not registered', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = { boards: [{ tiles: [{ items: [{ type: 'ghost-widget' }] }] }] };
    warnUnregisteredLoadedWidgets(raw, WIDGETS);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toMatch(/ghost-widget/);
  });

  it('says nothing when every loaded type is registered', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = { boards: [{ tiles: [{ items: [{ type: 'clock' }] }] }] };
    warnUnregisteredLoadedWidgets(raw, WIDGETS);
    expect(spy).not.toHaveBeenCalled();
  });
});
