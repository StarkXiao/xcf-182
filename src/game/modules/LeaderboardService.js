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

function safeDynamicImport(moduleName) {
  try {
    const fn = new Function('mod', 'return import(mod)')
    return fn(moduleName)
  } catch (e) {
    return Promise.reject(e)
  }
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
      console.warn('Failed to save leaderboard to localStorage:', e)
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

class LeanCloudBackend {
  constructor(appId, appKey, serverURL) {
    this.appId = appId
    this.appKey = appKey
    this.serverURL = serverURL
    this.initialized = false
    this.AV = null
  }

  async init() {
    if (this.initialized) return
    
    try {
      const AV = await safeDynamicImport('leancloud-storage')
      const AVLib = AV.default || AV
      AVLib.init({
        appId: this.appId,
        appKey: this.appKey,
        serverURL: this.serverURL
      })
      this.AV = AVLib
      this.initialized = true
    } catch (e) {
      console.warn('LeanCloud init failed, falling back to local:', e)
      throw e
    }
  }

  async getTopScores(levelId, limit = 50) {
    if (!this.initialized) await this.init()
    
    const query = new this.AV.Query('Leaderboard')
    query.equalTo('levelId', String(levelId))
    query.limit(limit)
    query.addDescending('score')
    query.addAscending('time')
    
    try {
      const results = await query.find()
      return results.map(item => ({
        nickname: item.get('nickname'),
        score: item.get('score'),
        time: item.get('time'),
        timestamp: item.get('createdAt').getTime()
      }))
    } catch (e) {
      console.error('Failed to get top scores from LeanCloud:', e)
      return []
    }
  }

  async submitScore(levelId, nickname, score, time) {
    if (!this.initialized) await this.init()
    
    try {
      const Leaderboard = this.AV.Object.extend('Leaderboard')
      const entry = new Leaderboard()
      entry.set('levelId', String(levelId))
      entry.set('nickname', nickname)
      entry.set('score', score)
      entry.set('time', time)
      
      const result = await entry.save()
      
      const query = new this.AV.Query('Leaderboard')
      query.equalTo('levelId', String(levelId))
      query.greaterThan('score', score)
      const count = await query.count()
      
      const tieQuery = new this.AV.Query('Leaderboard')
      tieQuery.equalTo('levelId', String(levelId))
      tieQuery.equalTo('score', score)
      tieQuery.lessThan('time', time)
      const tieCount = await tieQuery.count()
      
      const rank = count + tieCount + 1
      
      return {
        success: true,
        rank,
        entry: {
          nickname,
          score,
          time,
          timestamp: result.get('createdAt').getTime()
        }
      }
    } catch (e) {
      console.error('Failed to submit score to LeanCloud:', e)
      throw e
    }
  }

  async getUserBestScore(levelId, nickname) {
    if (!this.initialized) await this.init()
    
    try {
      const query = new this.AV.Query('Leaderboard')
      query.equalTo('levelId', String(levelId))
      query.equalTo('nickname', nickname)
      query.addDescending('score')
      query.addAscending('time')
      query.limit(1)
      
      const results = await query.find()
      if (results.length === 0) return null
      
      const item = results[0]
      return {
        nickname: item.get('nickname'),
        score: item.get('score'),
        time: item.get('time'),
        timestamp: item.get('createdAt').getTime()
      }
    } catch (e) {
      console.error('Failed to get user best score from LeanCloud:', e)
      return null
    }
  }
}

class SupabaseBackend {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
    this.supabase = null
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    
    try {
      const mod = await safeDynamicImport('@supabase/supabase-js')
      const { createClient } = mod
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey)
      this.initialized = true
    } catch (e) {
      console.warn('Supabase init failed, falling back to local:', e)
      throw e
    }
  }

  async getTopScores(levelId, limit = 50) {
    if (!this.initialized) await this.init()
    
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('nickname, score, time, created_at')
        .eq('level_id', String(levelId))
        .order('score', { ascending: false })
        .order('time', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      
      return data.map(item => ({
        nickname: item.nickname,
        score: item.score,
        time: item.time,
        timestamp: new Date(item.created_at).getTime()
      }))
    } catch (e) {
      console.error('Failed to get top scores from Supabase:', e)
      return []
    }
  }

  async submitScore(levelId, nickname, score, time) {
    if (!this.initialized) await this.init()
    
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .insert([
          {
            level_id: String(levelId),
            nickname,
            score,
            time
          }
        ])
        .select()
      
      if (error) throw error
      
      const { count, error: rankError } = await this.supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('level_id', String(levelId))
        .gt('score', score)
      
      if (rankError) throw rankError
      
      const { count: tieCount, error: tieError } = await this.supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('level_id', String(levelId))
        .eq('score', score)
        .lt('time', time)
      
      if (tieError) throw tieError
      
      const rank = (count || 0) + (tieCount || 0) + 1
      
      return {
        success: true,
        rank,
        entry: {
          nickname,
          score,
          time,
          timestamp: new Date(data[0].created_at).getTime()
        }
      }
    } catch (e) {
      console.error('Failed to submit score to Supabase:', e)
      throw e
    }
  }

  async getUserBestScore(levelId, nickname) {
    if (!this.initialized) await this.init()
    
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('nickname, score, time, created_at')
        .eq('level_id', String(levelId))
        .eq('nickname', nickname)
        .order('score', { ascending: false })
        .order('time', { ascending: true })
        .limit(1)
      
      if (error) throw error
      if (data.length === 0) return null
      
      return {
        nickname: data[0].nickname,
        score: data[0].score,
        time: data[0].time,
        timestamp: new Date(data[0].created_at).getTime()
      }
    } catch (e) {
      console.error('Failed to get user best score from Supabase:', e)
      return null
    }
  }
}

class LeaderboardService {
  constructor() {
    this.backendType = 'local'
    this.backend = null
    this.localBackend = new LocalLeaderboardBackend()
    this.nickname = null
    this.loadNickname()
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
      console.warn('Failed to save nickname:', e)
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

  initBackend() {
    try {
      const savedType = localStorage.getItem(STORAGE_KEY_BACKEND_TYPE)
      if (savedType) {
        this.backendType = savedType
      }
    } catch (e) {
      // ignore
    }
    this.backend = this.localBackend
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
      return true
    }

    try {
      if (type === 'leancloud') {
        const backend = new LeanCloudBackend(
          config.appId,
          config.appKey,
          config.serverURL
        )
        await backend.init()
        this.backend = backend
        return true
      }

      if (type === 'supabase') {
        const backend = new SupabaseBackend(
          config.supabaseUrl,
          config.supabaseKey
        )
        await backend.init()
        this.backend = backend
        return true
      }
    } catch (e) {
      console.warn('Backend switch failed, using local:', e)
      this.backend = this.localBackend
      this.backendType = 'local'
      return false
    }

    return false
  }

  async getTopScores(levelId, limit = 50) {
    try {
      return await this.backend.getTopScores(levelId, limit)
    } catch (e) {
      console.error('Failed to get top scores:', e)
      return await this.localBackend.getTopScores(levelId, limit)
    }
  }

  async submitScore(levelId, score, time) {
    try {
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
      console.error('Failed to submit score, using local:', e)
      return await this.localBackend.submitScore(levelId, this.nickname, score, time)
    }
  }

  async getUserBestScore(levelId) {
    try {
      return await this.backend.getUserBestScore(levelId, this.nickname)
    } catch (e) {
      console.error('Failed to get user best score:', e)
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
