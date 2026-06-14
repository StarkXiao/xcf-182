import Phaser from 'phaser'
import { LevelMap } from '../modules/LevelMap.js'
import { PlantState } from '../modules/PlantState.js'
import { PathJudge } from '../modules/PathJudge.js'
import { Effects } from '../modules/Effects.js'
import { HintPanel } from '../modules/HintPanel.js'
import { LEVELS, PLANT_TYPES } from '../data/levels.js'
import { getDialogueForLevel, STORY_DIALOGUES } from '../data/story.js'

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
    this.onBackToStart = null
    this.dailyCompleted = false
    this.themeColors = null
    this.isStoryMode = false
    this.onStoryComplete = null
    this.storyCompleted = false
  }

  setDailyChallengeConfig(config) {
    this.isDailyChallenge = config.isDailyChallenge || false
    this.dailyLevel = config.dailyLevel || null
    this.onDailyComplete = config.onDailyComplete || null
    this.onBackToStart = config.onBackToStart || null
  }

  setStoryModeConfig(config) {
    this.isStoryMode = config.isStoryMode || false
    this.onStoryComplete = config.onStoryComplete || null
    this.onBackToStart = config.onBackToStart || null
  }

  setThemeColors(colors) {
    this.themeColors = colors
  }

  preload() {
  }

  create() {
    this.effects = new Effects(this)
    this.effects.init(this.themeColors)
    
    this.levelMap = new LevelMap(this, this.themeColors)
    this.plantState = new PlantState(this, this.levelMap)
    this.pathJudge = new PathJudge(this, this.levelMap, this.plantState)
    this.hintPanel = new HintPanel(this)
    
    this.effects.setLevelMap(this.levelMap)
    
    if (this.isDailyChallenge && this.dailyLevel) {
      this.levelMap.setDailyLevel(this.dailyLevel)
    }
    
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
    
    if (this.isStoryMode) {
      this.hintPanel.setStoryMode(true)
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
      
      if (this.isStoryMode) {
        this.hintPanel.setStoryMode(true)
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
      
      if (this.isStoryMode) {
        const beforeDialogue = getDialogueForLevel(levelIndex, true)
        if (beforeDialogue) {
          this.showDialogue(beforeDialogue, () => {
            this.showLevelIntro(level)
            this.isAnimating = false
          })
        } else {
          this.showLevelIntro(level)
          this.isAnimating = false
        }
      } else {
        this.showLevelIntro(level)
        this.isAnimating = false
      }
    })
  }

  showDialogue(dialogues, onComplete) {
    this.scene.pause()
    this.scene.launch('DialogueScene', {
      dialogues: dialogues,
      onComplete: onComplete
    })
  }

  showLevelIntro(level) {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const levelLabel = this.isStoryMode ? `第 ${level.id} 章` : ''
    const titleText = this.isDailyChallenge 
      ? `${level.name} 🔥` 
      : this.isStoryMode 
        ? `${levelLabel} · ${level.name}` 
        : level.name
    const titleFill = this.isDailyChallenge 
      ? '#fbbf24' 
      : this.isStoryMode 
        ? '#a78bfa' 
        : '#60a5fa'
    
    const intro = this.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '32px',
      fill: titleFill,
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
    
    let challengeLabel = '从起点拖动到终点，点亮沿途的植物'
    if (this.isDailyChallenge) {
      challengeLabel = '🔥 每日挑战 · 完成后不可重玩'
    } else if (this.isStoryMode) {
      challengeLabel = '📖 故事模式 · 点亮植物，推动剧情发展'
    }
    
    const instructionFill = this.isDailyChallenge 
      ? '#fbbf24' 
      : this.isStoryMode 
        ? '#a78bfa' 
        : '#9ca3af'
    
    const instruction = this.add.text(width / 2, height / 2, challengeLabel, {
      fontSize: '14px',
      fill: instructionFill
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
    if (this.isDailyChallenge) {
      this.dailyCompleted = true
    }
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
        } else if (this.isStoryMode) {
          this.handleStoryLevelComplete(levelScore)
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

  handleStoryLevelComplete(levelScore) {
    const isLastLevel = this.currentLevelIndex >= LEVELS.length - 1
    const afterDialogue = getDialogueForLevel(this.currentLevelIndex, false)
    
    const proceedToNext = () => {
      if (isLastLevel) {
        this.storyCompleted = true
        this.showStoryComplete()
      } else {
        this.hintPanel.showLevelComplete(
          this.currentLevelIndex,
          levelScore,
          () => this.nextLevel(),
          true
        )
      }
    }
    
    if (afterDialogue) {
      this.showDialogue(afterDialogue, proceedToNext)
    } else if (isLastLevel) {
      this.showDialogue(STORY_DIALOGUES.epilogue, () => {
        this.storyCompleted = true
        this.showStoryComplete()
      })
    } else {
      proceedToNext()
    }
  }

  showStoryComplete() {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const panel = this.add.container(0, 0)
    panel.setDepth(400)
    
    const bg = this.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 420,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xa78bfa, 0.8)
    panel.add(bg)
    
    const title = this.add.text(width / 2, height / 2 - 170, '✨ 故事模式通关！', {
      fontSize: '30px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    const subtitle = this.add.text(width / 2, height / 2 - 130, '生命之源已经苏醒', {
      fontSize: '18px',
      fill: '#f472b6'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)
    
    const scoreInfo = this.add.text(width / 2, height / 2 - 85, `总得分：${this.totalScore} 分`, {
      fontSize: '24px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)
    
    const thanks = this.add.text(width / 2, height / 2 - 40, '感谢你陪伴洞穴的朋友们度过这段旅程', {
      fontSize: '15px',
      fill: '#e2e8f0',
      align: 'center'
    })
    thanks.setOrigin(0.5)
    panel.add(thanks)
    
    const lore1 = this.add.text(width / 2, height / 2 - 5, '🌿 苔藓长老 · 🦋 月光萤 · 🗿 小石灵 · 🌸 花之灵', {
      fontSize: '14px',
      fill: '#60a5fa',
      align: 'center'
    })
    lore1.setOrigin(0.5)
    panel.add(lore1)
    
    const lore2 = this.add.text(width / 2, height / 2 + 25, '星辰洞穴将永远铭记你的名字——引路人', {
      fontSize: '15px',
      fill: '#fbbf24',
      align: 'center'
    })
    lore2.setOrigin(0.5)
    panel.add(lore2)
    
    const restartBtn = this.add.text(width / 2 - 100, height / 2 + 85, '🔄 重玩故事', {
      fontSize: '16px',
      fill: '#60a5fa',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 20, y: 12 }
    })
    restartBtn.setOrigin(0.5)
    restartBtn.setInteractive({ useHandCursor: true })
    restartBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          this.currentLevelIndex = 0
          this.totalScore = 0
          this.hintPanel.score = 0
          this.storyCompleted = false
          this.loadLevel(0)
        }
      })
    })
    restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#2d4a6f'))
    restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#1e3a5f'))
    panel.add(restartBtn)
    
    const backBtn = this.add.text(width / 2 + 100, height / 2 + 85, '🏠 返回首页', {
      fontSize: '16px',
      fill: '#a78bfa',
      fontStyle: 'bold',
      backgroundColor: '#3b1f5f',
      padding: { x: 20, y: 12 }
    })
    backBtn.setOrigin(0.5)
    backBtn.setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (this.onStoryComplete) {
            this.onStoryComplete(this.totalScore)
          }
          if (this.onBackToStart) {
            this.time.delayedCall(300, () => {
              this.onBackToStart()
            })
          }
        }
      })
    })
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#4a2d7f'))
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#3b1f5f'))
    panel.add(backBtn)
    
    panel.setAlpha(0)
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    for (let i = 0; i < 30; i++) {
      this.time.delayedCall(i * 60, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xa78bfa, 0xf472b6, 0x60a5fa, 0x22c55e, 0xfbbf24][Math.floor(Math.random() * 5)]
        
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

  onPathInvalid() {
    this.hintPanel.incrementAttempts()
  }

  nextLevel() {
    this.currentLevelIndex++
    if (this.currentLevelIndex >= LEVELS.length) {
      if (this.isStoryMode) {
        this.storyCompleted = true
        this.showStoryComplete()
      } else {
        this.showGameComplete()
      }
    } else {
      this.loadLevel(this.currentLevelIndex)
    }
  }

  resetLevel() {
    if (this.isAnimating) return
    if (this.isDailyChallenge && this.dailyCompleted) return
    if (this.isStoryMode && this.storyCompleted) return
    
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
          if (this.onBackToStart) {
            this.time.delayedCall(300, () => {
              this.onBackToStart()
            })
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
