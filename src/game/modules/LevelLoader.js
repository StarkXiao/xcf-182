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
    this.onGameComplete = null
    this.onPathComplete = null
    this.onPathInvalid = null
    this.onHistoryChange = null
    this.onBossDamage = null
    this.onBossGameOver = null
    this.onStartLevelTimer = null
    this.onPauseLevelTimer = null
    this.onResumeLevelTimer = null
    this.onReset = null
    this.onCreateItemButton = null
    this.onShowItemUseNotification = null
    this.onShowLockNotification = null
    this.onShowLevelIntro = null
    this.onShowDialogue = null

    this.levelCarriedItem = null
    this.hintUsed = false
    this.obstacleCleared = false
    this.isItemMode = false
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
        if (this.onBackToStart) this.onBackToStart()
        return
      }
      this._setupLevelAfterLoad(level, -1)
    })
  }

  loadLevel(levelIndex) {
    const isNormalMode = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode && !this.isStoryMode

    if (isNormalMode && this.levelProgressManager) {
      if (!this.levelProgressManager.isLevelUnlocked(levelIndex)) {
        if (this.onShowLockNotification) {
          this.onShowLockNotification(levelIndex)
        }
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
        if (this.onGameComplete) this.onGameComplete()
        return
      }
      this._setupLevelAfterLoad(level, levelIndex)
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

    if (this.isDailyChallenge) this.hintPanel.setDailyChallengeMode(true)
    if (this.isStoryMode) this.hintPanel.setStoryMode(true)
    if (this.isRandomMode) this.hintPanel.setRandomMode(true, level)
    if (this.isWorkshopMode) this.hintPanel.setWorkshopMode(true, level)

    this.hintPanel.onReset = () => {
      if (this.onReset) {
        this.onReset()
      } else {
        this.resetLevel()
      }
    }
    this.hintPanel.onShowHint = () => {
      if (this.pathJudge) this.pathJudge.showHint()
    }
    this.hintPanel.onNextRandom = (diff) => this.loadRandomLevel(diff)
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

    if (this.onStartLevelTimer) this.onStartLevelTimer()

    const shouldShowTutorial = levelIndex === 0 &&
      !this.isDailyChallenge &&
      !this.isRandomMode &&
      Tutorial.shouldShowTutorial()

    if (shouldShowTutorial) {
      this.isTutorialMode = true
      if (this.onPauseLevelTimer) this.onPauseLevelTimer()
      if (this.onShowLevelIntro) this.onShowLevelIntro(level)
      this.scene.time.delayedCall(2500, () => this.startTutorial())
    } else if (this.isStoryMode && levelIndex >= 0) {
      const beforeDialogue = getDialogueForLevel(levelIndex, true)
      if (beforeDialogue) {
        if (this.onShowDialogue) {
          this.onShowDialogue(beforeDialogue, () => {
            if (this.onShowLevelIntro) this.onShowLevelIntro(level)
            this.isAnimating = false
          })
        }
      } else {
        if (this.onShowLevelIntro) this.onShowLevelIntro(level)
        this.isAnimating = false
      }
    } else if (this.isBossLevel && this.bossLevelManager) {
      this.isAnimating = true
      if (this.onShowLevelIntro) this.onShowLevelIntro(level)
      this.bossLevelManager.showBossIntro(() => {
        this.isAnimating = false
      })
    } else {
      if (this.onShowLevelIntro) this.onShowLevelIntro(level)
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
        if (this.onShowLockNotification) {
          this.onShowLockNotification(nextIndex)
        }
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
