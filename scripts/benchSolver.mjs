import { createEngine, OpType, boardId, tileId, widgetId, cell } from '../packages/core/dist/index.js';

function runBasic() {
  const S = { w: cell(1), h: cell(1) };
  const B = { w: cell(2), h: cell(2) };
  const engine = createEngine({ grid: { cols: 6, rows: 4 }, catalog: { w: { sizes: [S, B, { w: cell(2), h: cell(1) }] } } });
  const board = boardId('default');
  let st = engine.empty();
  let n = 0;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 6; x++) {
      const r = engine.apply(st, { type: OpType.Add, board, tileId: tileId('t' + n), widget: { id: widgetId('w' + n), type: 'w' }, size: S, at: { x: cell(x), y: cell(y) } });
      n++;
      if (!r.ok) throw new Error(JSON.stringify(r.error));
      st = r.value.state;
    }
  }
  const time = (label, f) => {
    const t = performance.now();
    const r = f();
    console.log(label, (performance.now() - t).toFixed(1) + 'ms', r.ok ? 'ok' : r.error.reason);
  };
  time('move 1x1 (0,0)->(3,2)', () => engine.apply(st, { type: OpType.Move, board, tile: tileId('t0'), to: { x: cell(3), y: cell(2) } }));
  time('move 1x1 (0,0)->(5,3)', () => engine.apply(st, { type: OpType.Move, board, tile: tileId('t0'), to: { x: cell(5), y: cell(3) } }));
  time('add 1x1 to full board', () => engine.apply(st, { type: OpType.Add, board, tileId: tileId('x'), widget: { id: widgetId('x'), type: 'w' }, size: S, at: { x: cell(0), y: cell(0) } }));
  time('resize 1x1 -> 2x2 on full', () => engine.apply(st, { type: OpType.Resize, board, tile: tileId('t7'), size: B }));
  let st2 = st;
  for (const id of ['t20', 't21', 't22', 't23']) st2 = engine.apply(st2, { type: OpType.Remove, board, tile: tileId(id) }).value.state;
  time('move with 4 free (0,0)->(3,1)', () => engine.apply(st2, { type: OpType.Move, board, tile: tileId('t0'), to: { x: cell(3), y: cell(1) } }));
  time('resize to 2x2 with 4 free', () => engine.apply(st2, { type: OpType.Resize, board, tile: tileId('t7'), size: B }));
}

function runDense8x8() {
  const sz = (w, h) => ({ w: cell(w), h: cell(h) });
  const engine = createEngine({ grid: { cols: 8, rows: 8 }, catalog: { w: { sizes: [sz(1, 1), sz(2, 1), sz(1, 2), sz(2, 2)] } } });
  const board = boardId('default');
  let st = engine.empty();
  let n = 0;
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 400; i++) {
    const s = [sz(1, 1), sz(2, 1), sz(1, 2), sz(2, 2)][Math.floor(rnd() * 4)];
    const r = engine.apply(st, { type: OpType.Add, board, tileId: tileId('t' + n), widget: { id: widgetId('w' + n), type: 'w' }, size: s });
    if (r.ok) {
      st = r.value.state;
      n++;
    }
  }
  const tiles = st.boards[0].tiles;
  console.log('tiles', tiles.length, 'area', tiles.reduce((a, t) => a + t.size.w * t.size.h, 0), '/ 64');
  const times = [];
  let ok = 0;
  for (let i = 0; i < 300; i++) {
    const t = tiles[Math.floor(rnd() * tiles.length)];
    const to = { x: cell(Math.floor(rnd() * 7)), y: cell(Math.floor(rnd() * 7)) };
    const t0 = performance.now();
    const r = engine.apply(st, { type: OpType.Move, board, tile: t.id, to });
    times.push(performance.now() - t0);
    if (r.ok) ok++;
  }
  times.sort((a, b) => a - b);
  const q = (p) => times[Math.floor(p * (times.length - 1))].toFixed(2);
  console.log(`8x8 dense moves: ok ${ok}/300  median ${q(0.5)}ms  p95 ${q(0.95)}ms  max ${q(1)}ms  total ${times.reduce((a, b) => a + b, 0).toFixed(0)}ms`);
}

runBasic();
runDense8x8();
