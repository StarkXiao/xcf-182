import { LEVELS } from '../data/levels.js'
import { getDialogueForLevel } from '../data/story.js'
import { BossLevelManager } from './BossLevelManager.js'
import { Tutorial } from './Tutorial.js'
import { getLevelProgressManager } from './LevelProgress.js'
import { getItemManager, ITEM_CONFIG } from './ItemManager.js'

export class LevelLoader {
  constructor(scene, dependencies) {
    this.scene = scene
    this.levelMap = dependencies.levelMap
    this.plantState = dependencies.plantState
    this.pathJudge = dependencies.pathJudge
    this.hintPanel = dependencies.hintPanel
    this.effects = dependencies.effects
    this.bossLevelManager = dependencies.bossLevelManager

    this.currentLevelIndex = 0
    this.creature = null
    this.isAnimating = false
    this.isBossLevel = false
    this.isTutorialMode = false
    this.tutorial = null

    this.isDailyChallenge = false
    this.dailyLevel = null
    this.dailyCompleted = false
    this.isStoryMode = false
    this.storyCompleted = false
    this.isRandomMode = false
    this.randomDifficulty = 3
    this.randomSeed = null
    this.isWorkshopMode = false
    this.workshopLevel = null

    this.levelProgressManager = getLevelProgressManager()
    this.itemManager = getItemManager()

    this.onLevelLoaded = null
    this.onBackToStart = null
    this.onDailyComplete = null
    this.onStoryComplete = null
    this.onPathComplete = null
    this.onPathInvalid = null
    this.onHistoryChange = null
    this.onBossDamage = null
    this.onBossGameOver = null

    this.levelCarriedItem = null
    this.hintUsed = false
    this.obstacleCleared = false
    this.isItemMode = false

    this.onReset = null
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

  setRandomModeConfig(config) {
    this.isRandomMode = config.isRandomMode || false
    this.randomDifficulty = config.difficulty || 3
    this.randomSeed = config.seed || null
    this.onBackToStart = config.onBackToStart || null
  }

  setWorkshopConfig(config) {
    this.isWorkshopMode = config.isWorkshopMode || false
    this.workshopLevel = config.workshopLevel || null
    this.onBackToStart = config.onBackToStart || null
  }

  init() {
    if (this.isDailyChallenge && this.dailyLevel) {
      this.levelMap.setDailyLevel(this.dailyLevel)
    }

    if (this.isWorkshopMode && this.workshopLevel) {
      this.levelMap.setWorkshopLevel(this.workshopLevel)
    }

    if (this.isRandomMode) {
      this.loadRandomLevel(this.randomDifficulty, this.randomSeed)
    } else if (this.isWorkshopMode) {
      this.loadWorkshopLevel()
    } else {
      const isNormalMode = !this.isDailyChallenge && !this.isStoryMode
      let startLevel = this.currentLevelIndex
      if (isNormalMode && this.levelProgressManager) {
        const highestUnlocked = this.levelProgressManager.getHighestUnlockedIndex()
        startLevel = Math.min(this.currentLevelIndex, highestUnlocked)
        if (startLevel !== this.currentLevelIndex) {
          this.currentLevelIndex = startLevel
        }
      }
      this.loadLevel(startLevel)
    }
  }

  loadRandomLevel(difficulty = 3, seed = null) {
    this.isAnimating = true
    this.isRandomMode = true
    this.isBossLevel = false

    if (this.bossLevelManager) this.bossLevelManager.deactivate()

    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }

    this.effects.createLevelTransition(() => {
      this.scene.children.removeAll()

      this.effects.init()

      const level = this.levelMap.loadRandomLevel(difficulty, seed)
      this._setupLevelAfterLoad(level)
    })
  }

  loadWorkshopLevel() {
    this.isAnimating = true
    this.isWorkshopMode = true
    this.isBossLevel = false

    if (this.bossLevelManager) this.bossLevelManager.deactivate()

    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }

