import { SearchStatus } from './SearchStatus.js';

export type SearchOutcome<S> =
  | { readonly status: typeof SearchStatus.Solved; readonly solution: S }
  | { readonly status: typeof SearchStatus.None }
  | { readonly status: typeof SearchStatus.BudgetExhausted };
