import { LEVELS } from '../data/levels.js'
import { getLeaderboardService } from './LeaderboardService.js'
import { getLevelProgressManager } from './LevelProgress.js'
import { getItemManager } from './ItemManager.js'
import { checkLevelAchievements } from './AchievementManager.js'

export class ScoreManager {
  constructor(scene, dependencies) {
    this.scene = scene
    this.levelMap = dependencies.levelMap
    this.plantState = dependencies.plantState
    this.hintPanel = dependencies.hintPanel

    this.totalScore = 0
    this.currentLevelSteps = 0
    this.currentCombo = 0
    this.maxCombo = 0
    this.lastPlantType = null
    this.comboScore = 0
    this.thornDamage = 0

    this.levelStartTime = 0
    this.levelElapsedTime = 0
    this.timerEvent = null
    this.isLevelActive = false

    this.isDailyChallenge = false
    this.isRandomMode = false
    this.isWorkshopMode = false
    this.isStoryMode = false
    this.dailyLevel = null
    this.currentLevelIndex = 0

    this.leaderboardService = getLeaderboardService()
    this.levelProgressManager = getLevelProgressManager()
    this.itemManager = getItemManager()

    this.onScoreUpdate = null
    this.onComboUpdate = null
  }

  setModeConfig(config) {
    this.isDailyChallenge = config.isDailyChallenge || false
    this.isRandomMode = config.isRandomMode || false
    this.isWorkshopMode = config.isWorkshopMode || false
    this.isStoryMode = config.isStoryMode || false
    this.dailyLevel = config.dailyLevel || null
  }

  resetForNewLevel(levelIndex = 0) {
    this.currentLevelIndex = levelIndex
    this.currentLevelSteps = 0
    this.currentCombo = 0
    this.maxCombo = 0
    this.lastPlantType = null
    this.comboScore = 0
    this.thornDamage = 0

    if (this.hintPanel) {
      this.hintPanel.updateCombo(0, 0)
      this.hintPanel.updateSteps(0)
    }
  }

  updatePlantCombo(plantType) {
    if (plantType === null) {
      return
    }

    if (this.lastPlantType === null) {
      this.currentCombo = 1
    } else if (plantType === this.lastPlantType) {
      this.currentCombo++
    } else {
      this.currentCombo = 1
    }

    this.lastPlantType = plantType

    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo
    }

    if (this.plantState) {
      this.plantState.setCombo(this.currentCombo)
    }

    const baseScore = 10
    let plantScore = baseScore
    if (this.currentCombo > 1) {
      plantScore = baseScore * 2
    }
    this.comboScore += plantScore

    if (this.hintPanel) {
      this.hintPanel.updateCombo(this.currentCombo, this.maxCombo)
    }

    if (this.onComboUpdate) {
      this.onComboUpdate(this.currentCombo, this.maxCombo)
    }

