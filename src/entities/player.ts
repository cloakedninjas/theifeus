import { GameObjects, Scene } from 'phaser';
import { HALF_TILE_SIZE, TILE_SIZE } from '../config';

export class Player extends GameObjects.Sprite {

    tilePosition: Phaser.Types.Math.Vector2Like;

    constructor(scene: Scene) {
        super(scene, 0, 0, 'player');

        this.tilePosition = { x: 0, y: 0 };
    }

    moveTo(newPosition: Phaser.Types.Math.Vector2Like, speed: number): Phaser.Tweens.Tween {
        const screenPos = {
            x: TILE_SIZE * newPosition.x + HALF_TILE_SIZE,
            y: TILE_SIZE * newPosition.y + HALF_TILE_SIZE
        };

        return this.scene.tweens.add({
            targets: this,
            x: screenPos.x,
            y: screenPos.y,
            ease: Phaser.Math.Easing.Sine.InOut,
            duraton: speed,
            onComplete: () => {
                this.setTilePosition(newPosition.x, newPosition.y);
            }
        });
    }

    setTilePosition(x: number, y: number): void {
        this.tilePosition.x = x;
        this.tilePosition.y = y;

        this.x = x * TILE_SIZE + HALF_TILE_SIZE;
        this.y = y * TILE_SIZE + HALF_TILE_SIZE;
    }

}