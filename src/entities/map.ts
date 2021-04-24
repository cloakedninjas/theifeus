import { GameObjects, Scene } from 'phaser';
import { Tile, TILE_SIZE } from './tile';

export class Map extends GameObjects.Sprite {
    grid: Tile[][];
    width: number;
    height: number;

    constructor(scene: Scene) {
        super(scene, 0, 0, null);

        const grid = this.scene.cache.json.get('map');

        this.width = grid.length;
        this.height = grid[0].length;

        this.grid = new Array(this.height);

        grid.forEach((row, y) => {
            this.grid[y] = new Array(this.width);

            row.forEach((cell, x) => {
                this.grid[y][x] = new Tile(scene, cell);
            });
        });

        this.render();
    }

    render(): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.grid[x][y];
                tile.render(x * TILE_SIZE, y * TILE_SIZE);
            }
        }
    }
}