import type { BoardId } from '../shared/ids/BoardId.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { IssueKind } from './IssueKind.js';

export interface Issue {
  readonly kind: IssueKind;
  readonly message: string;
  readonly board?: BoardId;
  readonly tile?: TileId;
  readonly path?: string;
}
