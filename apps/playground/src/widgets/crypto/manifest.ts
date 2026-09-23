import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Crypto } from './Crypto';

export interface CryptoProps extends Record<string, unknown> {
  readonly symbol: string;
  readonly price: number;
  readonly changePct: number;
  readonly history: readonly number[];
}

function randomProps(): CryptoProps {
  const price = faker.number.float({ min: 0.5, max: 68000, fractionDigits: 2 });
  const changePct = faker.number.float({ min: -12, max: 12, fractionDigits: 2 });
  // Walks from the pre-change price to the current one so the sparkline's trend always
  // agrees with changePct's sign, not just a random wobble around the current price.
  const startPrice = price / (1 + changePct / 100);
  const history = Array.from({ length: 12 }, (_, index) => {
    const trend = startPrice + (price - startPrice) * (index / 11);
    return trend * (1 + faker.number.float({ min: -0.02, max: 0.02, fractionDigits: 3 }));
  });
  history[history.length - 1] = price;
  return {
    symbol: faker.helpers.arrayElement(['BTC', 'ETH', 'SOL', 'DOGE']),
    price,
    changePct,
    history,
  };
}

export const cryptoWidget = defineWidget<CryptoProps>({
  type: 'crypto',
  title: 'Crypto',
  sizes: ['1x1', '2x1'],
  defaultProps: randomProps(),
  surface: { background: 'var(--mantine-color-dark-8)', color: 'white' },
  component: Crypto,
});
