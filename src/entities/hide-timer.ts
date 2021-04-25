import { GameObjects, Math, Scene, Tweens } from 'phaser';
import { HIDE_FAIL_TIME, HIDE_INITIAL_TIMEOUT, HIDE_SUCCESS_TIME } from '../config';

const WIDTH = 200;
const BAR_HEIGHT = 20;

export class HideTimer {
    scene: Scene;
    x: number;
    y: number;
    left: number;
    right: number;
    bg: GameObjects.Graphics;
    safeZone: GameObjects.Graphics;
    marker: GameObjects.Sprite;
    result: Phaser.Events.EventEmitter;
    timeLeft = HIDE_INITIAL_TIMEOUT / 2;
    tween: Tweens.Tween;

    constructor(scene: Scene) {
        this.scene = scene;

        this.x = scene.cameras.main.width / 2;
        this.y = scene.cameras.main.height - 150;
        this.left = this.x - WIDTH / 2;
        this.right = this.x + WIDTH / 2;

        this.bg = new GameObjects.Graphics(scene);
        scene.add.existing(this.bg);

        this.marker = new GameObjects.Sprite(scene, this.x, this.y, 'minotaur');
        scene.add.existing(this.marker);

        this.bg.setScrollFactor(0);
        this.marker.setScrollFactor(0);

        this.bg.fillStyle(0xcc0000);

        this.result = new Phaser.Events.EventEmitter();

        this.startTween();
    }

    addTime(): void {
        this.tween.stop();
        this.timeLeft += HIDE_SUCCESS_TIME;

        if (this.timeLeft >= HIDE_INITIAL_TIMEOUT) {
            this.result.emit('success');
        } else {
            this.startTween();
        }
    }

    removeTime(): void {
        this.tween.stop();
        this.timeLeft -= HIDE_FAIL_TIME;

        if (this.timeLeft < 0) {
            this.result.emit('fail');
        } else {
            this.startTween();
        }
    }

    startTween(): void {
        const from = this.timeLeft / HIDE_INITIAL_TIMEOUT;

        this.tween = this.scene.tweens.addCounter({
            from,
            to: 0,
            onUpdate: (tween: any, target: any) => {
                const remainingWidth = WIDTH * target.value;
                this.bg.clear();
                this.bg.fillRect(this.left, this.y, remainingWidth, BAR_HEIGHT);

                this.timeLeft = (HIDE_INITIAL_TIMEOUT * target.value);
            },
            onComplete: () => {
                this.result.emit('fail');
            },
            duration: this.timeLeft
        });
    }

    destroy(): void {
        this.bg.destroy();
        this.marker.destroy();
    }
}