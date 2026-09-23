import type { Size } from '../shared/sizes/Size.js';
import type { SolverOptions } from '../solver/grid/SolverOptions.js';

export interface EngineContext {
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly catalog: Readonly<Record<string, { readonly sizes: readonly Size[] }>>;
  readonly solver: SolverOptions;
}
