import { Scene } from 'phaser';
import { CELL_DIAMOND, CELL_EXIT, CELL_PER_TILE, CELL_TREASURE, CELL_WALKABLE } from '../config';
import { Tile } from './tile';

export class Map {
    scene: Scene;
    tilemap: Phaser.Tilemaps.Tilemap;
    tiles: Tile[][];
    tileSize: {
        width: number;
        height: number;
    }
    exits: Phaser.Tilemaps.Tile[] = [];
    treasures: Phaser.Tilemaps.Tile[] = [];
    diamond: Phaser.Tilemaps.Tile;

    constructor(scene: Scene) {
        this.scene = scene;

        this.tilemap = this.scene.make.tilemap({
            key: 'labyrinth-tiles'
        });

        const tileset = this.tilemap.addTilesetImage('labyrinth-tiles-32', 'labyrinth-tiles');
        const mapLayer = this.tilemap.createLayer('map-1', tileset);

        mapLayer.layer.data.forEach(row => {
            row.forEach(tile => {
                tile.alpha = 0;
            });
        });

        const roomLayer = this.tilemap.createLayer('rooms-1', tileset);

        // extract room items
        roomLayer.layer.data.forEach(row => {
            row.forEach(tile => {
                if (tile.index === CELL_EXIT) {
                    this.exits.push(tile);
                } else if (tile.index === CELL_TREASURE) {
                    this.treasures.push(tile);

                    this.tilemap.getTileAt(tile.x, tile.y).properties.foo = 'asda';
                } else if (tile.index === CELL_DIAMOND) {
                    this.diamond = tile;
                }
            });
        });

        this.tilemap.setLayer('map-1');
    }

    isWalkableTile(pos: Phaser.Types.Math.Vector2Like): boolean {
        if (this.isEdgeTile(pos)) {
            return false;
        }

        const tile = this.tilemap.getTileAt(pos.x, pos.y);
        return tile.index === CELL_WALKABLE;
    }

    isEdgeTile(pos: Phaser.Types.Math.Vector2Like): boolean {
        if (pos.x === 0 || pos.x === this.tilemap.width - 1) {
            return true;
        }

        if (pos.y === 0 || pos.y === this.tilemap.height - 1) {
            return true;
        }
    }

    isExit(pos: Phaser.Types.Math.Vector2Like): boolean {
        return this.tilemap.getTileAt(pos.x, pos.y, true, 'rooms-1').index === CELL_EXIT;
    }

    isExiting(playerPos: Phaser.Types.Math.Vector2Like, destinationPosition: Phaser.Types.Math.Vector2Like): boolean {
        let onExitTile = false;

        for (let i = 0; i < this.exits.length; i++) {
            const exit = this.exits[i];
            if (exit.x === playerPos.x && exit.y === playerPos.y) {
                onExitTile = true;
                break;
            }
        }

        return onExitTile && this.isEdgeTile(destinationPosition);
    }

    hasTreasure(pos: Phaser.Types.Math.Vector2Like): boolean {
        return this.tilemap.getTileAt(pos.x, pos.y, true, 'rooms-1').index === CELL_TREASURE;
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
        const distY = a.y - b.y;

        if (a.x === b.x && Math.abs(distY) === CELL_PER_TILE) {
            if (distY > 0) {
                return this.tilemap.getTileAt(a.x, a.y - 1).index === CELL_WALKABLE;
            }
            return this.tilemap.getTileAt(a.x, a.y + 1).index === CELL_WALKABLE;
        }

        const distX = a.x - b.x;

        if (a.y === b.y && Math.abs(distX) === CELL_PER_TILE) {
            if (distX > 0) {
                return this.tilemap.getTileAt(a.x - 1, a.y).index === CELL_WALKABLE;
            }
            return this.tilemap.getTileAt(a.x + 1, a.y).index === CELL_WALKABLE;
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