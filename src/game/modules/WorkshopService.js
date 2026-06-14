import { CLOUD_CONFIG, detectBackendType, isLeanCloudConfigured, isSupabaseConfigured } from '../../config/cloudConfig.js'
import { getLeaderboardService } from './LeaderboardService.js'

const STORAGE_KEY_WORKSHOP = 'moss_cave_workshop'
const STORAGE_KEY_WORKSHOP_LIKES = 'moss_cave_workshop_likes'

const PLANT_POINTS = { moss: 10, mushroom: 20, flower: 30 }

class LocalWorkshopBackend {
  constructor() {
    this.loadFromStorage()
  }

  loadFromStorage() {
    try {
      const levelsData = localStorage.getItem(STORAGE_KEY_WORKSHOP)
      this.levels = levelsData ? JSON.parse(levelsData) : this._getSampleLevels()
      const likesData = localStorage.getItem(STORAGE_KEY_WORKSHOP_LIKES)
      this.likes = likesData ? JSON.parse(likesData) : {}
    } catch (e) {
      this.levels = this._getSampleLevels()
      this.likes = {}
    }
  }

  _getSampleLevels() {
    return [
      {
        id: 'sample-1',
        authorNickname: '关卡设计大师',
        name: '经典迷宫',
        description: '一个精心设计的迷宫关卡，考验你的智慧',
        hint: '尝试从外围绕路',
        gridSize: { rows: 7, cols: 7 },
        start: { row: 0, col: 0 },
        end: { row: 6, col: 6 },
        obstacles: [
          { row: 1, col: 1 }, { row: 1, col: 3 }, { row: 1, col: 5 },
          { row: 3, col: 1 }, { row: 3, col: 3 }, { row: 3, col: 5 },
          { row: 5, col: 1 }, { row: 5, col: 3 }, { row: 5, col: 5 }
        ],
        plants: [
          { row: 0, col: 2, type: 'moss' }, { row: 0, col: 4, type: 'mushroom' },
          { row: 2, col: 0, type: 'moss' }, { row: 2, col: 2, type: 'flower' },
          { row: 2, col: 4, type: 'moss' }, { row: 2, col: 6, type: 'mushroom' },
          { row: 4, col: 0, type: 'flower' }, { row: 4, col: 2, type: 'moss' },
          { row: 4, col: 4, type: 'flower' }, { row: 4, col: 6, type: 'mushroom' },
          { row: 6, col: 2, type: 'moss' }, { row: 6, col: 4, type: 'flower' }
        ],
        correctPath: [
          { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 2 },
          { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 3, col: 4 },
          { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 5, col: 6 },
          { row: 6, col: 6 }
        ],
        likesCount: 42,
        playsCount: 156,
        totalPoints: 200,
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: 'sample-2',
        authorNickname: '苔藓爱好者',
        name: '苔藓花园',
        description: '满眼都是翠绿的苔藓，快来收集吧！',
        hint: '尽可能收集所有苔藓',
        gridSize: { rows: 6, cols: 6 },
        start: { row: 0, col: 0 },
        end: { row: 5, col: 5 },
        obstacles: [
          { row: 2, col: 2 }, { row: 2, col: 3 },
          { row: 3, col: 2 }, { row: 3, col: 3 }
        ],
        plants: [
          { row: 0, col: 1, type: 'moss' }, { row: 0, col: 2, type: 'moss' },
          { row: 0, col: 3, type: 'mushroom' }, { row: 0, col: 4, type: 'moss' },
          { row: 1, col: 0, type: 'moss' }, { row: 1, col: 5, type: 'moss' },
          { row: 2, col: 0, type: 'moss' }, { row: 2, col: 1, type: 'mushroom' },
          { row: 2, col: 4, type: 'moss' }, { row: 2, col: 5, type: 'moss' },
          { row: 3, col: 0, type: 'moss' }, { row: 3, col: 1, type: 'moss' },
          { row: 3, col: 4, type: 'mushroom' }, { row: 3, col: 5, type: 'moss' },
          { row: 4, col: 0, type: 'moss' }, { row: 4, col: 5, type: 'moss' },
          { row: 5, col: 0, type: 'flower' }, { row: 5, col: 1, type: 'moss' },
          { row: 5, col: 2, type: 'moss' }, { row: 5, col: 3, type: 'mushroom' },
          { row: 5, col: 4, type: 'moss' }
        ],
        correctPath: [
          { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
          { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 },
          { row: 1, col: 5 }, { row: 2, col: 5 }, { row: 3, col: 5 },
          { row: 4, col: 5 }, { row: 5, col: 5 }
        ],
        likesCount: 28,
        playsCount: 93,
        totalPoints: 230,
        createdAt: Date.now() - 86400000 * 7
      },
      {
        id: 'sample-3',
        authorNickname: '夜光花园丁',
        name: '花之迷宫',
        description: '夜光花在黑暗中闪耀，找到通往终点的路',
        hint: '夜光花的位置暗示着正确的路径',
        gridSize: { rows: 8, cols: 8 },
        start: { row: 0, col: 0 },
        end: { row: 7, col: 7 },
        obstacles: [
          { row: 1, col: 2 }, { row: 1, col: 5 },
          { row: 2, col: 2 }, { row: 2, col: 5 },
          { row: 4, col: 2 }, { row: 4, col: 5 },
          { row: 5, col: 2 }, { row: 5, col: 5 },
          { row: 3, col: 0 }, { row: 3, col: 7 },
          { row: 6, col: 3 }, { row: 6, col: 4 }
        ],
        plants: [
          { row: 0, col: 1, type: 'moss' }, { row: 0, col: 3, type: 'flower' },
          { row: 0, col: 6, type: 'mushroom' }, { row: 1, col: 0, type: 'moss' },
          { row: 1, col: 4, type: 'flower' }, { row: 1, col: 7, type: 'moss' },
          { row: 2, col: 1, type: 'mushroom' }, { row: 2, col: 6, type: 'flower' },
          { row: 3, col: 1, type: 'moss' }, { row: 3, col: 3, type: 'flower' },
          { row: 3, col: 4, type: 'mushroom' }, { row: 3, col: 6, type: 'moss' },
          { row: 4, col: 1, type: 'flower' }, { row: 4, col: 6, type: 'flower' },
          { row: 5, col: 0, type: 'moss' }, { row: 5, col: 3, type: 'flower' },
          { row: 5, col: 4, type: 'mushroom' }, { row: 5, col: 7, type: 'moss' },
          { row: 6, col: 0, type: 'mushroom' }, { row: 6, col: 2, type: 'flower' },
          { row: 6, col: 5, type: 'flower' }, { row: 6, col: 7, type: 'mushroom' },
          { row: 7, col: 1, type: 'moss' }, { row: 7, col: 3, type: 'flower' },
          { row: 7, col: 6, type: 'mushroom' }
        ],
        correctPath: [
          { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
          { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 1, col: 4 },
          { row: 2, col: 4 }, { row: 3, col: 4 }, { row: 3, col: 3 },
          { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 4 },
          { row: 5, col: 3 }, { row: 6, col: 3 }, { row: 7, col: 3 },
          { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 },
          { row: 7, col: 7 }
        ],
        likesCount: 67,
        playsCount: 245,
        totalPoints: 410,
        createdAt: Date.now() - 86400000 * 1
      }
    ]
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_WORKSHOP, JSON.stringify(this.levels))
      localStorage.setItem(STORAGE_KEY_WORKSHOP_LIKES, JSON.stringify(this.likes))
    } catch (e) {
      console.warn('[Workshop] Failed to save local workshop:', e)
    }
  }

