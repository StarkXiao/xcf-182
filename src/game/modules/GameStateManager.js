import { LEVELS, PLANT_TYPES } from '../data/levels.js'
import { STORY_DIALOGUES, getDialogueForLevel } from '../data/story.js'
import { getAchievementManager } from './AchievementManager.js'
import { AudioManager } from './AudioManager.js'
import { getItemManager, ITEM_TYPES, ITEM_CONFIG } from './ItemManager.js'

export class GameStateManager {
  constructor(scene, dependencies) {
    this.scene = scene
    this.levelMap = dependencies.levelMap
    this.hintPanel = dependencies.hintPanel
    this.effects = dependencies.effects
    this.levelLoader = dependencies.levelLoader
    this.scoreManager = dependencies.scoreManager
    this.bossLevelManager = dependencies.bossLevelManager
    this.plantState = dependencies.plantState
    this.pathJudge = dependencies.pathJudge

    this.onDailyComplete = null
    this.onStoryComplete = null
    this.onBackToStart = null

    this.itemButton = null

    this.achievementManager = getAchievementManager()
    this.audioManager = AudioManager.getInstance()
    this.itemManager = getItemManager()
  }

  setModeConfig(config) {
    this.onDailyComplete = config.onDailyComplete || null
    this.onStoryComplete = config.onStoryComplete || null
    this.onBackToStart = config.onBackToStart || null
  }

  onPathComplete(path, branchId = null) {
    const levelLoader = this.levelLoader
    const scoreManager = this.scoreManager

    if (levelLoader.isAnimating || levelLoader.isTutorialMode) return

    levelLoader.isAnimating = true
    if (levelLoader.isDailyChallenge) {
      levelLoader.dailyCompleted = true
    }
    this.hintPanel.incrementAttempts()

    const completionTime = scoreManager.stopLevelTimer()
    const completionSteps = Math.max(0, path.length - 1)
    const currentAttempts = this.hintPanel.getAttempts()

    if (levelLoader.isBossLevel && this.bossLevelManager) {
      this.bossLevelManager.pause()
    }

    if (branchId && this.plantState) {
      const newlyLit = this.plantState.lightUpHiddenPlantsForBranch(branchId)
      if (newlyLit.length > 0 && this.audioManager) {
        this.audioManager.playSuccess(3)
      }
    }

    const litCount = this.plantState.getLitCount()
    const totalPlants = this.plantState.getTotalCount()
    const allLit = totalPlants > 0 && litCount >= totalPlants
    const levelScore = scoreManager.calculateLevelScore()
    this.hintPanel.updateScore(levelScore)
    scoreManager.addToTotalScore(levelScore)

    const endPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.end.row,
      this.levelMap.currentLevel.end.col
    )
    this.effects.createSuccessEffect(endPos.x, endPos.y)

    const isNormalMode = !this.levelLoader.isDailyChallenge && !this.levelLoader.isStoryMode && !this.levelLoader.isRandomMode && !this.levelLoader.isWorkshopMode
    let stars = 1
    if (isNormalMode && this.levelMap.currentLevel && scoreManager.levelProgressManager) {
      stars = scoreManager.calculateStars(
        this.levelMap.currentLevel,
        completionTime,
        completionSteps,
        currentAttempts
      )
    }

    if (this.audioManager) {
      this.audioManager.playSuccess(stars)
    }

    let canNext = true
    let isFirstClear = false

    if (isNormalMode && this.levelMap.currentLevel && scoreManager.levelProgressManager) {
      const levelId = this.levelMap.currentLevel.id
      const prevProgress = scoreManager.getLevelProgress(levelId)
      isFirstClear = !prevProgress.completed

      canNext = scoreManager.canUnlockNextLevel(levelLoader.currentLevelIndex, stars)

      scoreManager.saveLevelResult(levelId, {
        time: completionTime,
        steps: completionSteps,
        attempts: currentAttempts,
        score: levelScore,
        stars: stars
      })

      scoreManager.rewardItemsForLevel(levelLoader.currentLevelIndex, stars)
    }

    const newlyUnlockedAchievements = scoreManager.checkAchievements({
      isFirstClear,
      allLit,
      attempts: currentAttempts,
      completionTime,
      level: this.levelMap.currentLevel,
      stars,
      maxCombo: scoreManager.maxCombo,
      isStoryComplete: false,
      isDailyComplete: this.levelLoader.isDailyChallenge && this.levelLoader.dailyCompleted
    })

