let _AV = null
let _loadPromise = null

async function loadAV() {
  if (_AV) return _AV
  if (_loadPromise) return _loadPromise
  _loadPromise = (async () => {
    try {
      const mod = await import(/* @vite-ignore */ 'leancloud-storage')
      _AV = mod.default || mod
      return _AV
    } catch (e) {
      console.warn('[Leaderboard] leancloud-storage is not installed. Run: npm install leancloud-storage')
      throw e
    }
  })()
  return _loadPromise
}

export class LeanCloudBackend {
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
      const AV = await loadAV()
      const initOpts = {
        appId: this.appId,
        appKey: this.appKey
      }
      if (this.serverURL) {
        initOpts.serverURL = this.serverURL
      }
      AV.init(initOpts)
      this.AV = AV
      this.initialized = true
    } catch (e) {
      console.warn('[Leaderboard] LeanCloud init failed:', e)
      throw e
    }
  }

  async getTopScores(levelId, limit = 50) {
    if (!this.initialized) await this.init()
    try {
      const query = new this.AV.Query('Leaderboard')
      query.equalTo('levelId', String(levelId))
      query.limit(limit)
      query.addDescending('score')
      query.addAscending('time')
      const results = await query.find()
      return results.map(item => ({
        nickname: item.get('nickname'),
        score: item.get('score'),
        time: item.get('time'),
        timestamp: item.get('createdAt').getTime()
      }))
    } catch (e) {
      console.error('[Leaderboard] LeanCloud getTopScores failed:', e)
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

      const countQuery = new this.AV.Query('Leaderboard')
      countQuery.equalTo('levelId', String(levelId))
      countQuery.greaterThan('score', score)
      const count = await countQuery.count()

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
      console.error('[Leaderboard] LeanCloud submitScore failed:', e)
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
      console.error('[Leaderboard] LeanCloud getUserBestScore failed:', e)
      return null
    }
  }
}
