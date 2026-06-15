import { LEVELS } from '../data/levels.js'

const STORAGE_KEY = 'moss_cave_level_progress_v1'

export class LevelProgressManager {
  constructor() {
    this.progress = this._loadProgress()
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load level progress:', e)
    }
    return {}
  }

  _saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress))
    } catch (e) {
      console.warn('Failed to save level progress:', e)
    }
  }

  getLevelProgress(levelId) {
    const key = String(levelId)
    return this.progress[key] || {
      completed: false,
      bestTime: null,
      bestSteps: null,
      bestAttempts: null,
      bestScore: 0,
      stars: 0,
      firstCompletedAt: null
    }
  }

  saveLevelResult(levelId, result) {
    const key = String(levelId)
    const existing = this.getLevelProgress(levelId)
    const newProgress = {
      completed: true,
      bestTime: existing.bestTime === null ? result.time : Math.min(existing.bestTime, result.time),
      bestSteps: existing.bestSteps === null ? result.steps : Math.min(existing.bestSteps, result.steps),
      bestAttempts: existing.bestAttempts === null ? result.attempts : Math.min(existing.bestAttempts, result.attempts),
      bestScore: Math.max(existing.bestScore, result.score || 0),
      stars: Math.max(existing.stars, result.stars),
      firstCompletedAt: existing.firstCompletedAt || Date.now()
    }
    this.progress[key] = newProgress
    this._saveProgress()
    return newProgress
  }

  isLevelUnlocked(levelIndex) {
    if (levelIndex === 0) return true
    const prevLevelId = LEVELS[levelIndex - 1]?.id
    if (!prevLevelId) return false
    const prevProgress = this.getLevelProgress(prevLevelId)
    return prevProgress.completed && prevProgress.stars >= 1
  }

  getHighestUnlockedIndex() {
    for (let i = 0; i < LEVELS.length; i++) {
      if (!this.isLevelUnlocked(i)) {
        return Math.max(0, i - 1)
      }
    }
    return LEVELS.length - 1
  }

  getAllProgress() {
    return { ...this.progress }
  }

  resetProgress() {
    this.progress = {}
    this._saveProgress()
  }

  getTotalStars() {
    let total = 0
    for (const key of Object.keys(this.progress)) {
      total += this.progress[key].stars || 0
    }
    return total
  }

  getTotalScore() {
    let total = 0
    for (const key of Object.keys(this.progress)) {
      total += this.progress[key].bestScore || 0
    }
    return total
  }
}

let singletonInstance = null

export function getLevelProgressManager() {
  if (!singletonInstance) {
    singletonInstance = new LevelProgressManager()
  }
  return singletonInstance
}
