import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Leaderboard } from './Leaderboard';

export interface LeaderboardEntry {
  readonly name: string;
  readonly avatar: string;
  readonly score: number;
  readonly deltaPct: number;
}

export interface LeaderboardProps extends Record<string, unknown> {
  readonly entries: readonly LeaderboardEntry[];
}

function randomEntry(): LeaderboardEntry {
  return {
    name: faker.person.fullName(),
    avatar: faker.image.avatarGitHub(),
    score: faker.number.int({ min: 1200, max: 9800 }),
    deltaPct: faker.number.float({ min: -8, max: 12, fractionDigits: 1 }),
  };
}

export const leaderboardWidget = defineWidget<LeaderboardProps>({
  type: 'leaderboard',
  title: 'Leaderboard',
  sizes: ['2x2', '4x2'],
  defaultProps: { entries: Array.from({ length: 8 }, randomEntry).sort((a, b) => b.score - a.score) },
  component: Leaderboard,
});