  async getWorkshopLevels(sortBy = 'hot', limit = 50, offset = 0) {
    let levels = [...this.levels]
    
    if (sortBy === 'hot') {
      levels.sort((a, b) => {
        const aScore = a.likesCount * 2 + a.playsCount
        const bScore = b.likesCount * 2 + b.playsCount
        if (bScore !== aScore) return bScore - aScore
        return b.createdAt - a.createdAt
      })
    } else if (sortBy === 'newest') {
      levels.sort((a, b) => b.createdAt - a.createdAt)
    } else if (sortBy === 'most_liked') {
      levels.sort((a, b) => b.likesCount - a.likesCount || b.createdAt - a.createdAt)
    } else if (sortBy === 'most_played') {
      levels.sort((a, b) => b.playsCount - a.playsCount || b.createdAt - a.createdAt)
    }
    
    return levels.slice(offset, offset + limit)
  }

  async getWorkshopLevelsByAuthor(nickname, limit = 50) {
    return this.levels
      .filter(l => l.authorNickname === nickname)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
  }

  async uploadWorkshopLevel(levelData, authorNickname) {
    const totalPoints = levelData.plants.reduce((sum, p) => 
      sum + (PLANT_POINTS[p.type] || 0), 0
    )
    
    const newLevel = {
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      authorNickname,
      name: levelData.name,
      description: levelData.description || '',
      hint: levelData.hint || '',
      gridSize: { ...levelData.gridSize },
      start: { ...levelData.start },
      end: { ...levelData.end },
      obstacles: levelData.obstacles.map(o => ({ ...o })),
      plants: levelData.plants.map(p => ({ ...p })),
      correctPath: levelData.correctPath.map(p => ({ ...p })),
      likesCount: 0,
      playsCount: 0,
      totalPoints,
      createdAt: Date.now()
    }
    
    this.levels.unshift(newLevel)
    this.saveToStorage()
    
    return {
      success: true,
      levelId: newLevel.id,
      level: newLevel
    }
  }

