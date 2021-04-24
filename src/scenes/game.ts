import { Scene } from 'phaser';
import { MOVE_TIME_LOUD, MOVE_TIME_QUIET, TILE_SIZE } from '../config';
import { Map } from '../entities/map';
import { Player } from '../entities/player';
import { MoveMinigame } from '../entities/move-minigame';

export class Game extends Scene {
  private map: Map;
  private player: Player;
  private controls: Phaser.Cameras.Controls.FixedKeyControl;
  private moveMinigame: MoveMinigame;
  private requestedMoveLocation: Phaser.Types.Math.Vector2Like;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    this.map = new Map(this);

    const player = new Player(this);
    this.player = this.add.existing(player);
    this.player.setTilePosition(1, 0);

    this.setupCameraControls();
    //this.setupMouseControls();
    this.setupKeyboardControls();

    this.moveMinigame = new MoveMinigame(this);
  }

  update() {
    //this.map.render();
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
      //console.log(this.map.getValidMovePositions(this.player.tilePosition));
    });
  }

  /* private setupMouseControls() {
    this.selectionMarker = this.add.graphics();
    //this.selectionMarker.visible = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('click');
      const pointerTileCoord = this.getTileCoordAtPointer(pointer);
      const tile = this.map.tilemap.getTileAt(pointerTileCoord.x, pointerTileCoord.y);
      console.log(tile.properties);
    });

    this.input.on('pointerup', () => {
      //
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const pointerTileCoord = this.getTileCoordAtPointer(pointer);
      const screenCoord = this.getScreenCoordForTile(pointerTileCoord);

      screenCoord.x -= this.cameras.main.x;
      screenCoord.y -= this.cameras.main.y;

      const lineStyle = this.map.isMoveValid(this.player.tilePosition, pointerTileCoord) ? SELECTION_VALID_COLOUR : SELECTION_INVALID_COLOUR;

      this.selectionMarker.clear();
      this.selectionMarker.lineStyle(2, lineStyle, 1);
      this.selectionMarker.strokeRect(screenCoord.x, screenCoord.y, TILE_SIZE, TILE_SIZE);
    });
  } */

  private tryMovingPlayer(vectorX: number, vectorY: number): void {
    const destinationPosition: Phaser.Types.Math.Vector2Like = {
      x: this.player.tilePosition.x + vectorX,
      y: this.player.tilePosition.y + vectorY
    };

    if (this.map.isMoveValid(this.player.tilePosition, destinationPosition)) {
      this.requestedMoveLocation = destinationPosition;
      this.moveMinigame.start();
      //this.player.moveTo(x, y);
    }
  }

  private performAction(): void {
    if (this.moveMinigame.bg.visible && this.moveMinigame.tween.isPlaying) {
      const quietMove = this.moveMinigame.stop();

      console.log(quietMove ? 'Quietly' : 'Loudly');
      this.player.moveTo(this.requestedMoveLocation, quietMove ? MOVE_TIME_QUIET : MOVE_TIME_LOUD);
    }
  }

  private getTileCoordAtPointer(pointer): Phaser.Types.Math.Vector2Like {
    const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    return {
      x: Math.floor(worldPoint.x / TILE_SIZE),
      y: Math.floor(worldPoint.y / TILE_SIZE)
    }
  }

  private getScreenCoordForTile(tile: Phaser.Types.Math.Vector2Like): Phaser.Types.Math.Vector2Like {
    return {
      x: tile.x * TILE_SIZE,
      y: tile.y * TILE_SIZE
    }
  }
}
