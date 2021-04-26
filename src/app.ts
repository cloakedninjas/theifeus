import 'phaser';
import { WebFontLoaderPlugin } from 'phaser3-webfont-loader';
import Boot from './scenes/boot';
import Preload from './scenes/preload';
import Menu from './scenes/menu';
import { Game as GameScene } from './scenes/game';
import Score from './scenes/score';

const config: Phaser.Types.Core.GameConfig = {
  title: 'LD48',
  scene: [Boot, Preload, Menu, GameScene, Score],
  backgroundColor: '#000',
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    width: 1024,
    height: 768,
    max: {
      width: 1024,
      height: 768
    }
  },
  plugins: {
    global: [{
      key: 'WebFontLoader',
      plugin: WebFontLoaderPlugin,
      start: true
    }]
  }
};

window.addEventListener('load', () => {
  window['game'] = new Phaser.Game(config);
});
