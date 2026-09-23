// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState } from 'boardkit-core';
import { Board } from './board/Board.js';
import { BoardProvider } from './provider/BoardProvider.js';
import { defineBoards } from './provider/config/defineBoards.js';
import { defineWidget, type WidgetProps } from './widget/index.js';

interface LabelProps extends Record<string, unknown> {
  readonly label: string;
}

function Label({ props }: WidgetProps<LabelProps>) {
  return <span>{props.label}</span>;
}

const labelWidget = defineWidget<LabelProps>({
  type: 'label',
  title: 'Label',
  sizes: [{ w: cell(1), h: cell(1) }],
  component: Label,
});

const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [labelWidget] });

function seedState(): BoardsState {
  const result = config.engine.apply(config.engine.empty(), {
    type: OpType.Add,
    board: boardId('default'),
    tileId: tileId('t1'),
    widget: { id: widgetId('w1'), type: 'label', props: { label: 'hello from ssr' } },
    size: { w: cell(1), h: cell(1) },
  });
  if (!result.ok) throw new Error('fixture setup failed');
  return result.value.state;
}

describe('server rendering', () => {
  it('renders a board with a widget tile to a markup string', () => {
    const markup = renderToString(
      <BoardProvider config={config} defaultValue={seedState()}>
        <Board />
      </BoardProvider>,
    );
    expect(markup).toContain('hello from ssr');
  });
});
