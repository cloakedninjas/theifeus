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
    isFollowing = false;
    attacking: Phaser.Events.EventEmitter;

    constructor(scene: Scene, map: Map) {
        super(scene, 'minotaur', map);
        this.attacking = new Phaser.Events.EventEmitter();
    }

    startFollow(path: Phaser.Types.Math.Vector2Like[]): void {
        console.log('start follow', path);
        this.path = path;
        this.isFollowing = true;
    }

    followPath(playerPos: Phaser.Types.Math.Vector2Like): void {
        console.log('Minotaur take move');
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

    stopFollow(): void {
        this.path = [];
        this.isFollowing = false;
    }
}