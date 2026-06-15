const STORAGE_KEY = 'moss_cave_achievements_v1'

export const ACHIEVEMENTS = {
  FIRST_CLEAR: {
    id: 'first_clear',
    name: '初次通关',
    icon: '🌟',
    description: '完成第一个关卡',
    color: '#22c55e',
    category: 'progress'
  },
  ALL_LIT: {
    id: 'all_lit',
    name: '全点亮',
    icon: '💡',
    description: '在一个关卡中点亮所有植物',
    color: '#fbbf24',
    category: 'skill'
  },
  ZERO_MISTAKE: {
    id: 'zero_mistake',
    name: '零失误',
    icon: '🎯',
    description: '一次尝试就通关（无失误）',
    color: '#60a5fa',
    category: 'skill'
  },
  SPEED_RUN: {
    id: 'speed_run',
    name: '限时通关',
    icon: '⚡',
    description: '在3星时间内完成关卡',
    color: '#f97316',
    category: 'skill'
  },
  STORY_COMPLETE: {
    id: 'story_complete',
    name: '故事大师',
    icon: '📖',
    description: '通关故事模式所有关卡',
    color: '#a78bfa',
    category: 'progress'
  },
  PERFECT_LEVEL: {
    id: 'perfect_level',
    name: '完美通关',
    icon: '⭐',
    description: '获得三星评价通关任意关卡',
    color: '#fbbf24',
    category: 'skill'
  },
  COMBO_MASTER: {
    id: 'combo_master',
    name: '连击达人',
    icon: '🔥',
    description: '单次关卡最高连击达到5或以上',
    color: '#ef4444',
    category: 'skill'
  },
  DAILY_CHAMPION: {
    id: 'daily_champion',
    name: '每日冠军',
    icon: '🔥',
    description: '完成每日挑战',
    color: '#f59e0b',
    category: 'progress'
  },
  COLLECTOR: {
    id: 'collector',
    name: '收藏家',
    icon: '🏆',
    description: '解锁5个成就',
    color: '#8b5cf6',
    category: 'meta'
  }
}

const ACHIEVEMENT_LIST = Object.values(ACHIEVEMENTS)

export class AchievementManager {
  constructor() {
    this.achievements = this._loadAchievements()
    this.listeners = new Set()
  }

  _loadAchievements() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e)
    }
    return {}
  }

  _saveAchievements() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.achievements))
    } catch (e) {
      console.warn('Failed to save achievements:', e)
    }
  }

  _notifyListeners(newAchievements) {
    this.listeners.forEach(listener => {
      try {
        listener(newAchievements)
      } catch (e) {
        console.warn('Achievement listener error:', e)
      }
    })
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  isUnlocked(achievementId) {
    return !!this.achievements[achievementId]
  }

  unlock(achievementId) {
    if (this.isUnlocked(achievementId)) {
      return null
    }

    const achievement = ACHIEVEMENT_LIST.find(a => a.id === achievementId)
    if (!achievement) {
      return null
    }

    this.achievements[achievementId] = {
      unlockedAt: Date.now()
    }
    this._saveAchievements()

    const newUnlocked = [achievement]

    const totalUnlocked = this.getUnlockedCount()
    if (totalUnlocked >= 5 && !this.isUnlocked(ACHIEVEMENTS.COLLECTOR.id)) {
      this.achievements[ACHIEVEMENTS.COLLECTOR.id] = {
        unlockedAt: Date.now()
      }
      this._saveAchievements()
      newUnlocked.push(ACHIEVEMENTS.COLLECTOR)
    }

    this._notifyListeners(newUnlocked)

    return newUnlocked
  }

  getUnlockedCount() {
    return Object.keys(this.achievements).length
  }

  getTotalCount() {
    return ACHIEVEMENT_LIST.length
  }

  getAllAchievements() {
    return ACHIEVEMENT_LIST.map(achievement => ({
      ...achievement,
      unlocked: this.isUnlocked(achievement.id),
      unlockedAt: this.achievements[achievement.id]?.unlockedAt || null
    }))
  }

  checkAndUnlock(checkFn) {
    const result = checkFn(this)
    if (result && result.length > 0) {
      return result
    }
    return []
  }

  reset() {
    this.achievements = {}
    this._saveAchievements()
    this._notifyListeners([])
  }
}

let singletonInstance = null

export function getAchievementManager() {
  if (!singletonInstance) {
    singletonInstance = new AchievementManager()
  }
  return singletonInstance
}

export function checkLevelAchievements(params) {
  const manager = getAchievementManager()
  const newlyUnlocked = []

  const {
    isFirstClear,
    allLit,
    attempts,
    completionTime,
    level,
    stars,
    maxCombo,
    isStoryComplete,
    isDailyComplete
  } = params

  if (isFirstClear && !manager.isUnlocked(ACHIEVEMENTS.FIRST_CLEAR.id)) {
    const r = manager.unlock(ACHIEVEMENTS.FIRST_CLEAR.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (allLit && !manager.isUnlocked(ACHIEVEMENTS.ALL_LIT.id)) {
    const r = manager.unlock(ACHIEVEMENTS.ALL_LIT.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (attempts === 1 && !manager.isUnlocked(ACHIEVEMENTS.ZERO_MISTAKE.id)) {
    const r = manager.unlock(ACHIEVEMENTS.ZERO_MISTAKE.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (level && level.parTime3Star && completionTime <= level.parTime3Star && !manager.isUnlocked(ACHIEVEMENTS.SPEED_RUN.id)) {
    const r = manager.unlock(ACHIEVEMENTS.SPEED_RUN.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (stars === 3 && !manager.isUnlocked(ACHIEVEMENTS.PERFECT_LEVEL.id)) {
    const r = manager.unlock(ACHIEVEMENTS.PERFECT_LEVEL.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (maxCombo >= 5 && !manager.isUnlocked(ACHIEVEMENTS.COMBO_MASTER.id)) {
    const r = manager.unlock(ACHIEVEMENTS.COMBO_MASTER.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (isStoryComplete && !manager.isUnlocked(ACHIEVEMENTS.STORY_COMPLETE.id)) {
    const r = manager.unlock(ACHIEVEMENTS.STORY_COMPLETE.id)
    if (r) newlyUnlocked.push(...r)
  }

  if (isDailyComplete && !manager.isUnlocked(ACHIEVEMENTS.DAILY_CHAMPION.id)) {
    const r = manager.unlock(ACHIEVEMENTS.DAILY_CHAMPION.id)
    if (r) newlyUnlocked.push(...r)
  }

  return newlyUnlocked
}
