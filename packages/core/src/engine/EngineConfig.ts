import type { Direction } from '../solver/grid/cost/Direction.js';
import type { Size } from '../shared/sizes/Size.js';

export interface EngineConfig {
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect?: number };
  readonly catalog: Readonly<Record<string, { readonly sizes: readonly Size[] }>>;
  readonly solver?: {
    readonly maxNodes?: number;
    readonly directions?: readonly Direction[];
    readonly nudgeOnResize?: boolean;
  };
}
