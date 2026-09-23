import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Stocks } from './Stocks';

export interface Ticker {
  readonly symbol: string;
  readonly price: number;
  readonly changePct: number;
  readonly history: readonly number[];
}

export interface StocksProps extends Record<string, unknown> {
  readonly watchlist: readonly Ticker[];
}

function randomTicker(symbol: string): Ticker {
  const price = faker.number.float({ min: 12, max: 480, fractionDigits: 2 });
  const changePct = faker.number.float({ min: -6, max: 6, fractionDigits: 2 });
  // Walks from the pre-change price to the current one so the sparkline's trend always
  // agrees with changePct's sign, not just a random wobble around the current price.
  const startPrice = price / (1 + changePct / 100);
  const history = Array.from({ length: 12 }, (_, index) => {
    const trend = startPrice + (price - startPrice) * (index / 11);
    return trend * (1 + faker.number.float({ min: -0.015, max: 0.015, fractionDigits: 3 }));
  });
  history[history.length - 1] = price;
  return { symbol, price, changePct, history };
}

export const stocksWidget = defineWidget<StocksProps>({
  type: 'stocks',
  title: 'Stocks',
  sizes: ['1x1', '2x1', '2x2'],
  defaultProps: { watchlist: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'TSLA'].map(randomTicker) },
  component: Stocks,
});
