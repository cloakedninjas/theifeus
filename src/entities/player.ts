import { GameObjects, Scene } from 'phaser';
import { MOVE_TIME_LOUD, MOVE_TIME_QUIET, TILE_SIZE } from '../config';

export class Player extends GameObjects.Sprite {

    tilePosition: Phaser.Types.Math.Vector2Like;

    constructor(scene: Scene) {
        super(scene, 0, 0, 'player');

        this.tilePosition = { x: 0, y: 0 };
    }

    moveTo(x: number, y: number): void {
        let newX = this.x
        let newY = this.y;

        if (x) {
            newX += (TILE_SIZE * x);
        }

        if (y) {
            newY += (TILE_SIZE * y);
        }

        this.scene.tweens.add({
            targets: this,
            x: newX,
            y: newY,
            ease: Phaser.Math.Easing.Sine.InOut,
            duraton: MOVE_TIME_LOUD,
            onComplete: () => {
                const newX = this.tilePosition.x + x || 0;
                const newY = this.tilePosition.y + y || 0;
                this.setTilePosition(newX, newY);
            }
        });
    }

    setTilePosition(x: number, y: number): void {
        this.tilePosition.x = x;
        this.tilePosition.y = y;

        this.x = x * TILE_SIZE + (TILE_SIZE / 2);
        this.y = y * TILE_SIZE + (TILE_SIZE / 2);
    }

}