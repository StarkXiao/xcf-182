let _createClient = null
let _loadPromise = null

async function loadSupabase() {
  if (_createClient) return _createClient
  if (_loadPromise) return _loadPromise
  _loadPromise = (async () => {
    try {
      const mod = await import(/* @vite-ignore */ '@supabase/supabase-js')
      _createClient = mod.createClient
      return _createClient
    } catch (e) {
      console.warn('[Leaderboard] @supabase/supabase-js is not installed. Run: npm install @supabase/supabase-js')
      throw e
    }
  })()
  return _loadPromise
}

export class SupabaseBackend {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
    this.supabase = null
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    try {
      const createClient = await loadSupabase()
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
      this.initialized = true
    } catch (e) {
      console.warn('[Leaderboard] Supabase init failed:', e)
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
      console.error('[Leaderboard] Supabase getTopScores failed:', e)
      return []
    }
  }

  async submitScore(levelId, nickname, score, time) {
    if (!this.initialized) await this.init()
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .insert([{
          level_id: String(levelId),
          nickname,
          score,
          time
        }])
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
      console.error('[Leaderboard] Supabase submitScore failed:', e)
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
      console.error('[Leaderboard] Supabase getUserBestScore failed:', e)
      return null
    }
  }
}
