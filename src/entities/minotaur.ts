import { Scene } from 'phaser';
import { MINOTAUR_MOVE_TIME } from '../config';
import { Creature } from './creature'
import { Map } from './map';

export class Minotaur extends Creature {
    tilePosition: Phaser.Types.Math.Vector2Like = {
        x: 0,
        y: 0
    };
    path: Phaser.Types.Math.Vector2Like[];
    attacking: Phaser.Events.EventEmitter;

    constructor(scene: Scene, map: Map) {
        super(scene, 'minotaur', map);
        this.attacking = new Phaser.Events.EventEmitter();
    }

    setPath(path: Phaser.Types.Math.Vector2Like[]): void {
        this.path = path;
    }

    followPath(playerPos: Phaser.Types.Math.Vector2Like): void {
        const nextPosition = this.path.shift();

        if (this.tilePosition.x === playerPos.x && this.tilePosition.y === playerPos.y) {
            console.log('Chomp');
            this.attacking.emit('attacking');
        }
        else {
            if (this.map.objectsAreAdjacent(playerPos, nextPosition)) {
                console.log('ADJ');
                this.path = [playerPos];
            } else {
                console.log('adding to path');
                this.path.push(playerPos);
            }

            this.moveTo(nextPosition, MINOTAUR_MOVE_TIME);
        }
    }
}