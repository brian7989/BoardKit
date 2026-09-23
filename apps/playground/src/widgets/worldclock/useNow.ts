import { useEffect, useState } from 'react';

// Ticks once a minute — plenty for a clock face, and far cheaper than every second across
// every world-clock tile on the board.
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
