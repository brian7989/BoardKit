import type { ValueOf } from '../shared/unions/ValueOf.js';

export const IssueKind = {
  OutOfBounds: 'out-of-bounds',
  Overlap: 'overlap',
  SizeUnsupported: 'size-unsupported',
  UnknownWidgetType: 'unknown-widget-type',
  EmptyTile: 'empty-tile',
  BadActiveIndex: 'bad-active-index',
  DuplicateId: 'duplicate-id',
  GridMismatch: 'grid-mismatch',
  SchemaVersion: 'schema-version',
  Malformed: 'malformed',
} as const;

export type IssueKind = ValueOf<typeof IssueKind>;
