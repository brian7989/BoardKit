import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { cell, OpType, rectOfTile, tileId, type MoveOp, type Tile } from '../../packages/core/src/index.ts';
import { DEFAULT_BOARD, GRID_COLS, GRID_ROWS, SIZE_SMALL, makeTestEngine, rawState, type RawTile } from './fixtures.ts';

const cellArb = fc.record({ col: fc.integer({ min: 0, max: GRID_COLS - 1 }), row: fc.integer({ min: 0, max: GRID_ROWS - 1 }) });

const tilesArb = fc
  .uniqueArray(cellArb, { minLength: 0, maxLength: 6, selector: (c) => `${c.col},${c.row}` })
  .map((cells): readonly RawTile[] => cells.map((c, index) => ({ id: `t${index}`, col: c.col, row: c.row })));

function moveOpFor(tiles: readonly RawTile[], tileIndex: number, to: { col: number; row: number }): MoveOp {
  const target = tiles[tileIndex % tiles.length];
  if (!target) throw new Error('tiles must be non-empty');
  return { type: OpType.Move, board: DEFAULT_BOARD, tile: tileId(target.id), to: { x: cell(to.col), y: cell(to.row) } };
}

const SIZE = { w: cell(1), h: cell(1) };

describe('engine.apply(Move) properties', () => {
  it('ok implies the resulting state has no issues', () => {
    fc.assert(
      fc.property(tilesArb, fc.nat(), cellArb, (tiles, seed, to) => {
        fc.pre(tiles.length > 0);
        const engine = makeTestEngine();
        const parsed = engine.parse(rawState(tiles));
        if (!parsed.ok) throw new Error('fixture state should always parse');
        const result = engine.apply(parsed.value, moveOpFor(tiles, seed, to));
        if (result.ok) expect(engine.check(result.value.state)).toEqual([]);
      }),
    );
  });

  it('never loses or duplicates a widget', () => {
    fc.assert(
      fc.property(tilesArb, fc.nat(), cellArb, (tiles, seed, to) => {
        fc.pre(tiles.length > 0);
        const engine = makeTestEngine();
        const parsed = engine.parse(rawState(tiles));
        if (!parsed.ok) throw new Error('fixture state should always parse');
        const before = widgetIdsOf(parsed.value.boards[0]?.tiles ?? []);
        const result = engine.apply(parsed.value, moveOpFor(tiles, seed, to));
        if (result.ok) {
          const after = widgetIdsOf(result.value.state.boards[0]?.tiles ?? []);
          expect(after).toEqual(before);
        }
      }),
    );
  });

  it('keeps untouched tiles at the same object identity', () => {
    fc.assert(
      fc.property(tilesArb, fc.nat(), cellArb, (tiles, seed, to) => {
        fc.pre(tiles.length > 0);
        const engine = makeTestEngine();
        const parsed = engine.parse(rawState(tiles));
        if (!parsed.ok) throw new Error('fixture state should always parse');
        const result = engine.apply(parsed.value, moveOpFor(tiles, seed, to));
        if (!result.ok) return;
        const touched = new Set(result.value.changes.map((change) => change.tile));
        const before = parsed.value.boards[0]?.tiles ?? [];
        const after = result.value.state.boards[0]?.tiles ?? [];
        for (const beforeTile of before) {
          if (touched.has(beforeTile.id)) continue;
          const afterTile = after.find((candidate) => candidate.id === beforeTile.id);
          expect(afterTile).toBe(beforeTile);
        }
      }),
    );
  });

  it('moves only tiles that collided with the pinned rect or another moved tile', () => {
    fc.assert(
      fc.property(tilesArb, fc.nat(), cellArb, (tiles, seed, to) => {
        fc.pre(tiles.length > 0);
        const engine = makeTestEngine();
        const parsed = engine.parse(rawState(tiles));
        if (!parsed.ok) throw new Error('fixture state should always parse');
        const op = moveOpFor(tiles, seed, to);
        const result = engine.apply(parsed.value, op);
        if (!result.ok) return;

        const pinnedRect = rectOfTile({ x: op.to.x, y: op.to.y }, SIZE);
        const displaced = result.value.changes.filter((change) => change.tile !== op.tile);
        const newRects = new Map(result.value.changes.map((change) => [change.tile, change.to]));

        for (const change of displaced) {
          const originalRect = change.from;
          expect(originalRect).toBeDefined();
          const collidedWithPin = originalRect && rectsOverlap(originalRect, pinnedRect);
          const collidedWithMoved = [...newRects.entries()].some(
            ([id, rect]) => id !== change.tile && rect && originalRect && rectsOverlap(originalRect, rect),
          );
          expect(collidedWithPin || collidedWithMoved).toBe(true);
        }

        if (displaced.length === 0) {
          const overlapsNothing = !tiles.some((tile, index) => index !== seed % tiles.length && rectsOverlap(rectOfTile({ x: cell(tile.col), y: cell(tile.row) }, SIZE), pinnedRect));
          expect(overlapsNothing).toBe(true);
        }
      }),
    );
  });

  it('is deterministic regardless of the tiles array order', () => {
    fc.assert(
      fc.property(tilesArb, fc.nat(), cellArb, (tiles, seed, to) => {
        fc.pre(tiles.length > 1);
        const engine = makeTestEngine();
        const forward = engine.parse(rawState(tiles));
        const reversed = engine.parse(rawState([...tiles].reverse()));
        if (!forward.ok || !reversed.ok) throw new Error('fixture state should always parse');

        const op = moveOpFor(tiles, seed, to);
        const a = engine.apply(forward.value, op);
        const b = engine.apply(reversed.value, op);
        expect(a.ok).toBe(b.ok);
        if (a.ok && b.ok) {
          expect(positionsOf(a.value.state)).toEqual(positionsOf(b.value.state));
        }
      }),
    );
  });

  it('round-trips through JSON and parse', () => {
    fc.assert(
      fc.property(tilesArb, (tiles) => {
        const engine = makeTestEngine();
        const parsed = engine.parse(rawState(tiles));
        if (!parsed.ok) throw new Error('fixture state should always parse');
        const roundTripped = engine.parse(JSON.parse(JSON.stringify(engine.serialize(parsed.value))));
        expect(roundTripped.ok).toBe(true);
        if (roundTripped.ok) expect(positionsOf(roundTripped.value)).toEqual(positionsOf(parsed.value));
      }),
    );
  });
});

function widgetIdsOf(tiles: readonly Tile[]): readonly string[] {
  return tiles
    .flatMap((tile) => tile.items.map((item) => item.id))
    .sort();
}

function positionsOf(state: { boards: readonly { tiles: readonly Tile[] }[] }): Record<string, { col: number; row: number }> {
  const positions: Record<string, { col: number; row: number }> = {};
  for (const board of state.boards) {
    for (const tile of board.tiles) positions[tile.id] = { col: tile.col, row: tile.row };
  }
  return positions;
}

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
