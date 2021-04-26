import { Scene } from 'phaser';
import { CELL_DIAMOND, CELL_EXIT, CELL_PER_TILE, CELL_TREASURE, CELL_WALKABLE, HALF_TILE_SIZE, MAP_VARIANTS } from '../config';
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
    mapIndex: number;
    sparkles: Sparkle[] = [];

    constructor(scene: Scene) {
        this.scene = scene;

        this.tilemap = this.scene.make.tilemap({
            key: 'labyrinth_map'
        });

        this.mapIndex = Math.ceil(Math.random() * MAP_VARIANTS);

        const tileset = this.tilemap.addTilesetImage('labyrinth-tiles-32', 'labyrinth_tiles_32');
        const mapLayer = this.tilemap.createLayer(`map-${this.mapIndex}`, tileset);

        mapLayer.layer.data.forEach(row => {
            row.forEach(tile => {
                tile.alpha = 0;
            });
        });

        const roomLayer = this.tilemap.createLayer(`rooms-${this.mapIndex}`, tileset);

        // debug
        roomLayer.visible = false;

        // extract room items
        roomLayer.layer.data.forEach(row => {
            row.forEach(tile => {
                if (tile.index === CELL_EXIT) {
                    this.exits.push(tile);
                } else if (tile.index === CELL_TREASURE) {
                    this.treasures.push(tile);

                    const worldXY = this.tilemap.tileToWorldXY(tile.x, tile.y);
                    const random = Math.ceil(Math.random() * 3);
                    const image = this.scene.add.image(worldXY.x + HALF_TILE_SIZE, worldXY.y + HALF_TILE_SIZE, `sparkle_${random}`);
                    image.alpha = 0;
                    image.angle = Math.ceil(Math.random() * 360);

                    const tween = this.scene.tweens.add({
                        targets: image,
                        alpha: 1,
                        ease: Phaser.Math.Easing.Sine.InOut,
                        duration: 600,
                        repeat: -1,
                        yoyo: true,
                        repeatDelay: Phaser.Math.Between(7000, 12000),
                        delay: Phaser.Math.Between(5000, 15000)
                    });

                    this.sparkles.push({
                        x: tile.x,
                        y: tile.y,
                        image,
                        tween
                    })
                } else if (tile.index === CELL_DIAMOND) {
                    this.diamond = tile;
                }
            });
        });

        this.tilemap.setLayer(`map-${this.mapIndex}`);
    }

    isWalkableTile(pos: Phaser.Types.Math.Vector2Like): boolean {
        if (this.isEdgeTile(pos)) {
            return false;
        }

        const tile = this.tilemap.getTileAt(pos.x, pos.y);
        return CELL_WALKABLE.includes(tile.index);
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
        return this.tilemap.getTileAt(pos.x, pos.y, true, `rooms-${this.mapIndex}`).index === CELL_EXIT;
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

    hasTreasure(pos: Phaser.Types.Math.Vector2Like): number {
        const tileIndex = this.tilemap.getTileAt(pos.x, pos.y, true, `rooms-${this.mapIndex}`).index;
        if (tileIndex === CELL_TREASURE || tileIndex === CELL_DIAMOND) {
            return tileIndex;
        }

        return null;
    }

    playerEnterredTile(position: Phaser.Types.Math.Vector2Like): void {
        // illuminate neighbours
        const compass = this.getCompassIndexes(position);

        Object.keys(compass).forEach(dir => {
            const compassPos = compass[dir];

            if (this.objectsAreAdjacent(position, compassPos)) {
                const tiles1 = this.getCellsAtTile(compassPos)
                tiles1.forEach(tile => {
                    if (!tile) {
                        return;
                    }
                    this.illuminateTile(tile, 0xcccccc);
                });
            }
        })

        const tiles = this.getCellsAtTile(position);
        tiles.forEach(tile => this.illuminateTile(tile, 0xffffff));
    }

    getCompassIndexes(pos: Phaser.Types.Math.Vector2Like): CompassIndexes {
        return {
            n: {
                x: pos.x,
                y: pos.y - CELL_PER_TILE
            },
            e: {
                x: pos.x + CELL_PER_TILE,
                y: pos.y
            },
            s: {
                x: pos.x,
                y: pos.y + CELL_PER_TILE
            },
            w: {
                x: pos.x - CELL_PER_TILE,
                y: pos.y
            }
        }
    }

    illuminateTile(tile: Phaser.Tilemaps.Tile, tint: number): void {
        tile.alpha = 1;
        tile.tint = tint;
    }

    darkenTile(tile: Phaser.Tilemaps.Tile): void {
        tile.tint = 0xffffff;
        tile.alpha = 0;
    }

    fadeFromMemory(pos: Phaser.Types.Math.Vector2Like): void {
        const compass = this.getCompassIndexes(pos);

        Object.keys(compass).forEach(dir => {
            const compassPos = compass[dir];

            if (this.objectsAreAdjacent(pos, compassPos)) {
                const tiles1 = this.getCellsAtTile(compassPos)
                tiles1.forEach(tile => {
                    if (!tile) {
                        return;
                    }
                    this.darkenTile(tile);
                });
            }
        })

        const tiles = this.getCellsAtTile(pos);
        tiles.forEach(tile => this.darkenTile(tile));
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
                return CELL_WALKABLE.includes(this.tilemap.getTileAt(a.x, a.y - 1).index);
            }
            return CELL_WALKABLE.includes(this.tilemap.getTileAt(a.x, a.y + 1).index);
        }

        const distX = a.x - b.x;

        if (a.y === b.y && Math.abs(distX) === CELL_PER_TILE) {
            if (distX > 0) {
                return CELL_WALKABLE.includes(this.tilemap.getTileAt(a.x - 1, a.y).index);
            }
            return CELL_WALKABLE.includes(this.tilemap.getTileAt(a.x + 1, a.y).index);
        }

        return false;
    }

    removeTreasureAt(pos: Phaser.Types.Math.Vector2Like): void {
        this.tilemap.putTileAt(-1, pos.x, pos.y, true, `rooms-${this.mapIndex}`);

        for (let i = 0; i < this.sparkles.length; i++) {
            const sparkle = this.sparkles[i];
            if (sparkle.x === pos.x && sparkle.y === pos.y) {
                sparkle.tween.complete();
                sparkle.image.destroy();
                this.sparkles.splice(i, 1);
                break;
            }
        }
    }
}

export interface ValidMovePositions {
    n: boolean;
    e: boolean;
    s: boolean;
    w: boolean;
}

export interface CompassIndexes {
    n: Phaser.Types.Math.Vector2Like;
    e: Phaser.Types.Math.Vector2Like;
    s: Phaser.Types.Math.Vector2Like;
    w: Phaser.Types.Math.Vector2Like;
}

interface Sparkle {
    x: number;
    y: number;
    image: Phaser.GameObjects.Image;
    tween: Phaser.Tweens.Tween;
}