import { InteractionPhase, type Board as BoardModel, type InteractionState } from 'boardkit-core';
import { tileStyle, type TileGrid } from '../tile/index.js';
import { DataAttr } from '../shared/index.js';

export interface DropPlaceholderProps {
  readonly board: BoardModel;
  readonly interactionState: InteractionState;
  readonly grid: TileGrid;
}

function dropPlaceholderDataAttributes(valid: boolean): Record<string, string> {
  return { [DataAttr.Placeholder]: 'true', [DataAttr.Valid]: valid ? 'true' : 'false' };
}

export function DropPlaceholder({ board, interactionState, grid }: DropPlaceholderProps) {
  if (interactionState.phase !== InteractionPhase.Dragging) return null;
  const tile = board.tiles.find((candidate) => candidate.id === interactionState.tile);
  if (!tile) return null;

  const position = { col: interactionState.target.x, row: interactionState.target.y };
  const style = tileStyle(position, tile.size, grid);
  return <div style={style} {...dropPlaceholderDataAttributes(interactionState.preview.ok)} />;
}
