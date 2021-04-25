import { Scene } from 'phaser';
import { CELL_PER_TILE, MEMORY_FORGOT, MOVE_TIME_LOUD, MOVE_TIME_QUIET, PROB_FIND_TREASURE } from '../config';
import { Map } from '../entities/map';
import { Minotaur } from '../entities/minotaur';
import { Player } from '../entities/player';
import { NoiseMeter } from '../entities/noise-meter';

export class Game extends Scene {
  private map: Map;
  private player: Player;
  private minotaur: Minotaur;
  private noiseMeter: NoiseMeter;
  private requestedMoveLocation: Phaser.Types.Math.Vector2Like;
  private playerTileHistory: Phaser.Types.Math.Vector2Like[] = [];
  private playerMemory: Phaser.Types.Math.Vector2Like[] = [];
  private treasureCollected = 0;
  playerMoveTween: Phaser.Tweens.Tween;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    this.map = new Map(this);

    const player = new Player(this);
    this.player = this.add.existing(player);
    this.player.setTilePosition(52, 58);
    this.playerMoved(this.player.tilePosition);

    this.setupCameraControls();
    this.setupKeyboardControls();

    this.noiseMeter = new NoiseMeter(this);
    this.noiseMeter.minotaurAlerted.on('minotaur-alerted', this.summonMinotaur, this);

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
    //cursors.space.on('up', () => this.performAction());

    this.input.on('pointerup', () => {
      this.searchRoom();
    });
  }

  private tryMovingPlayer(vectorX: number, vectorY: number): void {
    if (this.playerMoveTween?.isPlaying()) {
      return;
    }

    const destinationPosition: Phaser.Types.Math.Vector2Like = {
      x: this.player.tilePosition.x + vectorX,
      y: this.player.tilePosition.y + vectorY
    };

    if (this.map.isMoveValid(this.player.tilePosition, destinationPosition)) {
      this.requestedMoveLocation = {
        x: this.player.tilePosition.x + (vectorX * CELL_PER_TILE),
        y: this.player.tilePosition.y + (vectorY * CELL_PER_TILE)
      };

      const isQuiet = this.noiseMeter.makeNoise();
      const noiseLevel = isQuiet ? MOVE_TIME_QUIET : MOVE_TIME_LOUD;

      this.playerMoveTween = this.player.moveTo(this.requestedMoveLocation, noiseLevel)
        .on('complete', () => this.playerMoved(this.requestedMoveLocation));
    }
  }

  private playerMoved(pos: Phaser.Types.Math.Vector2Like): void {
    this.map.playerEnterredTile(pos);

    this.playerTileHistory.push({
      ...pos
    });

    // only keep 20 tiles in history
    if (this.playerTileHistory.length > 20) {
      this.playerTileHistory.shift();
    }

    // refresh memory
    this.playerMemory.forEach((memory, i) => {
      if (memory.x === pos.x && memory.y === pos.y) {
        this.playerMemory.splice(i, 1);
      }
    });

    this.playerMemory.push({
      ...pos
    });

    if (this.playerMemory.length > MEMORY_FORGOT) {
      const tileForgotten = this.playerMemory.shift();
      this.map.fadeFromMemory(tileForgotten, true);
    }
  }

  private performAction(): void {
    if (this.noiseMeter.bg.visible && this.noiseMeter.tween.isPlaying) {
      const quietMove = this.noiseMeter.stop();

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

  private summonMinotaur(): void {
    if (!this.minotaur) {
      // try to spawn minotaur someplace in history, not currently in memory

      for (let i = this.playerTileHistory.length - 1; i >= 0; i--) {
        const tileHistory = this.playerTileHistory[i];
        let tileVisisble = false;

        for (let j = 0; j < this.playerMemory.length; j++) {
          const playerMemory = this.playerMemory[j];

          if (playerMemory.x === tileHistory.x && playerMemory.y === tileHistory.y) {
            tileVisisble = true;
            break;
          }
        }

        if (!tileVisisble) {
          console.error('I HEAR YOU!');
          const minotaur = new Minotaur(this);
          this.minotaur = this.add.existing(minotaur);
          this.minotaur.setTilePosition(this.playerTileHistory[1].x, this.playerTileHistory[1].y);
          break;
        }
      }
    }
  }
}
