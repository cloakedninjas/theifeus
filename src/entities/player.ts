import { Scene } from 'phaser';
import { Creature } from './creature'
import { Map } from './map';

export class Player extends Creature {

    tilePosition: Phaser.Types.Math.Vector2Like = {
        x: 0,
        y: 0
    };

    constructor(scene: Scene, map: Map) {
        super(scene, 'player', map);
    }
}