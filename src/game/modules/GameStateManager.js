import { LEVELS } from '../data/levels.js'
import { STORY_DIALOGUES, getDialogueForLevel } from '../data/story.js'
import { AudioManager } from './AudioManager.js'

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
    this.popupManager = dependencies.popupManager
    this.itemSystem = dependencies.itemSystem

    this.onDailyComplete = null
    this.onStoryComplete = null
    this.onBackToStart = null

    this.audioManager = AudioManager.getInstance()

    if (this.itemSystem) {
      this.itemSystem.onShowItemUseNotification = (title, message) => {
        if (this.popupManager) {
          this.popupManager.showItemUseNotification(title, message)
        }
      }
    }
  }

  setModeConfig(config) {
    this.onDailyComplete = config.onDailyComplete || null
    this.onStoryComplete = config.onStoryComplete || null
    this.onBackToStart = config.onBackToStart || null
  }

  onPathComplete(path, branchId = null) {
    const levelLoader = this.levelLoader
    const scoreManager = this.scoreManager
    const popupManager = this.popupManager

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

    const isNormalMode = !levelLoader.isDailyChallenge && !levelLoader.isStoryMode && !levelLoader.isRandomMode && !levelLoader.isWorkshopMode
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
      isDailyComplete: levelLoader.isDailyChallenge && levelLoader.dailyCompleted
    })

    scoreManager.submitToLeaderboard(levelScore, completionTime)

    this.effects.animateCreatureAlongPath(levelLoader.creature, path, () => {
      this.scene.time.delayedCall(500, () => {
        const showCompleteCallback = this._getCompleteCallback(levelScore, stars, completionTime, completionSteps, canNext)

        if (newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0) {
          popupManager.showAchievementPopup(newlyUnlockedAchievements, showCompleteCallback)
        } else {
          showCompleteCallback()
        }
        levelLoader.isAnimating = false
      })
    })
  }

  _getCompleteCallback(levelScore, stars, completionTime, completionSteps, canNext) {
    const levelLoader = this.levelLoader
    const popupManager = this.popupManager
    const scoreManager = this.scoreManager

    if (levelLoader.isDailyChallenge) {
      return () => {
        popupManager.showDailyChallengeComplete(levelScore, scoreManager.maxCombo, {
          onClose: () => {
            if (this.onDailyComplete) this.onDailyComplete(levelScore)
            if (this.onBackToStart) {
              this.scene.time.delayedCall(300, () => this.onBackToStart())
            }
          }
        })
      }
    }

    if (levelLoader.isStoryMode) {
      return () => this.handleStoryLevelComplete(levelScore)
    }

    if (levelLoader.isRandomMode) {
      const curDiff = this.levelMap.currentLevel?.difficulty || 3
      return () => this.hintPanel.showLevelComplete(
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
    }

    if (levelLoader.isWorkshopMode) {
      return () => this.hintPanel.showLevelComplete(
        -1,
        levelScore,
        () => {
          if (this.onBackToStart) this.onBackToStart()
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
    }

    return () => this.hintPanel.showLevelComplete(
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
    const popupManager = this.popupManager

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

    const showStoryCompleteFinal = () => {
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
      const doShow = () => popupManager.showStoryComplete(scoreManager.totalScore, {
        onRestart: () => {
          levelLoader.currentLevelIndex = 0
          scoreManager.resetTotalScore()
          this.hintPanel.score = 0
          levelLoader.storyCompleted = false
          levelLoader.loadLevel(0)
        },
        onBack: () => {
          if (this.onStoryComplete) this.onStoryComplete(scoreManager.totalScore)
          if (this.onBackToStart) {
            this.scene.time.delayedCall(300, () => this.onBackToStart())
          }
        }
      })

      if (storyAchievements && storyAchievements.length > 0) {
        popupManager.showAchievementPopup(storyAchievements, doShow)
      } else {
        doShow()
      }
    }

    const proceedToNext = () => {
      if (isLastLevel) {
        levelLoader.storyCompleted = true
        showStoryCompleteFinal()
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
      this._showDialogue(afterDialogue, proceedToNext)
    } else if (isLastLevel) {
      this._showDialogue(STORY_DIALOGUES.epilogue, () => {
        levelLoader.storyCompleted = true
        showStoryCompleteFinal()
      })
    } else {
      proceedToNext()
    }
  }

  _showDialogue(dialogues, onComplete) {
    this.scene.scene.pause()
    this.scene.scene.launch('DialogueScene', {
      dialogues: dialogues,
      onComplete: onComplete
    })
  }

  showGameComplete() {
    const levelLoader = this.levelLoader
    const scoreManager = this.scoreManager

    this.hintPanel.showGameComplete(scoreManager.totalScore, () => {
      levelLoader.currentLevelIndex = 0
      scoreManager.resetTotalScore()
      this.hintPanel.score = 0
      levelLoader.loadLevel(0)
    })
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
  }
}
