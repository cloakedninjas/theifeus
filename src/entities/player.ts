import { GameObjects, Scene } from 'phaser';
import { HALF_TILE_SIZE, TILE_SIZE } from '../config';

export class Player extends GameObjects.Sprite {

    tilePosition: Phaser.Types.Math.Vector2Like = {
        x: 0,
        y: 0
    };

    constructor(scene: Scene) {
        super(scene, 0, 0, 'player');
    }

    moveTo(newPosition: Phaser.Types.Math.Vector2Like, speed: number): Phaser.Tweens.Tween {
        const screenPos = this.getPlayerPositionAtTile(newPosition);

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

        const screenPos = this.getPlayerPositionAtTile(this.tilePosition);

        this.x = screenPos.x;
        this.y = screenPos.y;
    }

    getPlayerPositionAtTile(position: Phaser.Types.Math.Vector2Like): Phaser.Types.Math.Vector2Like {
        return {
            x: TILE_SIZE * position.x + HALF_TILE_SIZE,
            y: TILE_SIZE * position.y + HALF_TILE_SIZE
        };
    }

}