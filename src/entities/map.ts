import { Scene } from 'phaser';
import { CELL_PER_TILE, CELL_WALKABLE } from '../config';
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

        const tileset = this.tilemap.addTilesetImage('labyrinth-tiles-32', 'labyrinth-tiles');
        const tileLayer = this.tilemap.createLayer('map-1', tileset);

        tileLayer.layer.data.forEach(row => {
            row.forEach(tile => {
                tile.alpha = 0;
            });
        });
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
        const tile = this.tilemap.getTileAt(b.x, b.y);
        return tile.index === CELL_WALKABLE;
    }

    playerEnterredTile(position: Phaser.Types.Math.Vector2Like): void {
        const tiles = this.getCellsAtTile(position);
        tiles.forEach(tile => tile.alpha = 1);
        tiles.forEach(tile => tile.tint = 0xffffff);
    }

    fadeFromMemory(pos: Phaser.Types.Math.Vector2Like, forgot: boolean): void {
        if (forgot) {
            this.getCellsAtTile(pos).forEach(tile => tile.alpha = 0);
        } else {
            this.getCellsAtTile(pos).forEach(tile => tile.tint = 0x333333);
        }
    }

    getTileAt(position: Phaser.Types.Math.Vector2Like): Phaser.Tilemaps.Tile {
        return this.tilemap.getTileAt(position.x, position.y);
    }

    getCellsAtTile(position: Phaser.Types.Math.Vector2Like): Phaser.Tilemaps.Tile[] {
        return [
            this.tilemap.getTileAt(position.x - 1, position.y - 1),
            this.tilemap.getTileAt(position.x, position.y - 1),
            this.tilemap.getTileAt(position.x + 1, position.y - 1),
            this.tilemap.getTileAt(position.x - 1, position.y),
            this.tilemap.getTileAt(position.x, position.y),
            this.tilemap.getTileAt(position.x + 1, position.y),
            this.tilemap.getTileAt(position.x - 1, position.y + 1),
            this.tilemap.getTileAt(position.x, position.y + 1),
            this.tilemap.getTileAt(position.x + 1, position.y + 1)
        ];
    }

    objectsAreAdjacent(a: Phaser.Types.Math.Vector2Like, b: Phaser.Types.Math.Vector2Like): boolean {
        if (a.x === b.x && Math.abs(a.y - b.y) === CELL_PER_TILE) {
            return true;
        }

        if (a.y === b.y && Math.abs(a.x - b.x) === CELL_PER_TILE) {
            return true;
        }

        return false;
    }
}

export interface ValidMovePositions {
    n: boolean;
    e: boolean;
    s: boolean;
    w: boolean;
}