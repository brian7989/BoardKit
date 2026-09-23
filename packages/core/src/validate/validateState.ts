import type { Issue } from '../issues/index.js';
import type { ValidCandidate } from '../model/index.js';
import type { EngineContext } from '../engine/index.js';
import { checkBounds } from './checkBounds.js';
import { checkOverlap } from './checkOverlap.js';
import { checkWidgetTypes } from './checkWidgetTypes.js';
import { checkItems } from './checkItems.js';
import { checkUniqueIds } from './checkUniqueIds.js';
import { checkGridMatches } from './checkGridMatches.js';

// Only zero-issue candidates can become BoardsState via markValid.
export function validateState(state: ValidCandidate, ctx: EngineContext): readonly Issue[] {
  return [
    ...checkGridMatches(state, ctx),
    ...checkItems(state),
    ...checkUniqueIds(state),
    ...checkWidgetTypes(state, ctx),
    ...checkBounds(state, ctx),
    ...checkOverlap(state),
  ];
}
