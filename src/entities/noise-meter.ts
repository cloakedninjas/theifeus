import { GameObjects, Math, Scene, Tweens } from 'phaser';
import { NOISE_MARKER_SPEED, NOISE_MOVE_LOUD, NOISE_MOVE_QUIET, NOISE_SPAWN_MINOTAUR } from '../config';

const WIDTH = 300;
const HEIGHT = 35;
const PADDLE_WIDTH = 10;

export class NoiseMeter {
    scene: Scene;
    bg: GameObjects.Graphics;
    safeZone: GameObjects.Graphics;
    paddle: GameObjects.Image;
    tween: Tweens.Tween;
    x: number;
    y: number;
    left: number;
    right: number;
    safeArea = {
        min: 0,
        max: 0
    };
    noiseLevel = 0;
    noiseThreshold: Phaser.Events.EventEmitter;
    thresholdReached = false;
    canEmit = true;

    constructor(scene: Scene) {
        this.scene = scene;

        this.x = scene.cameras.main.width / 2;
        this.y = 629;
        this.left = this.x - WIDTH / 2;
        this.right = this.x + WIDTH / 2;

        this.bg = new GameObjects.Graphics(scene);
        scene.add.existing(this.bg);

        this.paddle = new GameObjects.Image(scene, this.left, this.y, 'marker');
        this.paddle.setOrigin(0.5, 0);
        scene.add.existing(this.paddle);

        this.bg.setScrollFactor(0);
        this.paddle.setScrollFactor(0);

        this.noiseThreshold = new Phaser.Events.EventEmitter();

        this.start();
    }

    start(): void {
        //bg
        this.bg.fillStyle(0xcc0000);
        this.bg.fillRect(this.left, this.y, WIDTH, HEIGHT);

        // safe zone
        const safeWidth = 50;
        this.safeArea.min = Phaser.Math.Between(this.left, this.right - safeWidth);
        this.safeArea.max = this.safeArea.min + safeWidth;

        this.bg.fillStyle(0x00cc00);
        this.bg.fillRect(this.safeArea.min, this.y, safeWidth, HEIGHT);

        this.tween = this.scene.tweens.add({
            targets: this.paddle,
            x: this.right,
            ease: Math.Easing.Linear,
            yoyo: true,
            repeat: -1,
            duration: NOISE_MARKER_SPEED
        });

        this.show();
    }

    getNoiseReading(): boolean {
        const x = this.paddle.x + this.left;
        const isQuiet = x > this.safeArea.min && x < this.safeArea.max - PADDLE_WIDTH;

        if (isQuiet) {
            this.noiseLevel -= NOISE_MOVE_QUIET;
        } else {
            this.noiseLevel += NOISE_MOVE_LOUD;
        }

        if (this.canEmit) {
            if (this.noiseLevel >= NOISE_SPAWN_MINOTAUR) {
                this.noiseThreshold.emit('noise-high');
                this.thresholdReached = true;
            } else if (this.thresholdReached && this.noiseLevel < NOISE_SPAWN_MINOTAUR) {
                this.noiseThreshold.emit('noise-low');
                this.thresholdReached = false;
            }
        }

        return isQuiet;
    }

    stop(): boolean {
        this.tween.stop();
        const x = this.paddle.x + this.left;

        return x > this.safeArea.min && x < this.safeArea.max - PADDLE_WIDTH;
    }

    hide(): void {
        this.bg.visible = false;
        this.paddle.visible = false;
    }

    show(): void {
        this.bg.visible = true;
        this.paddle.visible = true;
    }

    disableThresholds(): void {
        this.canEmit = false;
    }

    enableThresholds(): void {
        this.canEmit = true;
    }

    reset(): void {
        this.canEmit = true;
        this.thresholdReached = false;
        this.noiseLevel = 0;
    }
}