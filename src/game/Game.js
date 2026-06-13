import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene.js'

export class Game {
  constructor(container) {
    this.container = container
    this.game = null
    this.init()
  }

  init() {
    const width = window.innerWidth
    const height = window.innerHeight
    
    const config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: this.container,
      backgroundColor: '#0a0a1a',
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: false,
        antialias: true
      },
      input: {
        activePointers: 3
      }
    }
    
    this.game = new Phaser.Game(config)
    
    window.addEventListener('resize', () => this.handleResize())
  }

  handleResize() {
    if (this.game) {
      this.game.scale.resize(window.innerWidth, window.innerHeight)
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
    window.removeEventListener('resize', () => this.handleResize())
  }
}
