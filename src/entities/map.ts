import { GameObjects, Scene } from 'phaser';
import { Tile, TILE_SIZE } from './tile';

export class Map extends GameObjects.Sprite {
    tiles: Tile[][];
    tileSize: {
        width: number;
        height: number;
    }

    constructor(scene: Scene) {
        super(scene, 0, 0, 'map');

        const grid = this.scene.cache.json.get('map');

        this.tileSize = {
            width: grid.length,
            height: grid[0].length
        };

        this.tiles = new Array(this.tileSize.height);

        grid.forEach((row, y) => {
            this.tiles[y] = new Array(this.tileSize.width);

            row.forEach((cell, x) => {
                this.tiles[y][x] = new Tile(scene, cell);
            });
        });

        this.setOrigin(0, 0);
        this.setInteractive();

        this.on('pointerover', () => {
            console.log(1);
        }, this);


    }

    render(): void {
        for (let y = 0; y < this.tileSize.height; y++) {
            for (let x = 0; x < this.tileSize.width; x++) {
                const tile = this.tiles[x][y];
                tile.render(x * TILE_SIZE, y * TILE_SIZE);
            }
        }
    }

    private onHover(...args) {
        console.log(args);
    }
}