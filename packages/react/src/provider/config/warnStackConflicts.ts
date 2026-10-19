import type { BoardsState, Tile } from 'boardkit-core';
import { warnOnce } from '../../shared/dev/warnOnce.js';
import { allTiles } from './allTiles.js';

interface StackNames {
  readonly breakpoint: string;
  readonly primary: string;
}

function describe(tile: Tile): string {
  return tile.items.map((item) => item.type).join(' + ');
}

function sameItems(a: Tile, b: Tile): boolean {
  return a.items.length === b.items.length && a.items.every((item) => b.items.some((other) => other.id === item.id));
}

// The tiles in `tiles` that hold any of `tile`'s widgets.
function holdersOf(tile: Tile, tiles: readonly Tile[]): readonly Tile[] {
  return tiles.filter((candidate) => candidate.items.some((item) => tile.items.some((mine) => mine.id === item.id)));
}

function suffix({ breakpoint, primary }: StackNames): string {
  return ` Stacks are the same on every breakpoint, so "${breakpoint}" uses "${primary}"'s.`;
}

// A stack this layout makes that the primary layout doesn't have as-is.
function warnOwnStacks(baseTiles: readonly Tile[], ownTiles: readonly Tile[], names: StackNames): void {
  for (const tile of ownTiles.filter((candidate) => candidate.items.length > 1)) {
    const holders = holdersOf(tile, baseTiles);
    const first = holders[0];
    if (holders.length === 1 && first && sameItems(first, tile)) continue;
    const theirs = holders.length === 1 && first && first.items.length > 1 ? `stacks ${describe(first)}` : 'has them on separate tiles';
    warnOnce(`stack-conflict:${names.breakpoint}:${tile.id}`, `Boards: the "${names.breakpoint}" layout stacks ${describe(tile)}, but "${names.primary}" ${theirs}.${suffix(names)}`);
  }
}

// A primary stack this layout splits across tiles.
function warnSplitStacks(baseTiles: readonly Tile[], ownTiles: readonly Tile[], names: StackNames): void {
  for (const tile of baseTiles.filter((candidate) => candidate.items.length > 1)) {
    const holders = holdersOf(tile, ownTiles);
    if (holders.length <= 1) continue;
    const listed = holders.map(describe).join(', ');
    warnOnce(`stack-split:${names.breakpoint}:${tile.id}`, `Boards: the "${names.breakpoint}" layout has ${listed} on separate tiles, but "${names.primary}" stacks ${describe(tile)}.${suffix(names)}`);
  }
}

/** Warns where a breakpoint's layout stacks widgets differently from the primary layout, whose stacks every breakpoint shares. */
export function warnStackConflicts(base: BoardsState, own: BoardsState, names: StackNames): void {
  const baseTiles = allTiles(base);
  const ownTiles = allTiles(own);
  warnOwnStacks(baseTiles, ownTiles, names);
  warnSplitStacks(baseTiles, ownTiles, names);
}
