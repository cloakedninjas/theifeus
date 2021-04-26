import { Scene } from 'phaser';
import { Treasure } from '../lib/types';
import { FONT_NAME } from '../config';

const FONT_COLOUR = 'white';
const FONT_SIZE = '24px';
const X_POS = 200;

export default class Score extends Scene {
    treasures: Treasure[];
    alive: boolean;
    gotHeart: boolean;

    constructor() {
        super({
            key: 'ScoreScene'
        });
    }

    preload(): void {
        //
    }

    init(data: any) {
        window['scene'] = this;
        this.treasures = data.treasures;
        this.alive = data.alive;
        this.gotHeart = Boolean(this.treasures.find(treasure => treasure.heart));
    }

    create(): void {
        console.log(this.alive, this.treasures);

        let loot = 0;

        this.treasures.forEach(treasure => {
            loot += treasure.value;
        });

        // debug
        loot = 4500;

        const totalScore = loot * 2;

        const labelFontSize = '30px';
        const labelX = X_POS + 100;
        const valueX = X_POS + 120;
        const labelYStart = 250;
        const labelYyGap = 65;

        // labels

        let text = this.add.text(labelX, labelYStart, 'Loot Value:', {
            fontFamily: FONT_NAME,
            fontSize: labelFontSize,
            color: FONT_COLOUR,
            align: 'right'
        });
        text.setOrigin(1, 0.5);

        text = this.add.text(labelX, labelYStart + labelYyGap, 'Heart of the Minotaur:', {
            fontFamily: FONT_NAME,
            fontSize: labelFontSize,
            color: FONT_COLOUR,
            align: 'right'
        });
        text.setOrigin(1, 0.5);

        // values

        text = this.add.text(valueX, labelYStart, loot.toString(), {
            fontFamily: FONT_NAME,
            fontSize: labelFontSize,
            color: FONT_COLOUR,
            align: 'left'
        });
        text.setOrigin(0, 0.5);

        text = this.add.text(valueX, labelYStart + labelYyGap, this.gotHeart ? 'Claimed!' : 'Unclaimed', {
            fontFamily: FONT_NAME,
            fontSize: labelFontSize,
            color: FONT_COLOUR,
            align: 'left'
        });
        text.setOrigin(0, 0.5);

        // total score

        this.add.text(X_POS, 500, totalScore.toString(), {
            fontFamily: FONT_NAME,
            fontSize: '72px',
            color: FONT_COLOUR,
            align: 'center'
        });

        // play again btn

        const graphics = this.add.graphics();

        // debug
        graphics.fillStyle(0xffffff);
        graphics.fillRect(531, 275, 66, 70);


        graphics.setInteractive(new Phaser.Geom.Rectangle(531, 275, 66, 70), Phaser.Geom.Rectangle.Contains);
        graphics.on(Phaser.Input.Events.POINTER_DOWN, () => {
            document.location.reload();
        });
    }
}
