import { Scene } from 'phaser';
import { TILE_SIZE } from '../config';
import { Map } from '../entities/map';
import { Player } from '../entities/player';

export class Game extends Scene {
  map: Map;
  player: Player;
  controls: Phaser.Cameras.Controls.FixedKeyControl;
  selectionMarker: Phaser.GameObjects.Graphics;

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

  private tryMovingPlayer(x: number, y: number): void {
    const destinationPosition: Phaser.Types.Math.Vector2Like = {
      x: this.player.tilePosition.x + x,
      y: this.player.tilePosition.y + y
    };

    if (this.map.isMoveValid(this.player.tilePosition, destinationPosition)) {
      this.player.moveTo(x, y);
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
