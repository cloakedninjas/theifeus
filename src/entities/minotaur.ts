import { Scene } from 'phaser';
import { Creature } from './creature'

export class Minotaur extends Creature {

    tilePosition: Phaser.Types.Math.Vector2Like = {
        x: 0,
        y: 0
    };

    constructor(scene: Scene) {
        super(scene, 'minotaur');
    }
}