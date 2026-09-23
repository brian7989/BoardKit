import type { CSSProperties } from 'react';

// csstype's CSSProperties has no index signature for a `--foo` custom-property key, hence the cast.
export function cssVars(style: CSSProperties, vars: Readonly<Record<string, string | number>>): CSSProperties {
  return { ...style, ...vars } as CSSProperties;
}
