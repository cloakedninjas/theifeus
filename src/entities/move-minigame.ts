import { GameObjects, Math, Scene, Tweens } from 'phaser';
import { MOVE_TIME_LOUD, MOVE_TIME_QUIET } from '../config';

const WIDTH = 200;
const PADDLE_WIDTH = 10;

export class MoveMinigame {
    scene: Scene;
    bg: GameObjects.Graphics;
    safeZone: GameObjects.Graphics;
    paddle: GameObjects.Graphics;
    tween: Tweens.Tween;
    x: number;
    y: number;
    left: number;
    right: number;
    safeArea = {
        min: 0,
        max: 0
    };

    constructor(scene: Scene) {
        this.scene = scene;

        this.x = scene.cameras.main.width / 2;
        this.y = scene.cameras.main.height - 100;
        this.left = this.x - WIDTH / 2;
        this.right = this.x + WIDTH / 2;

        this.bg = new GameObjects.Graphics(scene);
        scene.add.existing(this.bg);

        this.paddle = new GameObjects.Graphics(scene);
        scene.add.existing(this.paddle);

        this.paddle.fillStyle(0x223300);
        this.paddle.fillRect(this.left, this.y, PADDLE_WIDTH, 50);

        this.bg.setScrollFactor(0);
        this.paddle.setScrollFactor(0);

        this.start();
    }

    start(): void {
        //bg
        this.bg.fillStyle(0xcc0000);
        this.bg.fillRect(this.left, this.y, WIDTH, 50);

        // safe zone
        const safeWidth = 50;
        this.safeArea.min = Phaser.Math.Between(this.left, this.right - safeWidth);
        this.safeArea.max = this.safeArea.min + safeWidth;

        this.bg.fillStyle(0x00cc00);
        this.bg.fillRect(this.safeArea.min, this.y, safeWidth, 50);

        this.tween = this.scene.tweens.add({
            targets: this.paddle,
            x: WIDTH - PADDLE_WIDTH,
            ease: Math.Easing.Linear,
            yoyo: true,
            repeat: -1,
            duration: 1000
        });

        this.show();
    }

    getNoiseLevel(): number {
        const x = this.paddle.x + this.left;
        const level = x > this.safeArea.min && x < this.safeArea.max - PADDLE_WIDTH;

        return level ? MOVE_TIME_QUIET : MOVE_TIME_LOUD
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
}