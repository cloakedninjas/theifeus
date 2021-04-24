import { Scene } from 'phaser';
import { Map } from '../entities/map';
import { Player } from '../entities/player';

export class Game extends Scene {
  map: Map;
  player: Player;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    const map = new Map(this);
    this.map = this.add.existing(map);

    const player = new Player(this);
    player.setOrigin(0, 0);
    this.player = this.add.existing(player);
    this.player.setTilePosition(0, 0);
  }
}
