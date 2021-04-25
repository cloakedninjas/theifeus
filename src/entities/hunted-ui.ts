import { GameObjects, Scene, Tweens } from 'phaser';
import { HIDE_FAIL_TIME, HIDE_INITIAL_TIMEOUT, HIDE_SUCCESS_TIME } from '../config';
import { NoiseMeter } from './noise-meter';

const WIDTH = 315;
const BAR_HEIGHT = 15;

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
    aura: GameObjects.Image;
    auraTween: Tweens.Tween;
    button: GameObjects.Image;
    noiseMeter: NoiseMeter;

    constructor(scene: Scene, noiseMeter: NoiseMeter) {
        this.scene = scene;
        this.noiseMeter = noiseMeter;

        this.x = scene.cameras.main.width / 2;
        this.y = 570;
        this.left = this.x - WIDTH / 2;
        this.right = this.x + WIDTH / 2;

        this.aura = scene.add.image(0, this.scene.game.scale.height, 'red_mist');
        this.aura.setScrollFactor(0);
        this.aura.setOrigin(0, 1);
        this.aura.alpha = 0;

        this.bg = scene.add.image(0, this.scene.game.scale.height, 'hunted');
        this.bg.setScrollFactor(0);
        this.bg.setOrigin(0, 0);

        this.meter = new GameObjects.Graphics(scene);
        scene.add.existing(this.meter);
        this.meter.setScrollFactor(0);
        this.meter.fillStyle(0xcc0000);
        this.meter.visible = false;

        this.marker = new GameObjects.Sprite(scene, this.x, this.y, 'monster_face');
        scene.add.existing(this.marker);
        this.marker.setScrollFactor(0);
        this.marker.visible = false;

        this.button = scene.add.image(this.x, 710, 'hide');
        this.button.setScrollFactor(0);
        this.button.visible = false;
        this.button.setInteractive({
            useHandCursor: true
        });

        this.button.on('pointerover', () => {
            this.button.setFrame(1);
        });

        this.button.on('pointerout', () => {
            this.button.setFrame(0);
        });

        this.button.on('pointerup', () => {
            const isQuiet = this.noiseMeter.getNoiseReading();

            if (isQuiet) {
                this.addTime();
            } else {
                this.removeTime();
            }
        });

        this.result = new Phaser.Events.EventEmitter();

        this.scene.tweens.add({
            targets: this.bg,
            y: this.bg.y - this.bg.height,
            ease: Phaser.Math.Easing.Sine.Out,
            duration: 300,
            onComplete: () => {
                this.startCountdown();
            }
        });
    }

    addTime(): void {
        this.tween.stop();
        this.timeLeft += HIDE_SUCCESS_TIME;

        if (this.timeLeft >= HIDE_INITIAL_TIMEOUT) {
            this.result.emit('success');
        } else {
            this.startCountdown();
        }
    }

    removeTime(): void {
        this.tween.stop();
        this.timeLeft -= HIDE_FAIL_TIME;

        if (this.timeLeft < 0) {
            this.result.emit('fail');
        } else {
            this.startCountdown();
        }
    }

    startCountdown(): void {
        this.meter.visible = true;
        this.marker.visible = true;
        this.button.visible = true;

        if (!this.auraTween) {
            this.auraTween = this.scene.tweens.add({
                targets: this.aura,
                alpha: 1,
                ease: Phaser.Math.Easing.Sine.InOut,
                onComplete: () => {
                    this.auraTween = this.scene.tweens.add({
                        targets: this.aura,
                        alpha: 0.7,
                        ease: Phaser.Math.Easing.Sine.InOut,
                        yoyo: true,
                        repeat: -1,
                        duration: 1000
                    });
                },
                duration: 1000
            });
        }

        const from = this.timeLeft / HIDE_INITIAL_TIMEOUT;

        this.tween = this.scene.tweens.addCounter({
            from,
            to: 0,
            onUpdate: (tween: any, target: any) => {
                const remainingWidth = WIDTH * target.value;
                this.meter.clear();
                this.meter.fillRect(this.left, this.y, remainingWidth, BAR_HEIGHT);

                this.marker.x = this.left + remainingWidth;

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
        this.meter.destroy();
        this.marker.destroy();
        this.button.destroy();
        this.aura.destroy();
    }
}