import { Scene } from 'phaser';
import { MOVE_TIME_LOUD, MOVE_TIME_QUIET, PROB_FIND_TREASURE } from '../config';
import { Map } from '../entities/map';
import { Player } from '../entities/player';
import { MoveMinigame } from '../entities/move-minigame';

export class Game extends Scene {
  private map: Map;
  private player: Player;
  private moveMinigame: MoveMinigame;
  private requestedMoveLocation: Phaser.Types.Math.Vector2Like;
  private treasureCollected = 0;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    this.map = new Map(this);

    const player = new Player(this);
    this.player = this.add.existing(player);
    this.player.setTilePosition(17, 19);
    this.map.playerEnterredTile(this.player.tilePosition);

    this.setupCameraControls();
    this.setupKeyboardControls();

    this.moveMinigame = new MoveMinigame(this);

    // debug
    window['scene'] = this;
  }

  private setupCameraControls(): void {
    this.cameras.main.setBounds(0, 0, this.map.tilemap.widthInPixels, this.map.tilemap.heightInPixels);
    this.cameras.main.startFollow(this.player);
  }

  private setupKeyboardControls() {
    const cursors = this.input.keyboard.createCursorKeys();

    cursors.down.on('up', () => this.tryMovingPlayer(0, 1));
    cursors.up.on('up', () => this.tryMovingPlayer(0, -1));
    cursors.left.on('up', () => this.tryMovingPlayer(-1, 0));
    cursors.right.on('up', () => this.tryMovingPlayer(1, 0));
    cursors.space.on('up', () => this.performAction());

    this.input.on('pointerup', () => {
      this.searchRoom();
    });
  }

  private tryMovingPlayer(vectorX: number, vectorY: number): void {
    const destinationPosition: Phaser.Types.Math.Vector2Like = {
      x: this.player.tilePosition.x + vectorX,
      y: this.player.tilePosition.y + vectorY
    };

    if (this.map.isMoveValid(this.player.tilePosition, destinationPosition)) {
      this.requestedMoveLocation = destinationPosition;
      this.moveMinigame.start();
    } else {
      console.log('not valid move');
    }
  }

  private performAction(): void {
    if (this.moveMinigame.bg.visible && this.moveMinigame.tween.isPlaying) {
      const quietMove = this.moveMinigame.stop();

      //console.log(quietMove ? 'Quietly' : 'Loudly');

      this.player.moveTo(this.requestedMoveLocation, quietMove ? MOVE_TIME_QUIET : MOVE_TIME_LOUD)
        .on('complete', () => this.map.playerEnterredTile(this.requestedMoveLocation));
    }
  }

  private searchRoom(): void {
    const currentTile = this.map.getTileAt(this.player.tilePosition);

    if (currentTile.properties.searched) {
      console.log('already searched');
    } else {
      if (Math.random() >= PROB_FIND_TREASURE) {
        //this.treasureCollected += TREASURES
      }
    }

    currentTile.properties.searched = true;
  }
}
