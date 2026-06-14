import { CLOUD_CONFIG, detectBackendType, isLeanCloudConfigured, isSupabaseConfigured } from '../../config/cloudConfig.js'

const STORAGE_KEY_NICKNAME = 'moss_cave_nickname'
const STORAGE_KEY_LEADERBOARD = 'moss_cave_leaderboard'
const STORAGE_KEY_BACKEND_TYPE = 'moss_cave_backend_type'

const ADJECTIVES = [
  '快乐的', '勇敢的', '神秘的', '闪亮的', '温柔的', '可爱的', '机智的', '梦幻的',
  '星光的', '月光的', '晨曦的', '暮色的', '轻盈的', '静谧的', '绚烂的', '清新的',
  '呆萌的', '傲娇的', '佛系的', '元气的', '治愈的', '沙雕的', '优雅的', '狂野的',
  '迷路的', '探险的', '隐居的', '流浪的', '守望的', '追梦的', '吃瓜的', '躺平的'
]

const CREATURES = [
  '小苔藓', '蘑菇精', '萤火虫', '水晶兽', '花仙子', '石精灵', '云朵朵', '星尘尘',
  '月兔兔', '糖果果', '泡泡泡', '彩虹虹', '蝴蝶蝶', '树叶叶', '水滴滴', '雪花花',
  '喵喵咪', '汪汪汪', '啾啾鸟', '呱呱蛙', '吱吱鼠', '嗡嗡蜂', '懒懒熊', '蹦蹦兔',
  '小恐龙', '独角兽', '凤凰儿', '九尾狐', '小龙王', '小仙男', '小仙女', '小精灵'
]

const SUFFIXES = [
  '', '酱', '君', '大人', '同学', '先生', '女士', '宝宝',
  '大佬', '萌新', '路人', '选手', '玩家', '勇者', '大师', '传奇'
]

function generateRandomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const creature = CREATURES[Math.floor(Math.random() * CREATURES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  return adj + creature + suffix
}

class LocalLeaderboardBackend {
  constructor() {
    this.loadFromStorage()
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEADERBOARD)
      this.leaderboard = data ? JSON.parse(data) : {}
    } catch (e) {
      this.leaderboard = {}
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(this.leaderboard))
    } catch (e) {
      console.warn('[Leaderboard] Failed to save local leaderboard:', e)
    }
  }

  async getTopScores(levelId, limit = 50) {
    const key = String(levelId)
    const scores = this.leaderboard[key] || []
    return scores
      .slice()
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.time - b.time
      })
      .slice(0, limit)
  }

  async submitScore(levelId, nickname, score, time) {
    const key = String(levelId)
    if (!this.leaderboard[key]) {
      this.leaderboard[key] = []
    }
    const entry = {
      nickname,
      score,
      time,
      timestamp: Date.now()
    }
    this.leaderboard[key].push(entry)
    this.leaderboard[key].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.time - b.time
    })
    this.leaderboard[key] = this.leaderboard[key].slice(0, 100)
    this.saveToStorage()
    const rank = this.leaderboard[key].findIndex(
      e => e.timestamp === entry.timestamp
    ) + 1
    return { success: true, rank, entry }
  }

  async getUserBestScore(levelId, nickname) {
    const key = String(levelId)
    const scores = this.leaderboard[key] || []
    const userScores = scores.filter(e => e.nickname === nickname)
    if (userScores.length === 0) return null
    return userScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.time - b.time
    })[0]
  }
}

class LeaderboardService {
  constructor() {
    this.backendType = 'local'
    this.backend = null
    this.backendReady = false
    this.backendPromise = null
    this.localBackend = new LocalLeaderboardBackend()
    this.nickname = null
    this.loadNickname()
    this._adapterModules = null
    this.initBackend()
  }

