import { Scene } from 'phaser';
import { Map } from '../entities/map';
import { Player } from '../entities/player';
import { TILE_SIZE } from '../entities/tile';

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
    const map = new Map(this);
    this.map = this.add.existing(map);

    const player = new Player(this);
    player.setOrigin(0, 0);
    this.player = this.add.existing(player);
    this.player.setTilePosition(0, 0);

    this.setupCameraControls();
    this.setupMouseControls();
  }

  update() {
    this.map.render();
  }

  private setupCameraControls(): void {
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height);
    this.cameras.main.startFollow(this.player);
  }

  private setupMouseControls() {
    this.selectionMarker = this.add.graphics();
    this.selectionMarker.visible = false;

    this.input.on('pointerdown', () => {
      console.log('click');
    });

    this.input.on('pointerup', () => {
      //
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const currentPointerCoord = this.getTileCoordAtPointer();
      console.log(currentPointerCoord);
    });
  }

  private getTileCoordAtPointer(): Phaser.Types.Math.Vector2Like {
    const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    return {
      x: Math.floor(worldPoint.x / TILE_SIZE),
      y: Math.floor(worldPoint.y / TILE_SIZE)
    }
    //return this.map.worldToTileXY(worldPoint.x, worldPoint.y);
  }
}
