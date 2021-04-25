import { Scene } from 'phaser';
import { CELL_PER_TILE, CELL_WALKABLE, MEMORY_FORGOT, MOVE_TIME_LOUD, MOVE_TIME_QUIET } from '../config';
import { Map } from '../entities/map';
import { Minotaur } from '../entities/minotaur';
import { Player } from '../entities/player';
import { NoiseMeter } from '../entities/noise-meter';
import { HuntedUI } from '../entities/hunted-ui';

const ARROW_FRAME_ACTIVE = 0;
const ARROW_FRAME_HOVER = 1;
const ARROW_FRAME_DISABLED = 2;
const SEARCH_BUTTON_Y = 664;
const SEARCH_BUTTON_Y_OFFSCREEN = 900;

export class Game extends Scene {
  private map: Map;
  private player: Player;
  private minotaur: Minotaur;
  private noiseMeter: NoiseMeter;
  private requestedMoveLocation: Phaser.Types.Math.Vector2Like;
  private playerTileHistory: Phaser.Types.Math.Vector2Like[] = [];
  private playerMemory: Phaser.Types.Math.Vector2Like[] = [];
  private treasures: Treasure[] = [];
  private treasureCollected: Treasure[] = [];
  playerMoveTween: Phaser.Tweens.Tween;
  canMove = true;
  huntedUI: HuntedUI;
  ui: Phaser.GameObjects.Image;
  arrows: { n: Phaser.GameObjects.Sprite; e: Phaser.GameObjects.Sprite; s: Phaser.GameObjects.Sprite; w: Phaser.GameObjects.Sprite; };
  searchButton: Phaser.GameObjects.Image;
  searchButtonTween: Phaser.Tweens.Tween;
  bg: Phaser.GameObjects.TileSprite;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    this.bg = this.add.tileSprite(0, 0, 1000, this.game.scale.height, 'background_pattern');
    this.bg.setScrollFactor(0);
    this.bg.setOrigin(0, 0);

    this.map = new Map(this);

    this.treasures = this.cache.json.get('treasures');
    const diamond = this.treasures.pop();
    Phaser.Utils.Array.Shuffle(this.treasures);
    this.treasures.push(diamond);

    const player = new Player(this, this.map);
    this.player = this.add.existing(player);

    this.noiseMeter = new NoiseMeter(this);
    this.noiseMeter.noiseThreshold.on('noise-high', this.spawnMinotaur, this);
    this.noiseMeter.noiseThreshold.on('noise-low', this.stopMinotaur, this);

    this.ui = this.add.image(0, this.cameras.main.height, 'main_ui');
    this.ui.setScrollFactor(0);
    this.ui.setOrigin(0, 1);

    this.searchButton = this.add.image(745, SEARCH_BUTTON_Y_OFFSCREEN, 'search');
    this.searchButton.setScrollFactor(0);
    this.searchButton.setInteractive({
      useHandCursor: true
    });

    this.arrows = {
      n: this.add.sprite(259, 613, 'arrow', 2),
      e: this.add.sprite(306, 657, 'arrow', 2),
      s: this.add.sprite(259, 706, 'arrow', 2),
      w: this.add.sprite(209, 657, 'arrow', 2)
    }

    this.arrows.e.angle = 90;
    this.arrows.s.angle = 180;
    this.arrows.w.angle = 270;

    for (const key in this.arrows) {
      if (Object.prototype.hasOwnProperty.call(this.arrows, key)) {
        const arrow: Phaser.GameObjects.Sprite = this.arrows[key];
        arrow.setScrollFactor(0);
        arrow.setInteractive({
          useHandCursor: true
        });

        arrow.on('pointerover', () => {
          if (arrow.frame.name as unknown as number === ARROW_FRAME_ACTIVE) {
            arrow.setData('prev-frame', arrow.frame.name);
            arrow.setFrame(ARROW_FRAME_HOVER);
          }
        });

        arrow.on('pointerout', () => {
          if (arrow.frame.name as unknown as number === ARROW_FRAME_HOVER) {
            arrow.setFrame(arrow.getData('prev-frame'));
          }
        });
      }
    }

    this.noiseMeter.bringToTop();

    const startPoint: Phaser.Tilemaps.Tile = Phaser.Utils.Array.GetRandom(this.map.exits);

    this.player.setTilePosition(startPoint.x, startPoint.y);
    this.playerMoved(this.player.tilePosition);

    this.setupCameraControls();
    this.setupKeyboardControls();

