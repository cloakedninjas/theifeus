import { GameObjects, Scene } from 'phaser';
import { TILE_SIZE } from './tile';

export class Player extends GameObjects.Sprite {

    position: Phaser.Types.Math.Vector2Like;

    constructor(scene: Scene) {
        super(scene, 0, 0, 'player');

        this.position = { x: 0, y: 0 };
    }

    setTilePosition(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;

        this.x = x * TILE_SIZE + (this.width / 2);
        this.y = y * TILE_SIZE + (this.height / 2);
    }


}