    scoreManager.submitToLeaderboard(levelScore, completionTime)

    this.effects.animateCreatureAlongPath(levelLoader.creature, path, () => {
      this.scene.time.delayedCall(500, () => {
        let showCompleteCallback
        if (this.levelLoader.isDailyChallenge) {
          showCompleteCallback = () => this.showDailyChallengeComplete(levelScore)
        } else if (this.levelLoader.isStoryMode) {
          showCompleteCallback = () => this.handleStoryLevelComplete(levelScore)
        } else if (this.levelLoader.isRandomMode) {
          const curDiff = this.levelMap.currentLevel?.difficulty || 3
          showCompleteCallback = () => this.hintPanel.showLevelComplete(
            levelLoader.currentLevelIndex,
            levelScore,
            () => levelLoader.loadRandomLevel(curDiff),
            false,
            true,
            completionTime,
            false,
            stars,
            completionSteps,
            true,
            scoreManager.maxCombo
          )
        } else if (this.levelLoader.isWorkshopMode) {
          showCompleteCallback = () => this.hintPanel.showLevelComplete(
            -1,
            levelScore,
            () => {
              if (this.onBackToStart) {
                this.onBackToStart()
              }
            },
            false,
            false,
            completionTime,
            true,
            stars,
            completionSteps,
            true,
            scoreManager.maxCombo
          )
        } else {
          showCompleteCallback = () => this.hintPanel.showLevelComplete(
            levelLoader.currentLevelIndex,
            levelScore,
            () => levelLoader.nextLevel(),
            false,
            false,
            completionTime,
            false,
            stars,
            completionSteps,
            canNext,
            scoreManager.maxCombo
          )
        }

        if (newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0) {
          this.showAchievementPopup(newlyUnlockedAchievements, showCompleteCallback)
        } else {
          showCompleteCallback()
        }
        levelLoader.isAnimating = false
      })
    })
  }

  onPathInvalid() {
    this.hintPanel.incrementAttempts()
    if (this.audioManager) {
      this.audioManager.playFailure()
    }
    if (this.levelLoader.creature && this.effects) {
      this.effects.playShakeHead(this.levelLoader.creature)
    }
  }

  handleStoryLevelComplete(levelScore) {
    const levelLoader = this.levelLoader
    const scoreManager = this.scoreManager

    const isLastLevel = levelLoader.currentLevelIndex >= LEVELS.length - 1
    const afterDialogue = getDialogueForLevel(levelLoader.currentLevelIndex, false)

    const completionTime = scoreManager.levelElapsedTime
    const completionSteps = scoreManager.currentLevelSteps
    const currentAttempts = this.hintPanel.getAttempts()

    let stars = 1
    if (this.levelMap.currentLevel && scoreManager.levelProgressManager) {
      stars = scoreManager.calculateStars(
        this.levelMap.currentLevel,
        completionTime,
        completionSteps,
        currentAttempts
      )

      const levelId = this.levelMap.currentLevel.id
      scoreManager.saveLevelResult(levelId, {
        time: completionTime,
        steps: completionSteps,
        attempts: currentAttempts,
        score: levelScore,
        stars: stars
      })
    }

    const proceedToNext = () => {
      if (isLastLevel) {
        this.levelLoader.storyCompleted = true
        const storyAchievements = scoreManager.checkAchievements({
          isFirstClear: false,
          allLit: false,
          attempts: 0,
          completionTime: 0,
          level: null,
          stars: 0,
          maxCombo: 0,
          isStoryComplete: true,
          isDailyComplete: false
        })
        if (storyAchievements && storyAchievements.length > 0) {
          this.showAchievementPopup(storyAchievements, () => this.showStoryComplete())
        } else {
          this.showStoryComplete()
        }
      } else {
        this.hintPanel.showLevelComplete(
          levelLoader.currentLevelIndex,
          levelScore,
          () => levelLoader.nextLevel(),
          true,
          false,
          completionTime,
          false,
          stars,
          completionSteps,
          true,
          scoreManager.maxCombo
        )
      }
    }

    if (afterDialogue) {
      this.levelLoader.showDialogue(afterDialogue, proceedToNext)
    } else if (isLastLevel) {
      this.levelLoader.showDialogue(STORY_DIALOGUES.epilogue, () => {
        this.levelLoader.storyCompleted = true
        const storyAchievements = scoreManager.checkAchievements({
          isFirstClear: false,
          allLit: false,
          attempts: 0,
          completionTime: 0,
          level: null,
          stars: 0,
          maxCombo: 0,
          isStoryComplete: true,
          isDailyComplete: false
        })
        if (storyAchievements && storyAchievements.length > 0) {
          this.showAchievementPopup(storyAchievements, () => this.showStoryComplete())
        } else {
          this.showStoryComplete()
        }
      })
    } else {
      proceedToNext()
    }
  }

  showStoryComplete() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    const scoreManager = this.scoreManager
    const levelLoader = this.levelLoader

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(400)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 420,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xa78bfa, 0.8)
    panel.add(bg)

    const title = this.scene.text(width / 2, height / 2 - 170, '✨ 故事模式通关！', {
      fontSize: '30px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const subtitle = this.scene.text(width / 2, height / 2 - 130, '生命之源已经苏醒', {
      fontSize: '18px',
      fill: '#f472b6'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)

    const scoreInfo = this.scene.text(width / 2, height / 2 - 85, `总得分：${scoreManager.totalScore} 分`, {
      fontSize: '24px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)

    const thanks = this.scene.text(width / 2, height / 2 - 40, '感谢你陪伴洞穴的朋友们度过这段旅程', {
      fontSize: '15px',
      fill: '#e2e8f0',
      align: 'center'
    })
    thanks.setOrigin(0.5)
    panel.add(thanks)

    const lore1 = this.scene.text(width / 2, height / 2 - 5, '🌿 苔藓长老 · 🦋 月光萤 · 🗿 小石灵 · 🌸 花之灵', {
      fontSize: '14px',
      fill: '#60a5fa',
      align: 'center'
    })
    lore1.setOrigin(0.5)
    panel.add(lore1)

    const lore2 = this.scene.text(width / 2, height / 2 + 25, '星辰洞穴将永远铭记你的名字——引路人', {
      fontSize: '15px',
      fill: '#fbbf24',
      align: 'center'
    })
    lore2.setOrigin(0.5)
    panel.add(lore2)

    const restartBtn = this.scene.text(width / 2 - 100, height / 2 + 85, '🔄 重玩故事', {
      fontSize: '16px',
      fill: '#60a5fa',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 20, y: 12 }
    })
    restartBtn.setOrigin(0.5)
    restartBtn.setInteractive({ useHandCursor: true })
    restartBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          levelLoader.currentLevelIndex = 0
          scoreManager.resetTotalScore()
          this.hintPanel.score = 0
          this.levelLoader.storyCompleted = false
          levelLoader.loadLevel(0)
        }
      })
    })
    restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#2d4a6f'))
    restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#1e3a5f'))
    panel.add(restartBtn)

    const backBtn = this.scene.text(width / 2 + 100, height / 2 + 85, '🏠 返回首页', {
      fontSize: '16px',
      fill: '#a78bfa',
      fontStyle: 'bold',
      backgroundColor: '#3b1f5f',
      padding: { x: 20, y: 12 }
    })
    backBtn.setOrigin(0.5)
    backBtn.setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (this.onStoryComplete) {
            this.onStoryComplete(scoreManager.totalScore)
          }
          if (this.onBackToStart) {
            this.scene.time.delayedCall(300, () => {
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
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })

    for (let i = 0; i < 30; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xa78bfa, 0xf472b6, 0x60a5fa, 0x22c55e, 0xfbbf24][Math.floor(Math.random() * 5)]

        this.scene.add.particles(x, y, 'sparkle', {
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

  showDailyChallengeComplete(score) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    const scoreManager = this.scoreManager

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(400)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 380,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.8)
    panel.add(bg)

    const title = this.scene.text(width / 2, height / 2 - 145, '🔥 每日挑战完成！', {
      fontSize: '28px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const scoreInfo = this.scene.text(width / 2, height / 2 - 90, `获得 ${score} 分`, {
      fontSize: '22px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)

    const maxComboInfo = this.scene.text(width / 2, height / 2 - 55, `🔥 最高连击: ${scoreManager.maxCombo} 连`, {
      fontSize: '16px',
      fill: '#f97316',
      fontStyle: 'bold'
    })
    maxComboInfo.setOrigin(0.5)
    panel.add(maxComboInfo)

    const subtitle = this.scene.text(width / 2, height / 2 - 20, '今日挑战已完成，明天再来！', {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)

    const noReplay = this.scene.text(width / 2, height / 2 + 15, '每日挑战仅可完成一次，不可重玩', {
      fontSize: '13px',
      fill: '#f87171'
    })
    noReplay.setOrigin(0.5)
    panel.add(noReplay)

    const streakInfo = this.scene.text(width / 2, height / 2 + 50, '保持连续打卡，解锁更多奖励！', {
      fontSize: '14px',
      fill: '#fbbf24'
    })
    streakInfo.setOrigin(0.5)
    panel.add(streakInfo)

    const rewardHint = this.scene.text(width / 2, height / 2 + 80, '🌟 连续7天 · 特殊徽章 + 主题皮肤', {
      fontSize: '13px',
      fill: '#a78bfa'
    })
    rewardHint.setOrigin(0.5)
    panel.add(rewardHint)

    const closeBtn = this.scene.text(width / 2, height / 2 + 125, '✓ 确认', {
      fontSize: '18px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 30, y: 12 }
    })
    closeBtn.setOrigin(0.5)
    closeBtn.setInteractive({ useHandCursor: true })

    closeBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (this.onDailyComplete) {
            this.onDailyComplete(score)
          }
          if (this.onBackToStart) {
            this.scene.time.delayedCall(300, () => {
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
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })

    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0xf97316, 0xef4444, 0xa78bfa][Math.floor(Math.random() * 4)]

        this.scene.add.particles(x, y, 'sparkle', {
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
    const scoreManager = this.scoreManager
    const levelLoader = this.levelLoader

    this.hintPanel.showGameComplete(scoreManager.totalScore, () => {
      levelLoader.currentLevelIndex = 0
      scoreManager.resetTotalScore()
      this.hintPanel.score = 0
      levelLoader.loadLevel(0)
    })
  }

  showAchievementPopup(achievements, onClose) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(600)

    const panelHeight = 260 + achievements.length * 70

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.75, panelHeight,
      0x0d1117, 0.98
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.9)
    panel.add(bg)

    const title = this.scene.text(width / 2, height / 2 - panelHeight / 2 + 30, '🏆 成就解锁！', {
      fontSize: '24px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const subtitle = this.scene.text(width / 2, height / 2 - panelHeight / 2 + 58, '恭喜你获得了新的成就', {
      fontSize: '13px',
      fill: '#9ca3af'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)

    achievements.forEach((achievement, index) => {
      const itemY = height / 2 - panelHeight / 2 + 100 + index * 70

      const itemBg = this.scene.add.rectangle(
        width / 2, itemY,
        width * 0.62, 58,
        0x1e1b4b, 0.8
      )
      itemBg.setStrokeStyle(2, achievement.color, 0.7)
      panel.add(itemBg)

      const iconText = this.scene.text(width / 2 - width * 0.27, itemY, achievement.icon, {
        fontSize: '32px'
      })
      iconText.setOrigin(0, 0.5)
      panel.add(iconText)

      const nameText = this.scene.text(width / 2 - width * 0.2 + 10, itemY - 10, achievement.name, {
        fontSize: '17px',
        fill: achievement.color,
        fontStyle: 'bold'
      })
      nameText.setOrigin(0, 0.5)
      panel.add(nameText)

      const descText = this.scene.text(width / 2 - width * 0.2 + 10, itemY + 12, achievement.description, {
        fontSize: '12px',
        fill: '#9ca3af'
      })
      descText.setOrigin(0, 0.5)
      panel.add(descText)
    })

    const btnY = height / 2 + panelHeight / 2 - 38
    const continueBtn = this.scene.text(width / 2, btnY, '继续', {
      fontSize: '17px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 35, y: 12 }
    })
    continueBtn.setOrigin(0.5)
    continueBtn.setInteractive({ useHandCursor: true })
    continueBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        scale: 0.9,
        duration: 250,
        ease: 'Cubic.In',
        onComplete: () => {
          panel.destroy()
          if (onClose) onClose()
        }
      })
    })
    continueBtn.on('pointerover', () => continueBtn.setBackgroundColor('#b45309'))
    continueBtn.on('pointerout', () => continueBtn.setBackgroundColor('#92400e'))
    panel.add(continueBtn)

    panel.setAlpha(0)
    panel.setScale(0.85)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.out'
    })

    if (this.audioManager) {
      this.audioManager.playSuccess(3)
    }

    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0xf59e0b, 0xa78bfa, 0x22c55e, 0x60a5fa][Math.floor(Math.random() * 5)]
        this.scene.add.particles(x, y, 'sparkle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 900,
          tint: color,
          quantity: 8,
          duration: 300
        })
      })
    }
  }

  createItemButton() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    if (this.itemButton) {
      if (this.itemButton.bg) this.itemButton.bg.destroy()
      if (this.itemButton.icon) this.itemButton.icon.destroy()
      if (this.itemButton.name) this.itemButton.name.destroy()
      if (this.itemButton.count) this.itemButton.count.destroy()
      this.itemButton = null
    }

    const selectedItem = this.levelLoader.levelCarriedItem
    if (!selectedItem) return

    const itemConfig = ITEM_CONFIG[selectedItem]
    const itemCount = this.itemManager.getItemCount(selectedItem)

    if (itemCount <= 0) return

    const btnX = 70
    const btnY = height - 40
    const btnW = 110
    const btnH = 44

    const itemBtnBg = this.scene.add.rectangle(btnX, btnY, btnW, btnH, 0x1e3a5f, 0.95)
    itemBtnBg.setStrokeStyle(3, itemConfig.color, 0.9)
    itemBtnBg.setDepth(101)
    itemBtnBg.setInteractive(new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains)
    if (itemBtnBg.input) itemBtnBg.input.cursor = 'pointer'

    const iconText = this.scene.text(btnX - 30, btnY, itemConfig.icon, {
      fontSize: '20px'
    })
    iconText.setOrigin(0.5)
    iconText.setDepth(102)

    const nameText = this.scene.text(btnX + 10, btnY - 6, itemConfig.name, {
      fontSize: '13px',
      fill: itemConfig.color,
      fontStyle: 'bold'
    })
    nameText.setOrigin(0, 0.5)
    nameText.setDepth(102)

    const countText = this.scene.text(btnX + 10, btnY + 10, `x${itemCount}`, {
      fontSize: '11px',
      fill: '#9ca3af'
    })
    countText.setOrigin(0, 0.5)
    countText.setDepth(102)

    itemBtnBg.on('pointerdown', () => {
      this.activateItemMode()
    })

    itemBtnBg.on('pointerover', () => {
      itemBtnBg.setFillStyle(0x2563eb, 0.95)
    })
    itemBtnBg.on('pointerout', () => {
      if (this.levelLoader.isItemMode) {
        itemBtnBg.setFillStyle(0x166534, 0.95)
      } else {
        itemBtnBg.setFillStyle(0x1e3a5f, 0.95)
      }
    })

    this.itemButton = {
      bg: itemBtnBg,
      icon: iconText,
      name: nameText,
      count: countText
    }
  }

  activateItemMode() {
    const levelLoader = this.levelLoader
    if (levelLoader.isAnimating || levelLoader.isTutorialMode) return

    const selectedItem = levelLoader.levelCarriedItem
    if (!selectedItem || this.itemManager.getItemCount(selectedItem) <= 0) return

    if (selectedItem === ITEM_TYPES.PATH_HINT) {
      this.usePathHintItem()
    } else if (selectedItem === ITEM_TYPES.OBSTACLE_CLEAR) {
      this.activateObstacleClearMode()
    }
  }

  usePathHintItem() {
    const levelLoader = this.levelLoader
    if (levelLoader.hintUsed) return
    if (levelLoader.levelCarriedItem !== ITEM_TYPES.PATH_HINT) return
    if (this.itemManager.getItemCount(levelLoader.levelCarriedItem) <= 0) return

    this.itemManager.useItem(levelLoader.levelCarriedItem)
    levelLoader.hintUsed = true

    const level = this.levelMap.currentLevel
    const correctPaths = level.correctPaths || [{ path: level.correctPath }]
    const randomPathInfo = correctPaths[Math.floor(Math.random() * correctPaths.length)]
    const correctPath = Array.isArray(randomPathInfo) ? randomPathInfo : randomPathInfo.path

    if (!correctPath || correctPath.length === 0) return

    const midIndex = Math.floor(correctPath.length / 2)
    const hintCell = this.levelMap.getCellAt(correctPath[midIndex].row, correctPath[midIndex].col)

    if (hintCell && hintCell.sprite) {
      const originalFill = hintCell.sprite.fillColor
      const originalStroke = hintCell.sprite.strokeColor

      let flashCount = 0
      const flashInterval = this.scene.time.addEvent({
        delay: 300,
        callback: () => {
          flashCount++
          if (flashCount % 2 === 1) {
            hintCell.sprite.setFillStyle(0xfbbf24, 0.6)
            hintCell.sprite.setStrokeStyle(3, 0xfbbf24, 1)
          } else {
            hintCell.sprite.setFillStyle(originalFill, 0.6)
            hintCell.sprite.setStrokeStyle(1, originalStroke, 0.5)
          }

          if (flashCount >= 6) {
            flashInterval.remove()
            if (!hintCell.isOnPath) {
              hintCell.sprite.setFillStyle(originalFill, 0.6)
              hintCell.sprite.setStrokeStyle(1, originalStroke, 0.5)
            }
          }
        },
        loop: true
      })

      const pos = this.levelMap.getWorldPosition(hintCell.row, hintCell.col)
      const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
        speed: { min: 30, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        tint: 0xfbbf24,
        quantity: 15,
        duration: 500
      })
    }

    if (this.audioManager) {
      this.audioManager.playSuccess(1)
    }

    this.updateItemButtonDisplay()

    this.showItemUseNotification('路径提示', '已标记正确路径中的一格')
  }

  activateObstacleClearMode() {
    const levelLoader = this.levelLoader
    if (levelLoader.obstacleCleared) return
    if (levelLoader.levelCarriedItem !== ITEM_TYPES.OBSTACLE_CLEAR) return
    if (this.itemManager.getItemCount(levelLoader.levelCarriedItem) <= 0) return

    levelLoader.isItemMode = true

    if (this.itemButton && this.itemButton.bg) {
      this.itemButton.bg.setFillStyle(0x166534, 0.95)
    }

    this.showItemUseNotification('障碍消除', '点击一个障碍物来消除它')

    this.scene.input.once('pointerdown', this.handleObstacleClearClick, this)
  }

  handleObstacleClearClick(pointer) {
    const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)

    const clearableTypes = ['rock', 'thorn', 'ice']

    if (!cell || !cell.isObstacle || !clearableTypes.includes(cell.obstacleType)) {
      this.levelLoader.isItemMode = false
      if (this.itemButton && this.itemButton.bg) {
        this.itemButton.bg.setFillStyle(0x1e3a5f, 0.95)
      }
      return
    }

    this.clearObstacle(cell)
  }

  clearObstacle(cell) {
    const levelLoader = this.levelLoader
    if (levelLoader.obstacleCleared) return
    if (levelLoader.levelCarriedItem !== ITEM_TYPES.OBSTACLE_CLEAR) return
    if (this.itemManager.getItemCount(levelLoader.levelCarriedItem) <= 0) return

    this.itemManager.useItem(levelLoader.levelCarriedItem)
    levelLoader.obstacleCleared = true
    levelLoader.isItemMode = false

    const result = this.levelMap.removeObstacle(cell.row, cell.col)

    if (!result) return

    const pos = result.worldPosition
    const obsRendered = this.levelMap.renderedElements.obstacles.find(
      obs => obs.getData && obs.getData('obstacle')?.row === cell.row && obs.getData('obstacle')?.col === cell.col
    )

    if (obsRendered) {
      this.scene.tweens.add({
        targets: obsRendered,
        scale: 0,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.In',
        onComplete: () => {
          obsRendered.destroy()
        }
      })
    }

    const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      tint: [0xf97316, 0xfbbf24, 0xef4444],
      quantity: 25,
      duration: 400,
      blendMode: 'ADD'
    })

    this.scene.cameras.main.shake(200, 0.005)

    if (result.cellSprite) {
      result.cellSprite.setAlpha(0)
      result.cellSprite.setScale(0.5)
      this.scene.tweens.add({
        targets: result.cellSprite,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.out'
      })
    }

    if (this.audioManager) {
      this.audioManager.playSuccess(2)
    }

    this.updateItemButtonDisplay()

    this.scene.time.delayedCall(500, () => {
      this.showItemUseNotification('障碍消除成功', '障碍物已被消除')
    })
  }

  showItemUseNotification(title, message) {
    const width = this.scene.game.config.width

    const notify = this.scene.add.container(0, 0)
    notify.setDepth(400)

    const bg = this.scene.add.rectangle(
      width / 2, 100,
      280, 70,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(2, 0x22c55e, 0.9)
    notify.add(bg)

    const titleText = this.scene.text(width / 2, 88, `✨ ${title}`, {
      fontSize: '16px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    titleText.setOrigin(0.5)
    notify.add(titleText)

    const msgText = this.scene.text(width / 2, 112, message, {
      fontSize: '13px',
      fill: '#9ca3af',
      align: 'center'
    })
    msgText.setOrigin(0.5)
    notify.add(msgText)

    notify.setAlpha(0)
    notify.setScale(0.8)

    this.scene.tweens.add({
      targets: notify,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.out'
    })

    this.scene.tweens.add({
      targets: notify,
      alpha: 0,
      scale: 0.9,
      duration: 300,
      ease: 'Cubic.In',
      delay: 2000,
      onComplete: () => {
        notify.destroy()
      }
    })
  }

  updateItemButtonDisplay() {
    if (!this.itemButton) {
      this.createItemButton()
      return
    }

    const selectedItem = this.levelLoader.levelCarriedItem
    if (!selectedItem) {
      if (this.itemButton) {
        if (this.itemButton.bg) this.itemButton.bg.destroy()
        if (this.itemButton.icon) this.itemButton.icon.destroy()
        if (this.itemButton.name) this.itemButton.name.destroy()
        if (this.itemButton.count) this.itemButton.count.destroy()
        this.itemButton = null
      }
      return
    }

    const itemCount = this.itemManager.getItemCount(selectedItem)
    if (this.itemButton.count) {
      this.itemButton.count.setText(`x${itemCount}`)
    }

    if (itemCount <= 0) {
      if (this.itemButton) {
        if (this.itemButton.bg) this.itemButton.bg.destroy()
        if (this.itemButton.icon) this.itemButton.icon.destroy()
        if (this.itemButton.name) this.itemButton.name.destroy()
        if (this.itemButton.count) this.itemButton.count.destroy()
        this.itemButton = null
      }
    }
  }

  onBossDamage(remainingHp) {
    const levelLoader = this.levelLoader
    levelLoader.isAnimating = false

    if (this.pathJudge) {
      this.pathJudge.resetPath()
    }

    this.scene.tweens.killAllTweensOf(levelLoader.creature)

    const startPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.start.row,
      this.levelMap.currentLevel.start.col
    )

    if (levelLoader.creature) {
      this.scene.tweens.add({
        targets: levelLoader.creature,
        x: startPos.x,
        y: startPos.y,
        angle: 0,
        alpha: 1,
        duration: 400,
        ease: 'Cubic.out',
        onComplete: () => {
          this.bossLevelManager.setCreature(levelLoader.creature)
        }
      })
    }
  }

  onBossGameOver() {
    const levelLoader = this.levelLoader
    levelLoader.isAnimating = true

    if (this.pathJudge) {
      this.pathJudge.resetPath()
    }

    this.scene.tweens.killAllTweensOf(levelLoader.creature)

    if (this.bossLevelManager) {
      this.bossLevelManager.pause()
      this.bossLevelManager.showBossGameOver(
        () => {
          this.bossLevelManager.deactivate()
          levelLoader.loadLevel(levelLoader.currentLevelIndex)
        },
        () => {
          this.bossLevelManager.deactivate()
          levelLoader.isBossLevel = false
          if (this.onBackToStart) {
            this.onBackToStart()
          }
        }
      )
    }
  }

  destroy() {
    if (this.itemButton) {
      if (this.itemButton.bg) this.itemButton.bg.destroy()
      if (this.itemButton.icon) this.itemButton.icon.destroy()
      if (this.itemButton.name) this.itemButton.name.destroy()
      if (this.itemButton.count) this.itemButton.count.destroy()
      this.itemButton = null
    }
  }
}
