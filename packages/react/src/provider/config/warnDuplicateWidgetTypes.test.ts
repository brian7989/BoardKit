import { afterEach, describe, expect, it, vi } from 'vitest';
import { warnDuplicateWidgetTypes } from './warnDuplicateWidgetTypes.js';
import type { WidgetManifest } from '../../widget/index.js';

function manifest(type: string): WidgetManifest {
  return { type, title: type, sizes: [], component: () => null };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('warnDuplicateWidgetTypes', () => {
  it('warns about a type registered more than once', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnDuplicateWidgetTypes([manifest('dup-a'), manifest('dup-a')]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toMatch(/dup-a/);
  });

  it('says nothing when every type is unique', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnDuplicateWidgetTypes([manifest('unique-a'), manifest('unique-b')]);
    expect(spy).not.toHaveBeenCalled();
  });
});
