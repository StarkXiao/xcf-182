import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene.js'
import { DialogueScene } from './scenes/DialogueScene.js'
import { VersusScene } from './scenes/VersusScene.js'
import { getActiveThemeColors } from './data/dailyChallenge.js'

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
    
    const scenes = []
    
    if (this.options.isVersusMode) {
      const versusScene = new VersusScene()
      versusScene.setVersusConfig({
        onBackToStart: this.options.onBackToStart,
        maxTime: this.options.maxTime || 120
      })
      scenes.push(versusScene)
    } else {
      const gameScene = new GameScene()
      const dialogueScene = new DialogueScene()
      
      const themeColors = getActiveThemeColors()
      gameScene.setThemeColors(themeColors)
      
      if (this.options.isDailyChallenge) {
        gameScene.setDailyChallengeConfig({
          isDailyChallenge: true,
          dailyLevel: this.options.dailyLevel,
          onDailyComplete: this.options.onDailyComplete,
          onBackToStart: this.options.onBackToStart
        })
      } else if (this.options.isRandomMode) {
        gameScene.setRandomModeConfig({
          isRandomMode: true,
          difficulty: this.options.difficulty || 3,
          seed: this.options.seed || null,
          onBackToStart: this.options.onBackToStart
        })
      } else if (this.options.isWorkshopMode) {
        gameScene.setWorkshopConfig({
          isWorkshopMode: true,
          workshopLevel: this.options.workshopLevel,
          onBackToStart: this.options.onBackToStart
        })
      }
      
      if (this.options.isStoryMode) {
        gameScene.setStoryModeConfig({
          isStoryMode: true,
          onStoryComplete: this.options.onStoryComplete,
          onBackToStart: this.options.onBackToStart
        })
      }
      
      if (this.options.startLevelIndex !== undefined) {
        gameScene.currentLevelIndex = this.options.startLevelIndex
      }
      
      scenes.push(gameScene, dialogueScene)
    }
    
    const config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: this.container,
      backgroundColor: '#0a0a1a',
      scene: scenes,
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