  async likeWorkshopLevel(levelId, nickname) {
    const userLikes = this.likes[nickname] || []
    if (userLikes.includes(levelId)) {
      return { success: false, alreadyLiked: true }
    }
    
    userLikes.push(levelId)
    this.likes[nickname] = userLikes
    
    const level = this.levels.find(l => l.id === levelId)
    if (level) {
      level.likesCount++
    }
    
    this.saveToStorage()
    return { success: true, alreadyLiked: false }
  }

  async unlikeWorkshopLevel(levelId, nickname) {
    const userLikes = this.likes[nickname] || []
    const idx = userLikes.indexOf(levelId)
    if (idx !== -1) {
      userLikes.splice(idx, 1)
      this.likes[nickname] = userLikes
      
      const level = this.levels.find(l => l.id === levelId)
      if (level && level.likesCount > 0) {
        level.likesCount--
      }
      
      this.saveToStorage()
    }
    return { success: true }
  }

  async getUserLikedLevels(nickname) {
    return this.likes[nickname] || []
  }

  async incrementPlayCount(levelId) {
    const level = this.levels.find(l => l.id === levelId)
    if (level) {
      level.playsCount++
      this.saveToStorage()
    }
    return { success: true }
  }
}

class WorkshopService {
  constructor() {
    this.backendType = 'local'
    this.backend = null
    this.backendReady = false
    this.backendPromise = null
    this.localBackend = new LocalWorkshopBackend()
    this.leaderboardService = getLeaderboardService()
    this._adapterModules = null
    this.initBackend()
  }

  getNickname() {
    return this.leaderboardService.getNickname()
  }

  async _loadAdapters() {
    if (this._adapterModules) return this._adapterModules
    try {
      const adapters = {}
      try {
        const mod = await import('./backends/SupabaseBackend.js')
        adapters.supabase = mod.SupabaseBackend
        console.log('[Workshop] Supabase adapter loaded')
      } catch (e) {
        console.log('[Workshop] Supabase adapter not available')
      }
      try {
        const mod = await import('./backends/LeanCloudBackend.js')
        adapters.leancloud = mod.LeanCloudBackend
        console.log('[Workshop] LeanCloud adapter loaded')
      } catch (e) {
        console.log('[Workshop] LeanCloud adapter not available')
      }
      this._adapterModules = adapters
      return adapters
    } catch (e) {
      console.warn('[Workshop] Failed to load adapters:', e)
      return {}
    }
  }

  async ensureBackendReady() {
    if (this.backendReady) return true
    if (this.backendPromise) return this.backendPromise
    this.backendPromise = this._initBackendFromConfig()
    return this.backendPromise
  }

  async _initBackendFromConfig() {
    const detectedType = detectBackendType()
    let targetType = detectedType

    if (targetType === 'local') {
      this.backend = this.localBackend
      this.backendType = 'local'
      this.backendReady = true
      return true
    }

    const adapters = await this._loadAdapters()

    if (targetType === 'supabase' && adapters.supabase && isSupabaseConfigured()) {
      try {
        const cfg = CLOUD_CONFIG.supabase
        const BackendClass = adapters.supabase
        const backend = new BackendClass(cfg.url, cfg.anonKey)
        await backend.init()
        this.backend = backend
        this.backendType = 'supabase'
        this.backendReady = true
        console.log('[Workshop] ✅ Supabase backend connected')
        return true
      } catch (e) {
        console.warn('[Workshop] Supabase init failed, falling back to local:', e)
      }
    }

    if (targetType === 'leancloud' && adapters.leancloud && isLeanCloudConfigured()) {
      console.warn('[Workshop] LeanCloud workshop backend not implemented yet, using local')
    }

    this.backend = this.localBackend
    this.backendType = 'local'
    this.backendReady = true
    console.log('[Workshop] Using local storage backend')
    return false
  }

  initBackend() {
    this.backend = this.localBackend
    this._initBackendFromConfig().catch(() => {
      this.backend = this.localBackend
      this.backendReady = true
    })
  }

