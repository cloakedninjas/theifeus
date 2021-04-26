import { GameObjects, Scene, Tweens } from 'phaser';
import { HUNTED_DELAY, HUNTED_FAIL_PENALTY, HUNTED_FIRST_DELAY, HUNTED_INITIAL_TIMEOUT, HUNTED_SUCCESS_TIME } from '../config';
import { INTERACTIVE } from '../lib/types';
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
    marker: GameObjects.Sprite;
    result: Phaser.Events.EventEmitter;
    timeLeft = HUNTED_INITIAL_TIMEOUT / 2;
    tween: Tweens.Tween;
    bg: GameObjects.Image;
    aura: GameObjects.Image;
    auraTween: Tweens.Tween;
    button: GameObjects.Image;
    noiseMeter: NoiseMeter;
    firstTime: boolean;

    constructor(scene: Scene, noiseMeter: NoiseMeter, firstTime: boolean) {
        this.scene = scene;
        this.noiseMeter = noiseMeter;
        this.firstTime = firstTime;

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
        this.meter.fillStyle(0xED2224);
        this.meter.fillRect(this.left, this.y, WIDTH * 0.5, BAR_HEIGHT);
        this.meter.visible = false;

        this.marker = new GameObjects.Sprite(scene, this.x, this.y, 'monster_face');
        scene.add.existing(this.marker);
        this.marker.setScrollFactor(0);
        this.marker.visible = false;

        this.button = scene.add.image(this.x, 710, 'hide');
        this.button.setScrollFactor(0);
        this.button.visible = false;
        this.button.setInteractive(INTERACTIVE);

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
                this.startCountdown(this.firstTime ? HUNTED_FIRST_DELAY : HUNTED_DELAY);
            }
        });
    }

    addTime(): void {
        this.tween.stop();
        this.timeLeft += HUNTED_SUCCESS_TIME;

        if (this.timeLeft >= HUNTED_INITIAL_TIMEOUT) {
            this.result.emit('success');
        } else {
            this.startCountdown(0);
        }
    }

    removeTime(): void {
        this.tween.stop();
        this.timeLeft -= HUNTED_FAIL_PENALTY;

        if (this.timeLeft < 0) {
            this.result.emit('fail');
        } else {
            this.startCountdown(0);
        }
    }

    startCountdown(delay: number): void {
        this.meter.visible = true;
        this.marker.visible = true;
        this.button.visible = true;

        const from = this.timeLeft / HUNTED_INITIAL_TIMEOUT;

        this.tween = this.scene.tweens.addCounter({
            from,
            to: 0,
            onUpdate: (_tween, target: any) => {
                const remainingWidth = WIDTH * target.value;
                this.meter.clear();
                this.meter.fillStyle(0xED2224);
                this.meter.fillRect(this.left, this.y, remainingWidth, BAR_HEIGHT);

                this.marker.x = this.left + remainingWidth;

                this.timeLeft = (HUNTED_INITIAL_TIMEOUT * target.value);
            },
            onComplete: () => {
                this.result.emit('fail');
            },
            duration: this.timeLeft,
            delay
        });

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
    }

    destroy(): void {
        this.bg.destroy();
        this.meter.destroy();
        this.marker.destroy();
        this.button.destroy();
        this.aura.destroy();
    }
}