import { GameObjects, Scene, Tweens } from 'phaser';
import { NOISE_MARKER_SPEED_INITIAL, NOISE_MARKER_SPEED_MIN, NOISE_MARKER_SPEED_REDUCE, NOISE_MOVE_LOUD, NOISE_MOVE_QUIET, NOISE_SAFE_WIDTH_INITIAL, NOISE_SAFE_WIDTH_MIN, NOISE_SAFE_WIDTH_REDUCE, NOISE_SPAWN_MINOTAUR } from '../config';

const WIDTH = 300;
const HEIGHT = 35;

export class NoiseMeter {
    scene: Scene;
    bg: GameObjects.Graphics;
    safeZone: GameObjects.Graphics;
    marker: GameObjects.Image;
    badgeLoud: GameObjects.Image;
    badgeQuiet: GameObjects.Image;
    tween: Tweens.Tween;
    x: number;
    y: number;
    left: number;
    right: number;
    safeArea = {
        min: 0,
        max: 0
    };
    safeWidth: number = NOISE_SAFE_WIDTH_INITIAL;
    noiseLevel = 0;
    markerSpeed = NOISE_MARKER_SPEED_INITIAL;
    noiseThreshold: Phaser.Events.EventEmitter;
    thresholdReached = false;
    canEmit = true;
    badgeTween: Tweens.Tween;

    constructor(scene: Scene) {
        this.scene = scene;

        this.x = scene.cameras.main.width / 2;
        this.y = 629;
        this.left = this.x - WIDTH / 2;
        this.right = this.x + WIDTH / 2;

        this.bg = new GameObjects.Graphics(scene);
        scene.add.existing(this.bg);

        this.marker = scene.add.image(this.left, this.y, 'marker');
        this.marker.setOrigin(0.5, 0);

        this.bg.setScrollFactor(0);
        this.marker.setScrollFactor(0);

        this.badgeLoud = scene.add.image(568, 721, 'loud');
        this.badgeLoud.setScrollFactor(0);
        this.badgeLoud.alpha = 0;
        this.badgeQuiet = scene.add.image(456, 721, 'silent');
        this.badgeQuiet.setScrollFactor(0);
        this.badgeQuiet.alpha = 0;

        this.noiseThreshold = new Phaser.Events.EventEmitter();

        this.start();
    }

    bringToTop(): void {
        this.scene.children.bringToTop(this.marker);
        this.scene.children.bringToTop(this.badgeQuiet);
        this.scene.children.bringToTop(this.badgeLoud);
    }

    start(): void {
        // safe zone
        this.generateSafeZone();
        this.startMarker();
        this.show();
    }

    startMarker(): void {
        if (this.tween) {
            this.tween.stop();
        }

        this.marker.x = this.left;
        this.tween = this.scene.tweens.add({
            targets: this.marker,
            x: this.right,
            ease: Phaser.Math.Easing.Linear,
            yoyo: true,
            repeat: -1,
            duration: this.markerSpeed
        });
    }

    getNoiseReading(): boolean {
        const isQuiet = this.marker.x > this.safeArea.min && this.marker.x < this.safeArea.max;
        let badge: GameObjects.Image;

        if (isQuiet) {
            this.noiseLevel -= NOISE_MOVE_QUIET;
            this.noiseLevel = Math.max(0, this.noiseLevel);
            badge = this.badgeQuiet;
            this.generateSafeZone();
        } else {
            this.noiseLevel += NOISE_MOVE_LOUD;
            badge = this.badgeLoud;
        }

        if (this.badgeTween) {
            this.badgeTween.stop(1);
        }

        this.badgeTween = this.scene.tweens.add({
            targets: badge,
            alpha: 1,
            duration: 200,
            onComplete: () => {
                this.badgeTween.stop(1);
                this.badgeTween = this.scene.tweens.add({
                    targets: badge,
                    alpha: 0,
                    duration: 800
                });
            }
        });

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
        const x = this.marker.x + this.left;

        return x > this.safeArea.min && x < this.safeArea.max - this.marker.width;
    }

    hide(): void {
        this.bg.visible = false;
        this.marker.visible = false;
    }

    show(): void {
        this.bg.visible = true;
        this.marker.visible = true;
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

    generateSafeZone(): void {
        this.safeArea.min = Phaser.Math.Between(this.left, this.right - this.safeWidth);
        this.safeArea.max = this.safeArea.min + this.safeWidth;

        this.bg.clear();

        //bg
        this.bg.fillStyle(0xC2B59B);
        this.bg.fillRect(this.left, this.y, WIDTH, HEIGHT);

        this.bg.fillStyle(0x00A651);
        this.bg.fillRect(this.safeArea.min, this.y, this.safeWidth, HEIGHT);
    }

    makeItHarder(): void {
        if (this.markerSpeed > NOISE_MARKER_SPEED_MIN) {
            this.markerSpeed -= NOISE_MARKER_SPEED_REDUCE;

            this.startMarker();
        }

        if (this.safeWidth >= NOISE_SAFE_WIDTH_MIN) {
            this.safeWidth -= NOISE_SAFE_WIDTH_REDUCE;
        }

        this.generateSafeZone();
    }
}