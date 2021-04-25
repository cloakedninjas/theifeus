import { GameObjects, Scene, Tweens } from 'phaser';
import { HIDE_FAIL_TIME, HIDE_INITIAL_TIMEOUT, HIDE_SUCCESS_TIME } from '../config';

const WIDTH = 200;
const BAR_HEIGHT = 20;

export class HuntedUI {
    scene: Scene;
    x: number;
    y: number;
    left: number;
    right: number;
    meter: GameObjects.Graphics;
    safeZone: GameObjects.Graphics;
    marker: GameObjects.Sprite;
    result: Phaser.Events.EventEmitter;
    timeLeft = HIDE_INITIAL_TIMEOUT / 2;
    tween: Tweens.Tween;
    bg: GameObjects.Image;

    constructor(scene: Scene) {
        this.scene = scene;

        this.x = scene.cameras.main.width / 2;
        this.y = scene.cameras.main.height - 150;
        this.left = this.x - WIDTH / 2;
        this.right = this.x + WIDTH / 2;

        this.bg = scene.add.image(0, this.scene.game.scale.height, 'hunted');
        this.bg.setScrollFactor(0);
        this.bg.setOrigin(0, 0);

        this.meter = new GameObjects.Graphics(scene);
        scene.add.existing(this.meter);

        this.marker = new GameObjects.Sprite(scene, this.x, this.y, 'monster_face');
        scene.add.existing(this.marker);

        this.meter.setScrollFactor(0);
        this.marker.setScrollFactor(0);

        this.meter.fillStyle(0xcc0000);

        this.result = new Phaser.Events.EventEmitter();

        this.scene.tweens.add({
            targets: this.bg,
            y: this.bg.y - this.bg.height,
            ease: Phaser.Math.Easing.Sine.Out,
            duration: 300
        });
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
                this.meter.clear();
                this.meter.fillRect(this.left, this.y, remainingWidth, BAR_HEIGHT);

                this.timeLeft = (HIDE_INITIAL_TIMEOUT * target.value);
            },
            onComplete: () => {
                //this.result.emit('fail');
            },
            duration: this.timeLeft
        });
    }

    destroy(): void {
        this.meter.destroy();
        this.marker.destroy();
    }
}