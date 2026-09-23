import { Tile } from '../tile/index.js';
import { useBoardTiles } from './useBoardTiles.js';

export function TileList() {
  const tiles = useBoardTiles();

  return (
    <>
      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}
    </>
  );
}
