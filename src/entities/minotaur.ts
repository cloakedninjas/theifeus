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
        super(scene, 'monster', map);
        this.attacking = new Phaser.Events.EventEmitter();
    }

    startFollow(path: Phaser.Types.Math.Vector2Like[]): void {
        this.path = path;
        this.isFollowing = true;
    }

    followPath(playerPos: Phaser.Types.Math.Vector2Like): void {
        const nextPosition = this.path.shift();

        if (this.tilePosition.x === playerPos.x && this.tilePosition.y === playerPos.y) {
            console.log('Chomp 1');
            this.attacking.emit('attacking');
            return;
        }

        if (nextPosition.x === playerPos.x && nextPosition.y === playerPos.y) {
            // minotaur moves onto player current space
            console.log('Chomp 2');
            this.moveTo(nextPosition, MINOTAUR_MOVE_TIME);
            this.attacking.emit('attacking');
            return;
        }

        if (this.tilePosition.x === playerPos.x && this.tilePosition.y === playerPos.y) {
            console.log('ADJ 2');
            this.path = [playerPos];
        } else if (this.map.objectsAreAdjacent(playerPos, nextPosition)) {
            console.log('ADJ 3');
            this.path = [playerPos];
        } else {
            this.path.push(playerPos);
        }

        this.moveTo(nextPosition, MINOTAUR_MOVE_TIME);

    }

    stopFollow(): void {
        this.path = [];
        this.isFollowing = false;
    }
}