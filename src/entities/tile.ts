import { Scene } from 'phaser';

export const TILE_SIZE = 64;

export class Tile {
    walls: number[];
    searched: boolean;
    isTreasureRoom: boolean;
    scene: Scene;

    constructor(scene: Scene, walls: number[]) {
        this.scene = scene;
        this.walls = walls;
    }

    render(x: number, y: number): void {
        const graphics = this.scene.add.graphics();

        graphics.lineStyle(1, 0x00ff00);

        if (this.walls[0]) {
            graphics.lineBetween(x, y, x + TILE_SIZE, y);
        }

        if (this.walls[1]) {
            graphics.lineBetween(x + TILE_SIZE, y, x + TILE_SIZE, y + TILE_SIZE);
        }

        if (this.walls[2]) {
            graphics.lineBetween(x + TILE_SIZE, y + TILE_SIZE, x, y + TILE_SIZE);
        }

        if (this.walls[3]) {
            graphics.lineBetween(x, y + TILE_SIZE, x, y);
        }
    }
}