  loadNickname() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NICKNAME)
      if (saved) {
        this.nickname = saved
      } else {
        this.nickname = generateRandomNickname()
        this.saveNickname()
      }
    } catch (e) {
      this.nickname = generateRandomNickname()
    }
  }

  saveNickname() {
    try {
      localStorage.setItem(STORAGE_KEY_NICKNAME, this.nickname)
    } catch (e) {
      console.warn('[Leaderboard] Failed to save nickname:', e)
    }
  }

  getNickname() {
    return this.nickname
  }

  setNickname(nickname) {
    this.nickname = nickname
    this.saveNickname()
  }

  generateNewNickname() {
    this.nickname = generateRandomNickname()
    this.saveNickname()
    return this.nickname
  }

  getBackendType() {
    return this.backendType
  }

  isCloudBackend() {
    return this.backendType === 'leancloud' || this.backendType === 'supabase'
  }

  async _loadAdapters() {
    if (this._adapterModules) return this._adapterModules
    try {
      const adapters = {}
      try {
        const mod = await import('./backends/LeanCloudBackend.js')
        adapters.leancloud = mod.LeanCloudBackend
        console.log('[Leaderboard] LeanCloud adapter loaded')
      } catch (e) {
        console.log('[Leaderboard] LeanCloud adapter not available (dependency not installed)')
      }
      try {
        const mod = await import('./backends/SupabaseBackend.js')
        adapters.supabase = mod.SupabaseBackend
        console.log('[Leaderboard] Supabase adapter loaded')
      } catch (e) {
        console.log('[Leaderboard] Supabase adapter not available (dependency not installed)')
      }
      this._adapterModules = adapters
      return adapters
    } catch (e) {
      console.warn('[Leaderboard] Failed to load adapters:', e)
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

    try {
      const savedType = localStorage.getItem(STORAGE_KEY_BACKEND_TYPE)
      if (savedType && ['local', 'leancloud', 'supabase'].includes(savedType)) {
        targetType = savedType
      }
    } catch (e) {
      // ignore
    }

    if (targetType === 'local') {
      this.backend = this.localBackend
      this.backendType = 'local'
      this.backendReady = true
      return true
    }

    const adapters = await this._loadAdapters()

    if (targetType === 'leancloud' && adapters.leancloud && isLeanCloudConfigured()) {
      try {
        const cfg = CLOUD_CONFIG.leancloud
        const BackendClass = adapters.leancloud
        const backend = new BackendClass(cfg.appId, cfg.appKey, cfg.serverURL)
        await backend.init()
        this.backend = backend
        this.backendType = 'leancloud'
        this.backendReady = true
        console.log('[Leaderboard] ✅ LeanCloud backend connected')
        return true
      } catch (e) {
        console.warn('[Leaderboard] LeanCloud init failed, falling back to local:', e)
      }
    }

    if (targetType === 'supabase' && adapters.supabase && isSupabaseConfigured()) {
      try {
        const cfg = CLOUD_CONFIG.supabase
        const BackendClass = adapters.supabase
        const backend = new BackendClass(cfg.url, cfg.anonKey)
        await backend.init()
        this.backend = backend
        this.backendType = 'supabase'
        this.backendReady = true
        console.log('[Leaderboard] ✅ Supabase backend connected')
        return true
      } catch (e) {
        console.warn('[Leaderboard] Supabase init failed, falling back to local:', e)
      }
    }

    this.backend = this.localBackend
    this.backendType = 'local'
    this.backendReady = true
    console.log('[Leaderboard] Using local storage backend')
    return false
  }

  initBackend() {
    this.backend = this.localBackend
    this._initBackendFromConfig().catch(() => {
      this.backend = this.localBackend
      this.backendReady = true
    })
  }

  async switchBackend(type, config = {}) {
    this.backendType = type
    try {
      localStorage.setItem(STORAGE_KEY_BACKEND_TYPE, type)
    } catch (e) {
      // ignore
    }

    if (type === 'local') {
      this.backend = this.localBackend
      this.backendReady = true
      return true
    }

    const adapters = await this._loadAdapters()

    try {
      if (type === 'leancloud' && adapters.leancloud) {
        const BackendClass = adapters.leancloud
        const backend = new BackendClass(config.appId, config.appKey, config.serverURL)
        await backend.init()
        this.backend = backend
        this.backendReady = true
        return true
      }

      if (type === 'supabase' && adapters.supabase) {
        const BackendClass = adapters.supabase
        const backend = new BackendClass(config.supabaseUrl, config.supabaseKey)
        await backend.init()
        this.backend = backend
        this.backendReady = true
        return true
      }
    } catch (e) {
      console.warn('[Leaderboard] Backend switch failed, using local:', e)
      this.backend = this.localBackend
      this.backendType = 'local'
      this.backendReady = true
      return false
    }

    return false
  }

  async getTopScores(levelId, limit = 50) {
    try {
      await this.ensureBackendReady()
      return await this.backend.getTopScores(levelId, limit)
    } catch (e) {
      console.error('[Leaderboard] getTopScores failed, using local:', e)
      return await this.localBackend.getTopScores(levelId, limit)
    }
  }

  async submitScore(levelId, score, time) {
    try {
      await this.ensureBackendReady()
      const result = await this.backend.submitScore(
        levelId,
        this.nickname,
        score,
        time
      )
      if (this.backend !== this.localBackend) {
        try {
          await this.localBackend.submitScore(levelId, this.nickname, score, time)
        } catch (e) {
          // ignore local sync error
        }
      }
      return result
    } catch (e) {
      console.error('[Leaderboard] submitScore failed, using local:', e)
      return await this.localBackend.submitScore(levelId, this.nickname, score, time)
    }
  }

  async getUserBestScore(levelId) {
    try {
      await this.ensureBackendReady()
      return await this.backend.getUserBestScore(levelId, this.nickname)
    } catch (e) {
      console.error('[Leaderboard] getUserBestScore failed, using local:', e)
      return await this.localBackend.getUserBestScore(levelId, this.nickname)
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  formatDate(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

let instance = null

export function getLeaderboardService() {
  if (!instance) {
    instance = new LeaderboardService()
  }
  return instance
}

export { generateRandomNickname }
