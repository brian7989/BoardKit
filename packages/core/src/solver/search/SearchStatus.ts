import type { ValueOf } from '../../shared/unions/ValueOf.js';

export const SearchStatus = {
  Solved: 'solved',
  None: 'none',
  BudgetExhausted: 'budget-exhausted',
} as const;

export type SearchStatus = ValueOf<typeof SearchStatus>;
