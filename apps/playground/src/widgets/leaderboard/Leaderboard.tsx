import type { WidgetProps } from 'boardkit-react';
import { Leaderboard2x2 } from './Leaderboard2x2';
import { Leaderboard4x2 } from './Leaderboard4x2';
import type { LeaderboardProps } from './manifest';

export function Leaderboard({ props, cells }: WidgetProps<LeaderboardProps>) {
  if (cells.w > 2) return <Leaderboard4x2 props={props} />;
  return <Leaderboard2x2 props={props} />;
}