    return plantScore
  }

  resetCombo() {
    this.currentCombo = 0
    this.lastPlantType = null
    if (this.hintPanel) {
      this.hintPanel.updateCombo(0, this.maxCombo)
    }
  }

  applyThornDamage() {
    const damage = 20
    this.thornDamage += damage
    if (this.hintPanel) {
      this.hintPanel.showThornDamage(damage)
    }
  }

  updateSteps(steps) {
    this.currentLevelSteps = steps
    if (this.hintPanel) {
      this.hintPanel.updateSteps(steps)
    }
  }

  calculateLevelScore() {
    return Math.max(0, this.comboScore + 50 - this.thornDamage)
  }

  startLevelTimer() {
    this.levelStartTime = this.scene.time.now
    this.levelElapsedTime = 0
    this.isLevelActive = true

    if (this.timerEvent) {
      this.timerEvent.remove()
    }

    this.timerEvent = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.isLevelActive) {
          this.levelElapsedTime = (this.scene.time.now - this.levelStartTime) / 1000
          if (this.hintPanel) {
            this.hintPanel.updateTimer(this.levelElapsedTime)
          }
        }
      }
    })
  }

  stopLevelTimer() {
    this.isLevelActive = false
    if (this.timerEvent) {
      this.timerEvent.remove()
      this.timerEvent = null
    }
    this.levelElapsedTime = (this.scene.time.now - this.levelStartTime) / 1000
    return this.levelElapsedTime
  }

  pauseLevelTimer() {
    this.isLevelActive = false
  }

  resumeLevelTimer() {
    if (!this.isLevelActive) {
      this.levelStartTime = this.scene.time.now - this.levelElapsedTime * 1000
      this.isLevelActive = true
    }
  }

  calculateStars(level, time, steps, attempts) {
    let stars = 1

    const parTime2 = level.parTime2Star || 60
    const parTime3 = level.parTime3Star || 30
    const parSteps2 = level.parSteps2Star || 20
    const parSteps3 = level.parSteps3Star || 10
    const parAttempts2 = level.parAttempts2Star || 3
    const parAttempts3 = level.parAttempts3Star || 1

    const meetTime2 = time <= parTime2
    const meetTime3 = time <= parTime3
    const meetSteps2 = steps <= parSteps2
    const meetSteps3 = steps <= parSteps3
    const meetAttempts2 = attempts <= parAttempts2
    const meetAttempts3 = attempts <= parAttempts3

    if (meetTime3 && meetSteps3 && meetAttempts3) {
      stars = 3
    } else if ((meetTime2 || meetTime3) && (meetSteps2 || meetSteps3) && (meetAttempts2 || meetAttempts3)) {
      const twoStarConditions = [meetTime2, meetSteps2, meetAttempts2].filter(Boolean).length
      if (twoStarConditions >= 2) {
        stars = 2
      } else {
        stars = 1
      }
    } else {
      stars = 1
    }

    return stars
  }

  canUnlockNextLevel(currentLevelIndex, stars) {
    return stars >= 1 && currentLevelIndex < LEVELS.length - 1
  }

  saveLevelResult(levelId, result) {
    if (this.levelProgressManager) {
      this.levelProgressManager.saveLevelResult(levelId, result)
    }
  }

  getLevelProgress(levelId) {
    if (this.levelProgressManager) {
      return this.levelProgressManager.getLevelProgress(levelId)
    }
    return { completed: false }
  }

  rewardItemsForLevel(levelIndex, stars) {
    if (this.isDailyChallenge || this.isRandomMode || this.isWorkshopMode) return

    const isNormalMode = !this.isStoryMode

    if (isNormalMode && this.levelProgressManager && this.levelMap.currentLevel) {
      const levelId = this.levelMap.currentLevel.id
      const prevProgress = this.levelProgressManager.getLevelProgress(levelId)

      if (!prevProgress.completed) {
        this.itemManager.rewardItemsForLevel(levelIndex, stars)
      }
    }
  }

  checkAchievements(options) {
    return checkLevelAchievements(options)
  }

  async submitToLeaderboard(score, time) {
    if (!this.leaderboardService) return

    let levelId = null
    if (this.isDailyChallenge) {
      const today = new Date().toISOString().split('T')[0]
      levelId = `daily_${today}`
    } else if (this.isRandomMode && this.levelMap.currentLevel) {
      const seed = this.levelMap.currentLevel.seed || 'random'
      const diff = this.levelMap.currentLevel.difficulty || 3
      levelId = `random_${diff}_${seed}`
    } else if (this.isWorkshopMode && this.levelMap.currentLevel) {
      levelId = `workshop_${this.levelMap.currentLevel.workshopId || this.levelMap.currentLevel.id}`
    } else if (this.currentLevelIndex >= 0 && this.currentLevelIndex < LEVELS.length) {
      levelId = LEVELS[this.currentLevelIndex].id
    }

    if (levelId !== null) {
      try {
        const result = await this.leaderboardService.submitScore(levelId, score, time)
        console.log('Leaderboard submit result:', result)
      } catch (e) {
        console.warn('Failed to submit to leaderboard:', e)
      }
    }
  }

  addToTotalScore(score) {
    this.totalScore += score
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.totalScore)
    }
  }

  resetTotalScore() {
    this.totalScore = 0
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.totalScore)
    }
  }

  destroy() {
    if (this.timerEvent) {
      this.timerEvent.remove()
      this.timerEvent = null
    }
  }
}
