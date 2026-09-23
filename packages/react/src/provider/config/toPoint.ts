import { cell, type Cell, type Point } from 'boardkit-core';
import type { AtInput } from './AtInput.js';

function isTuple(at: AtInput): at is readonly [number, number] {
  return Array.isArray(at);
}

/** Normalizes an `AtInput` to a branded `Point<Cell>`. */
export function toPoint(at: AtInput): Point<Cell> {
  const [x, y] = isTuple(at) ? at : [at.x, at.y];
  return { x: cell(x), y: cell(y) };
}
