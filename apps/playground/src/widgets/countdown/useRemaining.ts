import { useEffect, useState } from 'react';

export interface Remaining {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
}

function remainingUntil(target: string): Remaining {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  const minutes = Math.floor(ms / 60_000);
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60 };
}

export function useRemaining(target: string): Remaining {
  const [remaining, setRemaining] = useState(() => remainingUntil(target));
  useEffect(() => {
    const id = setInterval(() => setRemaining(remainingUntil(target)), 60_000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}
