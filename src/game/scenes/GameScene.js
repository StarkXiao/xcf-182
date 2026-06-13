import Phaser from 'phaser'
import { LevelMap } from '../modules/LevelMap.js'
import { PlantState } from '../modules/PlantState.js'
import { PathJudge } from '../modules/PathJudge.js'
import { Effects } from '../modules/Effects.js'
import { HintPanel } from '../modules/HintPanel.js'
import { LEVELS, PLANT_TYPES } from '../data/levels.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.currentLevelIndex = 0
    this.levelMap = null
    this.plantState = null
    this.pathJudge = null
    this.effects = null
    this.hintPanel = null
    this.creature = null
    this.isAnimating = false
    this.totalScore = 0
  }

  preload() {
  }

  create() {
    this.effects = new Effects(this)
    this.effects.init()
    
    this.levelMap = new LevelMap(this)
    this.plantState = new PlantState(this, this.levelMap)
    this.pathJudge = new PathJudge(this, this.levelMap, this.plantState)
    this.hintPanel = new HintPanel(this)
    
    this.effects.setLevelMap(this.levelMap)
    
    this.hintPanel.init()
    
    this.hintPanel.onReset = () => this.resetLevel()
    this.hintPanel.onShowHint = () => {
      if (this.pathJudge) {
        this.pathJudge.showHint()
      }
    }
    
    this.loadLevel(this.currentLevelIndex)
  }

  loadLevel(levelIndex) {
    this.isAnimating = true
    
    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }
    
    this.effects.createLevelTransition(() => {
      this.children.removeAll()
      
      this.effects.init()
      
      const level = this.levelMap.loadLevel(levelIndex)
      if (!level) {
        this.showGameComplete()
        return
      }
      
      this.levelMap.render()
      this.plantState.init()
      this.pathJudge.init()
      this.hintPanel.setCurrentLevelIndex(levelIndex)
      this.hintPanel.reset()
      
      this.pathJudge.onPathComplete = (path) => this.onPathComplete(path)
      this.pathJudge.onPathInvalid = () => this.onPathInvalid()
      
      const startPos = this.levelMap.getWorldPosition(level.start.row, level.start.col)
      this.creature = this.effects.createCreatureSprite(startPos.x, startPos.y)
      this.creature.setDepth(100)
      
      this.showLevelIntro(level)
      
      this.isAnimating = false
    })
  }

  showLevelIntro(level) {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const intro = this.add.text(width / 2, height / 2 - 100, level.name, {
      fontSize: '32px',
      fill: '#60a5fa',
      fontStyle: 'bold'
    })
    intro.setOrigin(0.5)
    intro.setDepth(200)
    intro.setAlpha(0)
    
    const desc = this.add.text(width / 2, height / 2 - 50, level.description, {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    desc.setOrigin(0.5)
    desc.setDepth(200)
    desc.setAlpha(0)
    
    const instruction = this.add.text(width / 2, height / 2, '从起点拖动到终点，点亮沿途的植物', {
      fontSize: '14px',
      fill: '#9ca3af'
    })
    instruction.setOrigin(0.5)
    instruction.setDepth(200)
    instruction.setAlpha(0)
    
    this.tweens.add({
      targets: [intro, desc, instruction],
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Cubic.out',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: [intro, desc, instruction],
            alpha: 0,
            duration: 300,
            ease: 'Cubic.in',
            onComplete: () => {
              intro.destroy()
              desc.destroy()
              instruction.destroy()
            }
          })
        })
      }
    })
  }

  onPathComplete(path) {
    if (this.isAnimating) return
    
    this.isAnimating = true
    this.hintPanel.incrementAttempts()
    
    const litCount = this.plantState.getLitCount()
    const levelScore = litCount * 10 + 50
    this.hintPanel.updateScore(levelScore)
    this.totalScore += levelScore
    
    const endPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.end.row,
      this.levelMap.currentLevel.end.col
    )
    this.effects.createSuccessEffect(endPos.x, endPos.y)
    
    this.effects.animateCreatureAlongPath(this.creature, path, () => {
      this.time.delayedCall(500, () => {
        this.hintPanel.showLevelComplete(
          this.currentLevelIndex,
          levelScore,
          () => this.nextLevel()
        )
        this.isAnimating = false
      })
    })
  }

  onPathInvalid() {
    this.hintPanel.incrementAttempts()
  }

  nextLevel() {
    this.currentLevelIndex++
    if (this.currentLevelIndex >= LEVELS.length) {
      this.showGameComplete()
    } else {
      this.loadLevel(this.currentLevelIndex)
    }
  }

  resetLevel() {
    if (this.isAnimating) return
    
    this.pathJudge.resetPath()
    
    const startPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.start.row,
      this.levelMap.currentLevel.start.col
    )
    
    if (this.creature) {
      this.tweens.add({
        targets: this.creature,
        x: startPos.x,
        y: startPos.y,
        angle: 0,
        duration: 300,
        ease: 'Cubic.out'
      })
    }
  }

  showGameComplete() {
    this.hintPanel.showGameComplete(this.totalScore, () => {
      this.currentLevelIndex = 0
      this.totalScore = 0
      this.loadLevel(0)
    })
  }

  update(time, delta) {
  }

  destroy() {
    if (this.levelMap) this.levelMap = null
    if (this.plantState) this.plantState.destroy()
    if (this.pathJudge) this.pathJudge.destroy()
    if (this.effects) this.effects.destroy()
    if (this.hintPanel) this.hintPanel.destroy()
  }
}