    // debug
    window['scene'] = this;
  }

  private setupCameraControls(): void {
    this.cameras.main.setBounds(0, 0, this.map.tilemap.widthInPixels, this.map.tilemap.heightInPixels + this.ui.height);
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
      //this.searchRoom();
      //this.showHuntedUI();
    });
  }

  private tryMovingPlayer(vectorX: number, vectorY: number): void {
    if (!this.canMove || this.playerMoveTween?.isPlaying()) {
      return;
    }

    const destinationPosition: Phaser.Types.Math.Vector2Like = {
      x: this.player.tilePosition.x + vectorX,
      y: this.player.tilePosition.y + vectorY
    };

    if (this.map.isExiting(this.player.tilePosition, destinationPosition)) {
      console.log('is exit');
      // prompt to leave
      return;
    }

    if (this.map.isWalkableTile(destinationPosition)) {
      this.requestedMoveLocation = {
        x: this.player.tilePosition.x + (vectorX * CELL_PER_TILE),
        y: this.player.tilePosition.y + (vectorY * CELL_PER_TILE)
      };

      const isQuiet = this.noiseMeter.getNoiseReading();
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

    const treasure = this.map.hasTreasure(pos);

    if (treasure) {
      // show search button
      this.searchButtonTween = this.tweens.add({
        targets: this.searchButton,
        y: SEARCH_BUTTON_Y,
        ease: Phaser.Math.Easing.Expo.Out,
        duration: 300
      });
    } else if (this.searchButton.y !== SEARCH_BUTTON_Y_OFFSCREEN) {
      this.searchButtonTween.stop(1);
      this.searchButtonTween = this.tweens.add({
        targets: this.searchButton,
        y: SEARCH_BUTTON_Y_OFFSCREEN,
        ease: Phaser.Math.Easing.Expo.In,
        duration: 300
      });
    }

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

    if (this.minotaur) {
      if (this.minotaur.isFollowing) {
        this.minotaur.continueOnPath(pos);
      } else {
        if (!this.map.objectsAreAdjacent(this.player.tilePosition, this.minotaur.tilePosition)) {
          this.minotaurWalkAway();
        }
      }
    }

    // update button states;
    const tileNorth = this.map.getTileAt({ x: pos.x, y: pos.y - 1 });
    const tileSouth = this.map.getTileAt({ x: pos.x, y: pos.y + 1 });
    const tileEast = this.map.getTileAt({ x: pos.x + 1, y: pos.y });
    const tileWest = this.map.getTileAt({ x: pos.x - 1, y: pos.y });

    if (tileNorth.index === CELL_WALKABLE || this.map.isExit({ x: tileNorth.x, y: tileNorth.y })) {
      this.arrows.n.setFrame(ARROW_FRAME_ACTIVE);
    } else {
      this.arrows.n.setFrame(ARROW_FRAME_DISABLED);
    }

    if (tileSouth.index === CELL_WALKABLE || this.map.isExit({ x: tileSouth.x, y: tileSouth.y })) {
      this.arrows.s.setFrame(ARROW_FRAME_ACTIVE);
    } else {
      this.arrows.s.setFrame(ARROW_FRAME_DISABLED);
    }

    if (tileEast.index === CELL_WALKABLE || this.map.isExit({ x: tileEast.x, y: tileEast.y })) {
      this.arrows.e.setFrame(ARROW_FRAME_ACTIVE);
    } else {
      this.arrows.e.setFrame(ARROW_FRAME_DISABLED);
    }

    if (tileWest.index === CELL_WALKABLE || this.map.isExit({ x: tileWest.x, y: tileWest.y })) {
      this.arrows.w.setFrame(ARROW_FRAME_ACTIVE);
    } else {
      this.arrows.w.setFrame(ARROW_FRAME_DISABLED);
    }
  }

  private performAction(): void {
    if (this.huntedUI) {
      const isQuiet = this.noiseMeter.getNoiseReading();

      if (isQuiet) {
        this.huntedUI.addTime();
      } else {
        this.huntedUI.removeTime();
      }
    }
  }

  /* private searchRoom(): void {
    const currentTile = this.map.getTileAt(this.player.tilePosition);

    if (currentTile.properties.searched) {
      console.log('already searched');
    } else {
      if (Math.random() >= PROB_FIND_TREASURE) {
        //this.treasureCollected += TREASURES
      }
    }

    currentTile.properties.searched = true;
  } */

  private spawnMinotaur(): void {
    if (!this.minotaur) {
      // try to spawn minotaur someplace in history, not currently in memory
      const historyStartIndex = this.playerTileHistory.length - this.playerMemory.length - 1;

      if (historyStartIndex < 0) {
        return;
      }

      for (let i = historyStartIndex; i >= 0; i--) {
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
          const minotaur = new Minotaur(this, this.map);
          this.minotaur = this.add.existing(minotaur);
          this.bringUIToFront();

          this.minotaur.setTilePosition(this.playerTileHistory[i].x, this.playerTileHistory[i].y);
          this.minotaur.startFollow(this.playerTileHistory.slice(i + 1));
          this.minotaur.attacking.on('attacking', this.showHuntedUI, this);
          break;
        }
      }
    }
  }

  private stopMinotaur(): void {
    if (this.minotaur) {
      this.minotaur.stopFollow();
    }
  }

  private showHuntedUI(): void {
    this.canMove = false;
    this.huntedUI = new HuntedUI(this);

    this.huntedUI.result.on('success', () => {
      this.huntedUI.destroy();
      this.huntedUI = null;
      this.noiseMeter.reset();
      this.canMove = true;
      this.minotaurWalkAway();
    });

    this.huntedUI.result.on('fail', () => {
      this.huntedUI.destroy();
      this.huntedUI = null;

      console.log('GAME OVER');
    });

    this.noiseMeter.disableThresholds();
  }

  private minotaurWalkAway(): void {
    this.minotaur.destroy();
    this.minotaur = null;
  }

  private bringUIToFront() {
    this.children.bringToTop(this.ui);
    this.children.bringToTop(this.arrows.n);
    this.children.bringToTop(this.arrows.e);
    this.children.bringToTop(this.arrows.s);
    this.children.bringToTop(this.arrows.w);
    this.children.bringToTop(this.noiseMeter.badgeQuiet);
    this.children.bringToTop(this.noiseMeter.badgeLoud);
    this.children.bringToTop(this.searchButton);
  }
}

interface Treasure {
  name: string;
  description: string;
  noise: number;
  value: number;
}