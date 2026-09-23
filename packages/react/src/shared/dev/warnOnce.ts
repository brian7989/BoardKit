const NODE_ENV_PRODUCTION = 'production';
const warned = new Set<string>();

/** Dev-only `console.warn`, at most once per `key`; a no-op in production (and tree-shaken there). */
export function warnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === NODE_ENV_PRODUCTION) return;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}
