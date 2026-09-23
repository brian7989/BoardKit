import { describe, expect, it } from 'vitest';
import { nextInitialId } from './nextInitialId.js';

describe('nextInitialId', () => {
  it('gives a plain type-based id the first time a type is used', () => {
    const counts = new Map<string, number>();
    expect(nextInitialId(counts, 'weather')).toEqual({ tile: 't-weather', widget: 'w-weather' });
  });

  it('suffixes repeat uses of the same type', () => {
    const counts = new Map<string, number>();
    nextInitialId(counts, 'weather');
    expect(nextInitialId(counts, 'weather')).toEqual({ tile: 't-weather-2', widget: 'w-weather-2' });
    expect(nextInitialId(counts, 'weather')).toEqual({ tile: 't-weather-3', widget: 'w-weather-3' });
  });

  it('tracks each type independently', () => {
    const counts = new Map<string, number>();
    nextInitialId(counts, 'weather');
    expect(nextInitialId(counts, 'clock')).toEqual({ tile: 't-clock', widget: 'w-clock' });
  });
});
