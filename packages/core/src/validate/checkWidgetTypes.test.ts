import { describe, expect, it } from 'vitest';
import { checkWidgetTypes } from './checkWidgetTypes.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { EngineContext } from '../engine/EngineContext.js';

const WIDGET_TYPE = 'demo.widget';
const CTX: EngineContext = {
  grid: { cols: 4, rows: 4, cellAspect: 1 },
  catalog: { [WIDGET_TYPE]: { sizes: [{ w: cell(1), h: cell(1) }] } },
  solver: { maxNodes: 1000, directions: [], nudgeOnResize: true },
};

function candidateWith(type: string, size = { w: cell(1), h: cell(1) }): ValidCandidate {
  return {
    grid: { cols: 4, rows: 4 },
    boards: [{ id: boardId('default'), tiles: [{ id: tileId('t0'), col: cell(0), row: cell(0), size, items: [{ id: widgetId('w0'), type }], active: 0 }] }],
  };
}

describe('checkWidgetTypes', () => {
  it('reports nothing for a registered type at a supported size', () => {
    expect(checkWidgetTypes(candidateWith(WIDGET_TYPE), CTX)).toEqual([]);
  });

  it('reports UnknownWidgetType for a type absent from the catalog', () => {
    const issues = checkWidgetTypes(candidateWith('not.registered'), CTX);
    expect(issues).toEqual([
      { kind: IssueKind.UnknownWidgetType, board: boardId('default'), tile: tileId('t0'), message: 'Widget type "not.registered" is not registered.' },
    ]);
  });

  it('reports SizeUnsupported for a registered type at an unsupported size', () => {
    const issues = checkWidgetTypes(candidateWith(WIDGET_TYPE, { w: cell(2), h: cell(2) }), CTX);
    expect(issues).toEqual([
      { kind: IssueKind.SizeUnsupported, board: boardId('default'), tile: tileId('t0'), message: 'Widget "demo.widget" does not support this tile\'s size.' },
    ]);
  });
});
