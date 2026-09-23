export interface StateStore<T> {
  readonly getState: () => T;
  readonly setState: (next: T) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

// setState notifies synchronously, so getState right after a commit is fresh before React re-renders subscribers.
export function createStateStore<T>(initial: T): StateStore<T> {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => current,
    setState: (next) => {
      current = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