    this.effects.createLevelTransition(() => {
      this.scene.children.removeAll()

      this.effects.init()

      const level = this.levelMap.loadWorkshopLevel()
      if (!level) {
        if (this.onBackToStart) {
          this.onBackToStart()
        }
        return
      }

      this._setupLevelAfterLoad(level, -1)
    })
  }

  loadLevel(levelIndex) {
    const isNormalMode = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode && !this.isStoryMode

    if (isNormalMode && this.levelProgressManager) {
      if (!this.levelProgressManager.isLevelUnlocked(levelIndex)) {
        this.showLockNotification(levelIndex)
        const fallbackIndex = Math.max(0, this.levelProgressManager.getHighestUnlockedIndex())
        if (fallbackIndex !== levelIndex) {
          this.scene.time.delayedCall(500, () => {
            this.loadLevel(fallbackIndex)
          })
        }
        return
      }
    }

    this.isAnimating = true
    this.isRandomMode = false

    if (this.bossLevelManager) this.bossLevelManager.deactivate()

    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }

    this.effects.createLevelTransition(() => {
      this.scene.children.removeAll()

      this.effects.init()

      const level = this.levelMap.loadLevel(levelIndex)
      if (!level) {
        if (this.onGameComplete) {
          this.onGameComplete()
        }
        return
      }

      this._setupLevelAfterLoad(level, levelIndex)
    })
  }

  showLockNotification(levelIndex) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const levelNum = levelIndex + 1
    const prevLevelNum = levelIndex
    let lockMsg = `🔒 第 ${levelNum} 关未解锁`
    let hintMsg = `完成第 ${prevLevelNum} 关并获得至少1星后解锁`

    const notify = this.scene.add.container(0, 0)
    notify.setDepth(500)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.7, 160,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xef4444, 0.9)
    notify.add(bg)

    const icon = this.scene.text(width / 2, height / 2 - 40, '🔒', {
      fontSize: '36px'
    })
    icon.setOrigin(0.5)
    notify.add(icon)

    const title = this.scene.text(width / 2, height / 2 + 5, lockMsg, {
      fontSize: '20px',
      fill: '#ef4444',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    notify.add(title)

    const hint = this.scene.text(width / 2, height / 2 + 38, hintMsg, {
      fontSize: '14px',
      fill: '#9ca3af',
      align: 'center'
    })
    hint.setOrigin(0.5)
    notify.add(hint)

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
      delay: 2200,
      onComplete: () => {
        notify.destroy()
      }
    })
  }

  _setupLevelAfterLoad(level, levelIndex = -1) {
    this.levelMap.render()
    this.plantState.init()
    this.pathJudge.init()

    if (this.hintPanel) {
      this.hintPanel.updateCombo(0, 0)
    }

    const hasExistingScore = this.hintPanel && this.hintPanel.getScore() > 0
    this.hintPanel.init(hasExistingScore)
    this.hintPanel.setCurrentLevelIndex(levelIndex >= 0 ? levelIndex : this.currentLevelIndex)
    this.hintPanel.reset()
    this.hintPanel.updateSteps(0)

    if (this.isDailyChallenge) {
      this.hintPanel.setDailyChallengeMode(true)
    }

    if (this.isStoryMode) {
      this.hintPanel.setStoryMode(true)
    }

    if (this.isRandomMode) {
      this.hintPanel.setRandomMode(true, level)
    }

    if (this.isWorkshopMode) {
      this.hintPanel.setWorkshopMode(true, level)
    }

    this.hintPanel.onReset = () => {
      if (this.onReset) {
        this.onReset()
      } else {
        this.resetLevel()
      }
    }
    this.hintPanel.onShowHint = () => {
      if (this.pathJudge) {
        this.pathJudge.showHint()
      }
    }

    this.hintPanel.onNextRandom = (diff) => {
      this.loadRandomLevel(diff)
    }

    this.hintPanel.onUndo = () => this.handleUndo()
    this.hintPanel.onRedo = () => this.handleRedo()

    this.pathJudge.onPathComplete = (path, branchId) => {
      if (this.onPathComplete) this.onPathComplete(path, branchId)
    }
    this.pathJudge.onPathInvalid = () => {
      if (this.onPathInvalid) this.onPathInvalid()
    }
    this.pathJudge.onHistoryChange = (canUndo, canRedo) => {
      if (this.hintPanel) {
        this.hintPanel.updateUndoRedoButtons(canUndo, canRedo)
      }
      if (this.pathJudge && this.hintPanel) {
        const pathLen = Math.max(0, this.pathJudge.getPathLength() - 1)
        if (this.onHistoryChange) this.onHistoryChange(pathLen)
      }
    }

    this.refreshUndoRedoButtons()

    this.hintUsed = false
    this.obstacleCleared = false
    this.isItemMode = false

    const selectedItem = this.itemManager.getSelectedItem()
    if (selectedItem && this.itemManager.getItemCount(selectedItem) > 0) {
      this.levelCarriedItem = selectedItem
    } else {
      this.levelCarriedItem = null
    }

    if (this.onCreateItemButton) {
      this.onCreateItemButton()
    }

    if (this.levelCarriedItem) {
      const itemConfig = ITEM_CONFIG[this.levelCarriedItem]
      this.scene.time.delayedCall(800, () => {
        if (this.onShowItemUseNotification) {
          this.onShowItemUseNotification(
            '本关携带道具',
            `${itemConfig.icon} ${itemConfig.name} - ${itemConfig.description}`
          )
        }
      })
    }

    const startPos = this.levelMap.getWorldPosition(level.start.row, level.start.col)
    this.creature = this.effects.createCreatureSprite(startPos.x, startPos.y)
    this.creature.setDepth(100)

    this.isBossLevel = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode &&
      BossLevelManager.isBossLevel(levelIndex, level)

    if (this.isBossLevel && this.bossLevelManager) {
      this.bossLevelManager.activate(level, levelIndex, this.creature)
      this.bossLevelManager.onDamage = (remainingHp) => {
        if (this.onBossDamage) this.onBossDamage(remainingHp)
      }
      this.bossLevelManager.onGameOver = () => {
        if (this.onBossGameOver) this.onBossGameOver()
      }
    }

    if (this.onStartLevelTimer) {
      this.onStartLevelTimer()
    }

    const shouldShowTutorial = levelIndex === 0 &&
      !this.isDailyChallenge &&
      !this.isRandomMode &&
      Tutorial.shouldShowTutorial()

    if (shouldShowTutorial) {
      this.isTutorialMode = true
      if (this.onPauseLevelTimer) this.onPauseLevelTimer()

      this.showLevelIntro(level)

      this.scene.time.delayedCall(2500, () => {
        this.startTutorial()
      })
    } else if (this.isStoryMode && levelIndex >= 0) {
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
    } else if (this.isBossLevel && this.bossLevelManager) {
      this.isAnimating = true
      this.showLevelIntro(level)
      this.bossLevelManager.showBossIntro(() => {
        this.isAnimating = false
      })
    } else {
      this.showLevelIntro(level)
      this.isAnimating = false
    }

    if (this.onLevelLoaded) {
      this.onLevelLoaded(level, levelIndex)
    }
  }

  startTutorial() {
    if (!this.tutorial) {
      this.tutorial = new Tutorial(
        this.scene,
        this.levelMap,
        this.pathJudge,
        this.plantState,
        this.effects
      )
    }

    this.tutorial.start(() => {
      this.isTutorialMode = false
      this.isAnimating = false
      if (this.onResumeLevelTimer) this.onResumeLevelTimer()
    })
  }

  showDialogue(dialogues, onComplete) {
    this.scene.scene.pause()
    this.scene.scene.launch('DialogueScene', {
      dialogues: dialogues,
      onComplete: onComplete
    })
  }

  showLevelIntro(level) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const levelLabel = this.isStoryMode ? `第 ${level.id} 章` : ''
    const titleText = this.isDailyChallenge
      ? `${level.name} 🔥`
      : this.isStoryMode
        ? `${levelLabel} · ${level.name}`
        : this.isBossLevel
          ? `👹 BOSS · ${level.name}`
          : level.name
    const titleFill = this.isDailyChallenge
      ? '#fbbf24'
      : this.isStoryMode
        ? '#a78bfa'
        : this.isBossLevel
          ? '#ef4444'
          : '#60a5fa'

    const intro = this.scene.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '32px',
      fill: titleFill,
      fontStyle: 'bold'
    })
    intro.setOrigin(0.5)
    intro.setDepth(200)
    intro.setAlpha(0)

    const desc = this.scene.text(width / 2, height / 2 - 50, level.description, {
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
    } else if (this.isBossLevel) {
      challengeLabel = '👹 BOSS 关 · 小心移动障碍物，三次机会通关'
    }

    const instructionFill = this.isDailyChallenge
      ? '#fbbf24'
      : this.isStoryMode
        ? '#a78bfa'
        : this.isBossLevel
          ? '#ef4444'
          : '#9ca3af'

    const instruction = this.scene.text(width / 2, height / 2, challengeLabel, {
      fontSize: '14px',
      fill: instructionFill
    })
    instruction.setOrigin(0.5)
    instruction.setDepth(200)
    instruction.setAlpha(0)

    this.scene.tweens.add({
      targets: [intro, desc, instruction],
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Cubic.out',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
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

  handleUndo() {
    if (this.isAnimating || this.isTutorialMode) return
    if (this.pathJudge && this.pathJudge.undo()) {
      this.refreshUndoRedoButtons()
    }
  }

  handleRedo() {
    if (this.isAnimating || this.isTutorialMode) return
    if (this.pathJudge && this.pathJudge.redo()) {
      this.refreshUndoRedoButtons()
    }
  }

  refreshUndoRedoButtons() {
    if (this.hintPanel && this.pathJudge) {
      this.hintPanel.updateUndoRedoButtons(
        this.pathJudge.canUndo(),
        this.pathJudge.canRedo()
      )
    }
  }

  resetLevel() {
    if (this.isAnimating || this.isTutorialMode) return
    if (this.isDailyChallenge && this.dailyCompleted) return
    if (this.isStoryMode && this.storyCompleted) return

    this.pathJudge.resetPath()
    this.refreshUndoRedoButtons()

    const startPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.start.row,
      this.levelMap.currentLevel.start.col
    )

    if (this.creature) {
      this.scene.tweens.add({
        targets: this.creature,
        x: startPos.x,
        y: startPos.y,
        angle: 0,
        duration: 300,
        ease: 'Cubic.out'
      })
    }
  }

  nextLevel() {
    const nextIndex = this.currentLevelIndex + 1
    const isNormalMode = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode

    if (isNormalMode && this.levelProgressManager && nextIndex < LEVELS.length) {
      if (!this.levelProgressManager.isLevelUnlocked(nextIndex)) {
        this.showLockNotification(nextIndex)
        return
      }
    }

    this.currentLevelIndex = nextIndex
    if (this.currentLevelIndex >= LEVELS.length) {
      if (this.isStoryMode) {
        this.storyCompleted = true
        if (this.onStoryComplete) this.onStoryComplete()
      } else {
        if (this.onGameComplete) this.onGameComplete()
      }
    } else {
      this.loadLevel(this.currentLevelIndex)
    }
  }

  destroy() {
    if (this.tutorial) this.tutorial.destroy()
    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }
  }
}
