import { Scene } from 'phaser';
import { CELL_DIAMOND, CELL_PER_TILE, CELL_WALKABLE, MEMORY_FORGOT, MOVE_TIME_LOUD, MOVE_TIME_QUIET } from '../config';
import { Map } from '../entities/map';
import { Minotaur } from '../entities/minotaur';
import { Player } from '../entities/player';
import { NoiseMeter } from '../entities/noise-meter';
import { HuntedUI } from '../entities/hunted-ui';
import { DIR_VECTOR, INTERACTIVE, Treasure } from '../lib/types';

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
  private treasureAtTile: number;
  playerMoveTween: Phaser.Tweens.Tween;
  canMove = true;
  huntedUI: HuntedUI;
  ui: Phaser.GameObjects.Image;
  arrows: { n: Phaser.GameObjects.Sprite; e: Phaser.GameObjects.Sprite; s: Phaser.GameObjects.Sprite; w: Phaser.GameObjects.Sprite; };
  searchButton: Phaser.GameObjects.Image;
  searchButtonTween: Phaser.Tweens.Tween;
  bg: Phaser.GameObjects.TileSprite;
  leave: {
    bg: Phaser.GameObjects.Graphics;
    modal: Phaser.GameObjects.Image;
    leftArrow: Phaser.GameObjects.Image;
    rightArrow: Phaser.GameObjects.Image;
    visible: boolean;
  } = {
      bg: null,
      modal: null,
      leftArrow: null,
      rightArrow: null,
      visible: false
    };

  music: {
    ambient1: Phaser.Sound.BaseSound,
    ambient2: Phaser.Sound.BaseSound,
    minotaurSearching: Phaser.Sound.BaseSound,
    hunted: Phaser.Sound.BaseSound,
    currentTrack: Phaser.Sound.BaseSound,
    tween: Phaser.Tweens.Tween
  };

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
    this.searchButton.setInteractive(INTERACTIVE);
    this.searchButton.on('pointerup', this.collectTreasure, this);

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
        arrow.setInteractive(INTERACTIVE);

        arrow.on('pointerdown', () => this.handleDirPress(key));

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

    this.music = {
      ambient1: this.sound.add('exploring1'),
      ambient2: this.sound.add('exploring2'),
      hunted: this.sound.add('noescape'),
      minotaurSearching: this.sound.add('hide'),
      currentTrack: null,
      tween: null
    };

    this.playMusic();

    // debug
    window['scene'] = this;
  }

  private setupCameraControls(): void {
    this.cameras.main.setBounds(0, 0, this.map.tilemap.widthInPixels, this.map.tilemap.heightInPixels + this.ui.height);
    this.cameras.main.startFollow(this.player);
  }

  private setupKeyboardControls() {
    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = this.input.keyboard.addKeys('W,S,A,D');

    cursors.up.on('up', () => this.handleDirPress('n'));
    cursors.right.on('up', () => this.handleDirPress('e'));
    cursors.down.on('up', () => this.handleDirPress('s'));
    cursors.left.on('up', () => this.handleDirPress('w'));

    wasd['W'].on('down', () => this.handleDirPress('n'));
    wasd['A'].on('down', () => this.handleDirPress('w'));
    wasd['S'].on('down', () => this.handleDirPress('s'));
    wasd['D'].on('down', () => this.handleDirPress('e'));

    cursors.space.on('up', () => this.performAction());

    // debug
    this.input.on('pointerup', () => {
      //this.gameOver(false);
    });
  }

  private handleDirPress(dir: string): void {
    const vector = DIR_VECTOR[dir];

    if (this.leave.visible) {
      if (vector.x === -1) {
        this.cameras.main.fadeOut(500, undefined, undefined, undefined, (_camera, i: number) => {
          if (i === 1) {
            this.gameOver(true);
          }
        });
      } else if (vector.x === 1) {
        this.leave.leftArrow.visible = false;
        this.leave.rightArrow.visible = false;

        this.tweens.add({
          targets: this.leave.bg,
          alpha: 0,
          duration: 500
        });

        this.tweens.add({
          targets: this.leave.modal,
          y: this.cameras.main.height,
          duration: 300,
          ease: Phaser.Math.Easing.Sine.In,
          onComplete: () => {
            this.canMove = true;
            this.leave.visible = false;
          }
        });
      }

      return;
    }

    if (!this.canMove || this.playerMoveTween?.isPlaying()) {
      return;
    }

    this.player.flipX = vector.x === 1;

    const destinationPosition: Phaser.Types.Math.Vector2Like = {
      x: this.player.tilePosition.x + vector.x,
      y: this.player.tilePosition.y + vector.y
    };

    if (this.map.isExiting(this.player.tilePosition, destinationPosition)) {
      this.showLeaveUI();
      return;
    }

    if (this.map.isWalkableTile(destinationPosition)) {
      this.requestedMoveLocation = {
        x: this.player.tilePosition.x + (vector.x * CELL_PER_TILE),
        y: this.player.tilePosition.y + (vector.y * CELL_PER_TILE)
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

    this.treasureAtTile = this.map.hasTreasure(pos);

    if (this.treasureAtTile !== null) {
      // show search button
      this.searchButtonTween = this.tweens.add({
        targets: this.searchButton,
        y: SEARCH_BUTTON_Y,
        ease: Phaser.Math.Easing.Expo.Out,
        duration: 300
      });
    } else if (this.searchButton.y !== SEARCH_BUTTON_Y_OFFSCREEN) {
      this.hideSearchButton();
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
      this.map.fadeFromMemory(tileForgotten);
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
    } else if (this.searchButton.y !== SEARCH_BUTTON_Y_OFFSCREEN) {
      this.collectTreasure();
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

          this.playMusic();
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
    this.huntedUI = new HuntedUI(this, this.noiseMeter);

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

      this.gameOver(false);
    });

    this.noiseMeter.disableThresholds();
    this.playMusic();
  }

  private minotaurWalkAway(): void {
    this.minotaur.destroy();
    this.minotaur = null;
    this.playMusic();
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

  private collectTreasure(): void {
    let treasure;

    if (this.treasureAtTile === CELL_DIAMOND) {
      treasure = this.treasures.pop();
    } else {
      treasure = this.treasures.shift();
    }

    this.treasureCollected.push(treasure);

    if (treasure.noise && !this.noiseMeter.getNoiseReading()) {
      this.noiseMeter.noiseLevel += treasure.noise;
    }

    this.map.removeTreasureAt(this.player.tilePosition);
    this.hideSearchButton();
  }

  private hideSearchButton(): void {
    this.searchButtonTween.stop(1);
    this.searchButtonTween = this.tweens.add({
      targets: this.searchButton,
      y: SEARCH_BUTTON_Y_OFFSCREEN,
      ease: Phaser.Math.Easing.Expo.In,
      duration: 300
    });
  }

  private showLeaveUI(): void {
    this.canMove = false;

    if (!this.leave.bg) {
      const bg = this.add.graphics();
      bg.fillStyle(0, 0.6);
      bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
      bg.setScrollFactor(0);
      bg.alpha = 0;
      this.leave.bg = bg;

      const modal = this.add.image(this.cameras.main.width / 2, this.cameras.main.height, 'exit');
      modal.setOrigin(0.5, 0);
      modal.setScrollFactor(0);
      this.leave.modal = modal;

      ['leftArrow', 'rightArrow'].forEach(arrowName => {
        const arrow = this.add.image(200, 670, 'arrow');
        this.leave[arrowName] = arrow;
        let dir;

        if (arrowName === 'leftArrow') {
          arrow.angle = 270;
          arrow.x = 415;
          dir = 'w';
        } else {
          arrow.angle = 90;
          arrow.x = 607;
          dir = 'e';
        }

        arrow.setScrollFactor(0);
        arrow.visible = false;
        arrow.setInteractive(INTERACTIVE)

        arrow.on('pointerdown', () => {
          this.handleDirPress(dir);
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
      })
    }

    this.leave.visible = true;

    this.tweens.add({
      targets: this.leave.bg,
      alpha: 1,
      duration: 500
    });

    this.tweens.add({
      targets: this.leave.modal,
      y: this.cameras.main.height - this.leave.modal.height,
      duration: 300,
      ease: Phaser.Math.Easing.Sine.Out,
      onComplete: () => {
        this.leave.leftArrow.visible = true;
        this.leave.rightArrow.visible = true;
      }
    });
  }

  private playMusic() {
    if (this.music.currentTrack?.isPlaying) {
      if (this.music.tween) {
        this.music.tween.complete(1);
      }

      this.music.tween = this.tweens.add({
        targets: this.music.currentTrack,
        volume: 0,
        duration: 500
      });
    }

    if (this.huntedUI) {
      this.music.currentTrack = this.music.hunted;
    } else if (this.minotaur) {
      this.music.currentTrack = this.music.minotaurSearching;
    } else {
      const random = Math.ceil(Math.random() * 2);
      this.music.currentTrack = this.music[`ambient${random}`];
    }

    this.music.currentTrack.play({
      loop: true,
      volume: 1
    });
  }

  private gameOver(alive: boolean) {
    this.music.currentTrack.stop();
    this.scene.start('ScoreScene', {
      treasures: this.treasureCollected,
      alive
    });
  }
}
