import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene.js'

export class Game {
  constructor(container, options = {}) {
    this.container = container
    this.game = null
    this.options = options
    this.init()
  }

  init() {
    const width = window.innerWidth
    const height = window.innerHeight
    
    const gameScene = new GameScene()
    
    if (this.options.isDailyChallenge) {
      gameScene.setDailyChallengeConfig({
        isDailyChallenge: true,
        dailyLevel: this.options.dailyLevel,
        onDailyComplete: this.options.onDailyComplete
      })
    }
    
    const config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: this.container,
      backgroundColor: '#0a0a1a',
      scene: [gameScene],
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
    
    if (this.options.isDailyChallenge && this.options.dailyLevel) {
      this.game.events.once('ready', () => {
        const scene = this.game.scene.getScene('GameScene')
        if (scene && scene.levelMap) {
          scene.levelMap.setDailyLevel(this.options.dailyLevel)
        }
      })
    }
    
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
