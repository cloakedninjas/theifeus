import { Scene } from 'phaser';
import { CELL_PER_TILE, TILE_SIZE } from '../config';
import { Tile } from './tile';

export class Map {
    tilemap: Phaser.Tilemaps.Tilemap;

    tiles: Tile[][];
    tileSize: {
        width: number;
        height: number;
    }
    scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;

        this.tilemap = this.scene.make.tilemap({
            key: 'labyrinth-tiles'
        });

        const tileset = this.tilemap.addTilesetImage('labyrinth-tiles', 'labyrinth-tiles');
        const tileLayer = this.tilemap.createLayer('Map-2', tileset);

        tileLayer.layer.data.forEach(row => {
            row.forEach(tile => {
                tile.tint = 0x333333;
            });
        });

        //
    }

    getValidMovePositions(pos: Phaser.Types.Math.Vector2Like): ValidMovePositions {
        return {
            n: this.tilemap.getTileAt(pos.x, pos.y - 1)?.properties.walkable,
            e: this.tilemap.getTileAt(pos.x + 1, pos.y)?.properties.walkable,
            s: this.tilemap.getTileAt(pos.x, pos.y + 1)?.properties.walkable,
            w: this.tilemap.getTileAt(pos.x - 1, pos.y)?.properties.walkable
        };
    }

    isMoveValid(a: Phaser.Types.Math.Vector2Like, b: Phaser.Types.Math.Vector2Like): boolean {
        const north = b.y === a.y - 1;
        const east = b.x === a.x + 1;
        const south = b.y === a.y + 1;
        const west = b.x === a.x - 1;

        let cell1;
        let cell2;

        if (north) {
            cell1 = this.tilemap.getTileAt((a.x * CELL_PER_TILE) + 1, (a.y * CELL_PER_TILE));
            cell2 = this.tilemap.getTileAt((b.x * CELL_PER_TILE) + 1, (b.y * CELL_PER_TILE) + 2);

            /* cell1.tint = 0xff0000;
            cell2.tint = 0xff0000; */

            return cell1.index === cell2.index && cell1.index === 7;
        }

        //const tile = this.tilemap.getTileAt(b.x, b.y);
        //return tile.properties.walkable;

        return false;
    }

    playerEnterredTile(position: Phaser.Types.Math.Vector2Like): void {
        const tiles = this.getCellsAtTile(position);
        tiles.forEach(tile => tile.tint = 0xffffff);
    }

    getTileAt(position: Phaser.Types.Math.Vector2Like): Phaser.Tilemaps.Tile {
        return this.tilemap.getTileAt(position.x, position.y);
    }

    getCentreCellAtTile(position: Phaser.Types.Math.Vector2Like): Phaser.Tilemaps.Tile {
        const centreCell = {
            x: (position.x * CELL_PER_TILE) + 1,
            y: (position.y * CELL_PER_TILE) + 1
        };

        return this.tilemap.getTileAt(centreCell.x, centreCell.y);
    }

    getCellsAtTile(position: Phaser.Types.Math.Vector2Like): Phaser.Tilemaps.Tile[] {
        const centreCell = {
            x: (position.x * CELL_PER_TILE) + 1,
            y: (position.y * CELL_PER_TILE) + 1
        };

        return [
            this.tilemap.getTileAt(centreCell.x - 1, centreCell.y - 1),
            this.tilemap.getTileAt(centreCell.x, centreCell.y - 1),
            this.tilemap.getTileAt(centreCell.x + 1, centreCell.y - 1),
            this.tilemap.getTileAt(centreCell.x - 1, centreCell.y),
            this.tilemap.getTileAt(centreCell.x, centreCell.y),
            this.tilemap.getTileAt(centreCell.x + 1, centreCell.y),
            this.tilemap.getTileAt(centreCell.x - 1, centreCell.y + 1),
            this.tilemap.getTileAt(centreCell.x, centreCell.y + 1),
            this.tilemap.getTileAt(centreCell.x + 1, centreCell.y + 1)
        ];
    }
}

export interface ValidMovePositions {
    n: boolean;
    e: boolean;
    s: boolean;
    w: boolean;
}