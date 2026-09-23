import { afterEach, describe, expect, it, vi } from 'vitest';
import { warnOnce } from './warnOnce.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('warnOnce', () => {
  it('logs the message once for a given key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce('once-a', 'first');
    warnOnce('once-a', 'first');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('first');
  });

  it('logs again for a different key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce('once-b', 'one');
    warnOnce('once-c', 'two');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
