import { Scene } from 'phaser';

export default class Menu extends Scene {
    constructor() {
        super({
            key: 'MenuScene'
        });
    }

    create(): void {
        const bg = this.add.image(0, 0, 'main_bg');
        bg.setOrigin(0, 0);

        const hero = this.add.image(this.cameras.main.width + 160, this.cameras.main.height + 200, 'main_girl');
        const mino = this.add.image(376, 276, 'main_mino');
        mino.alpha = 0;

        const playButton = this.add.image(270, 680, 'play');
        playButton.alpha = 0;

        const title = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'title');
        title.alpha = 0;

        playButton.on('pointerover', () => {
            playButton.setFrame(1);
        });

        playButton.on('pointerout', () => {
            playButton.setFrame(0);
        });

        playButton.on('pointerup', () => {
            music.stop();
            this.scene.start('GameScene');
        });

        this.tweens.add({
            targets: hero,
            x: 704,
            y: 534,
            ease: Phaser.Math.Easing.Expo.InOut,
            duration: 1000,
            delay: 500,
            onComplete: () => {
                this.tweens.add({
                    targets: mino,
                    alpha: 1,
                    ease: Phaser.Math.Easing.Sine.InOut,
                    duration: 600,
                    delay: 10,
                    onComplete: () => {
                        this.tweens.add({
                            targets: playButton,
                            alpha: 1,
                            ease: Phaser.Math.Easing.Sine.InOut,
                            duration: 400,
                            onComplete: () => {
                                playButton.setInteractive({
                                    useHandCursor: true
                                });
                            }
                        });

                        this.tweens.add({
                            targets: title,
                            alpha: 1,
                            ease: Phaser.Math.Easing.Sine.InOut,
                            duration: 400
                        });
                    }
                });
            }
        });


        /* const graphics = this.add.graphics();

        graphics.setInteractive(new Phaser.Geom.Rectangle(84, 606, 360, 75), Phaser.Geom.Rectangle.Contains);
        graphics.on(Phaser.Input.Events.POINTER_DOWN, () => {
            document.location.reload();
        }); */

        const music = this.sound.add('menu');

        // debug
        
        music.play({
            volume: 1
        });





    }

    shutdown(): void {
        console.log(1);
    }
}
