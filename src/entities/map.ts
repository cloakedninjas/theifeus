import { Scene } from 'phaser';
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
            key: 'terrain'
        });

        const tileset = this.tilemap.addTilesetImage('Artboard 1', 'terrain');
        this.tilemap.createLayer('Tile Layer 1', tileset);
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
        const vDist = Math.abs(a.y - b.y);
        const hDist = Math.abs(a.x - b.x);

        if (vDist > 1 || hDist > 1) {
            // not adjacent
            return false;
        }

        if (vDist === 0 && hDist === 0) {
            // same tile
            return false;
        }

        const left = b.x === a.x - 1;
        const right = b.x === a.x + 1;
        const top = b.y === a.y - 1;
        const bottom = b.y === a.y + 1;

        const vert = top || bottom;
        const horiz = left || right;

        if (horiz && vert) {
            // diagonal
            return false;
        }

        const tile = this.tilemap.getTileAt(b.x, b.y);
        return tile.properties.walkable;
    }
}

export interface ValidMovePositions {
    n: boolean;
    e: boolean;
    s: boolean;
    w: boolean;
}