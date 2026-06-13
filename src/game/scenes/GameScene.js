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
    this.isDailyChallenge = false
    this.dailyLevel = null
    this.onDailyComplete = null
  }

  setDailyChallengeConfig(config) {
    this.isDailyChallenge = config.isDailyChallenge || false
    this.dailyLevel = config.dailyLevel || null
    this.onDailyComplete = config.onDailyComplete || null
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
    
    if (this.isDailyChallenge) {
      this.hintPanel.setDailyChallengeMode(true)
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
      
      const hasExistingScore = this.hintPanel && this.hintPanel.getScore() > 0
      this.hintPanel.init(hasExistingScore)
      this.hintPanel.setCurrentLevelIndex(levelIndex)
      this.hintPanel.reset()
      
      if (this.isDailyChallenge) {
        this.hintPanel.setDailyChallengeMode(true)
      }
      
      this.hintPanel.onReset = () => this.resetLevel()
      this.hintPanel.onShowHint = () => {
        if (this.pathJudge) {
          this.pathJudge.showHint()
        }
      }
      
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
    
    const titleText = this.isDailyChallenge ? `${level.name} 🔥` : level.name
    const intro = this.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '32px',
      fill: this.isDailyChallenge ? '#fbbf24' : '#60a5fa',
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
    
    const challengeLabel = this.isDailyChallenge
      ? '🔥 每日挑战 · 完成后不可重玩'
      : '从起点拖动到终点，点亮沿途的植物'
    const instruction = this.add.text(width / 2, height / 2, challengeLabel, {
      fontSize: '14px',
      fill: this.isDailyChallenge ? '#fbbf24' : '#9ca3af'
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
        if (this.isDailyChallenge) {
          this.showDailyChallengeComplete(levelScore)
        } else {
          this.hintPanel.showLevelComplete(
            this.currentLevelIndex,
            levelScore,
            () => this.nextLevel()
          )
        }
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

  showDailyChallengeComplete(score) {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const panel = this.add.container(0, 0)
    panel.setDepth(400)
    
    const bg = this.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 350,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.8)
    panel.add(bg)
    
    const title = this.add.text(width / 2, height / 2 - 130, '🔥 每日挑战完成！', {
      fontSize: '28px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    const scoreInfo = this.add.text(width / 2, height / 2 - 75, `获得 ${score} 分`, {
      fontSize: '22px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)
    
    const subtitle = this.add.text(width / 2, height / 2 - 35, '今日挑战已完成，明天再来！', {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)
    
    const noReplay = this.add.text(width / 2, height / 2, '每日挑战仅可完成一次，不可重玩', {
      fontSize: '13px',
      fill: '#f87171'
    })
    noReplay.setOrigin(0.5)
    panel.add(noReplay)
    
    const streakInfo = this.add.text(width / 2, height / 2 + 35, '保持连续打卡，解锁更多奖励！', {
      fontSize: '14px',
      fill: '#fbbf24'
    })
    streakInfo.setOrigin(0.5)
    panel.add(streakInfo)
    
    const rewardHint = this.add.text(width / 2, height / 2 + 65, '🌟 连续7天 · 特殊徽章 + 主题皮肤', {
      fontSize: '13px',
      fill: '#a78bfa'
    })
    rewardHint.setOrigin(0.5)
    panel.add(rewardHint)
    
    const closeBtn = this.add.text(width / 2, height / 2 + 110, '✓ 确认', {
      fontSize: '18px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 30, y: 12 }
    })
    closeBtn.setOrigin(0.5)
    closeBtn.setInteractive({ useHandCursor: true })
    
    closeBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (this.onDailyComplete) {
            this.onDailyComplete(score)
          }
        }
      })
    })
    
    closeBtn.on('pointerover', () => {
      closeBtn.setBackgroundColor('#b45309')
    })
    closeBtn.on('pointerout', () => {
      closeBtn.setBackgroundColor('#92400e')
    })
    
    panel.add(closeBtn)
    
    panel.setAlpha(0)
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 80, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0xf97316, 0xef4444, 0xa78bfa][Math.floor(Math.random() * 4)]
        
        this.add.particles(x, y, 'sparkle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 1000,
          tint: color,
          quantity: 10,
          duration: 300
        })
      })
    }
  }

  showGameComplete() {
    this.hintPanel.showGameComplete(this.totalScore, () => {
      this.currentLevelIndex = 0
      this.totalScore = 0
      this.hintPanel.score = 0
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