  async getWorkshopLevels(sortBy = 'hot', limit = 50, offset = 0) {
    try {
      await this.ensureBackendReady()
      return await this.backend.getWorkshopLevels(sortBy, limit, offset)
    } catch (e) {
      console.error('[Workshop] getWorkshopLevels failed, using local:', e)
      return await this.localBackend.getWorkshopLevels(sortBy, limit, offset)
    }
  }

  async getWorkshopLevelsByAuthor(nickname, limit = 50) {
    try {
      await this.ensureBackendReady()
      return await this.backend.getWorkshopLevelsByAuthor(nickname, limit)
    } catch (e) {
      console.error('[Workshop] getWorkshopLevelsByAuthor failed, using local:', e)
      return await this.localBackend.getWorkshopLevelsByAuthor(nickname, limit)
    }
  }

  async uploadWorkshopLevel(levelData) {
    try {
      await this.ensureBackendReady()
      const nickname = this.getNickname()
      const result = await this.backend.uploadWorkshopLevel(levelData, nickname)
      if (this.backend !== this.localBackend) {
        try {
          await this.localBackend.uploadWorkshopLevel(levelData, nickname)
        } catch (e) {}
      }
      return result
    } catch (e) {
      console.error('[Workshop] uploadWorkshopLevel failed, using local:', e)
      const nickname = this.getNickname()
      return await this.localBackend.uploadWorkshopLevel(levelData, nickname)
    }
  }

  async likeWorkshopLevel(levelId) {
    try {
      await this.ensureBackendReady()
      const nickname = this.getNickname()
      const result = await this.backend.likeWorkshopLevel(levelId, nickname)
      if (this.backend !== this.localBackend && result.success) {
        try {
          await this.localBackend.likeWorkshopLevel(levelId, nickname)
        } catch (e) {}
      }
      return result
    } catch (e) {
      console.error('[Workshop] likeWorkshopLevel failed, using local:', e)
      const nickname = this.getNickname()
      return await this.localBackend.likeWorkshopLevel(levelId, nickname)
    }
  }

  async unlikeWorkshopLevel(levelId) {
    try {
      await this.ensureBackendReady()
      const nickname = this.getNickname()
      const result = await this.backend.unlikeWorkshopLevel(levelId, nickname)
      if (this.backend !== this.localBackend) {
        try {
          await this.localBackend.unlikeWorkshopLevel(levelId, nickname)
        } catch (e) {}
      }
      return result
    } catch (e) {
      console.error('[Workshop] unlikeWorkshopLevel failed, using local:', e)
      const nickname = this.getNickname()
      return await this.localBackend.unlikeWorkshopLevel(levelId, nickname)
    }
  }

  async toggleLike(levelId) {
    const likedLevels = await this.getUserLikedLevels()
    if (likedLevels.includes(levelId)) {
      return await this.unlikeWorkshopLevel(levelId)
    } else {
      return await this.likeWorkshopLevel(levelId)
    }
  }

  async getUserLikedLevels() {
    try {
      await this.ensureBackendReady()
      const nickname = this.getNickname()
      return await this.backend.getUserLikedLevels(nickname)
    } catch (e) {
      console.error('[Workshop] getUserLikedLevels failed, using local:', e)
      const nickname = this.getNickname()
      return await this.localBackend.getUserLikedLevels(nickname)
    }
  }

  async incrementPlayCount(levelId) {
    try {
      await this.ensureBackendReady()
      return await this.backend.incrementPlayCount(levelId)
    } catch (e) {
      console.error('[Workshop] incrementPlayCount failed, using local:', e)
      return await this.localBackend.incrementPlayCount(levelId)
    }
  }

  isCloudBackend() {
    return this.backendType === 'leancloud' || this.backendType === 'supabase'
  }

  getBackendType() {
    return this.backendType
  }

  formatDate(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  convertToGameLevel(workshopLevel) {
    return {
      id: 'workshop-' + workshopLevel.id,
      name: workshopLevel.name,
      description: workshopLevel.description || '',
      hint: workshopLevel.hint || '',
      gridSize: { ...workshopLevel.gridSize },
      start: { ...workshopLevel.start },
      end: { ...workshopLevel.end },
      obstacles: workshopLevel.obstacles.map(o => ({ ...o })),
      plants: workshopLevel.plants.map(p => ({ ...p })),
      correctPath: workshopLevel.correctPath.map(p => ({ ...p })),
      workshopId: workshopLevel.id,
      isWorkshopLevel: true
    }
  }
}

let instance = null

export function getWorkshopService() {
  if (!instance) {
    instance = new WorkshopService()
  }
  return instance
}
