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

  async getWorkshopLevels(sortBy = 'hot', limit = 50, offset = 0) {
    if (!this.initialized) await this.init()
    try {
      let query = this.supabase
        .from('workshop_levels')
        .select('*')
        .eq('is_approved', true)

      if (sortBy === 'hot') {
        query = query.order('likes_count', { ascending: false })
                     .order('plays_count', { ascending: false })
                     .order('created_at', { ascending: false })
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'most_liked') {
        query = query.order('likes_count', { ascending: false })
                     .order('created_at', { ascending: false })
      } else if (sortBy === 'most_played') {
        query = query.order('plays_count', { ascending: false })
                     .order('created_at', { ascending: false })
      }

      const { data, error } = await query.range(offset, offset + limit - 1)
      if (error) throw error
      return data.map(item => this._parseWorkshopLevel(item))
    } catch (e) {
      console.error('[Workshop] Supabase getWorkshopLevels failed:', e)
      return []
    }
  }

  async getWorkshopLevelsByAuthor(nickname, limit = 50) {
    if (!this.initialized) await this.init()
    try {
      const { data, error } = await this.supabase
        .from('workshop_levels')
        .select('*')
        .eq('is_approved', true)
        .eq('author_nickname', nickname)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data.map(item => this._parseWorkshopLevel(item))
    } catch (e) {
      console.error('[Workshop] Supabase getWorkshopLevelsByAuthor failed:', e)
      return []
    }
  }

  async uploadWorkshopLevel(levelData, authorNickname) {
    if (!this.initialized) await this.init()
    try {
      const { data, error } = await this.supabase
        .from('workshop_levels')
        .insert([{
          author_nickname: authorNickname,
          name: levelData.name,
          description: levelData.description || null,
          hint: levelData.hint || null,
          grid_rows: levelData.gridSize.rows,
          grid_cols: levelData.gridSize.cols,
          start_pos: levelData.start,
          end_pos: levelData.end,
          obstacles: levelData.obstacles,
          plants: levelData.plants,
          correct_path: levelData.correctPath,
          total_points: this._calculateTotalPoints(levelData.plants)
        }])
        .select()
      if (error) throw error
      return {
        success: true,
        levelId: data[0].id,
        level: this._parseWorkshopLevel(data[0])
      }
    } catch (e) {
      console.error('[Workshop] Supabase uploadWorkshopLevel failed:', e)
      throw e
    }
  }

  async likeWorkshopLevel(levelId, nickname) {
    if (!this.initialized) await this.init()
    try {
      const { error } = await this.supabase
        .from('workshop_likes')
        .insert([{
          level_id: levelId,
          nickname: nickname
        }])
        .select()
      if (error) {
        if (error.code === '23505') {
          return { success: false, alreadyLiked: true }
        }
        throw error
      }
      return { success: true, alreadyLiked: false }
    } catch (e) {
      console.error('[Workshop] Supabase likeWorkshopLevel failed:', e)
      throw e
    }
  }

  async unlikeWorkshopLevel(levelId, nickname) {
    if (!this.initialized) await this.init()
    try {
      const { error } = await this.supabase
        .from('workshop_likes')
        .delete()
        .eq('level_id', levelId)
        .eq('nickname', nickname)
      if (error) throw error
      return { success: true }
    } catch (e) {
      console.error('[Workshop] Supabase unlikeWorkshopLevel failed:', e)
      throw e
    }
  }

  async getUserLikedLevels(nickname) {
    if (!this.initialized) await this.init()
    try {
      const { data, error } = await this.supabase
        .from('workshop_likes')
        .select('level_id')
        .eq('nickname', nickname)
      if (error) throw error
      return data.map(item => item.level_id)
    } catch (e) {
      console.error('[Workshop] Supabase getUserLikedLevels failed:', e)
      return []
    }
  }

  async incrementPlayCount(levelId) {
    if (!this.initialized) await this.init()
    try {
      const { error } = await this.supabase
        .rpc('increment_workshop_play_count', { level_id: levelId })
      if (error) {
        const { error: updateError } = await this.supabase
          .from('workshop_levels')
          .update({ plays_count: this.supabase.raw('plays_count + 1') })
          .eq('id', levelId)
        if (updateError) throw updateError
      }
      return { success: true }
    } catch (e) {
      console.error('[Workshop] Supabase incrementPlayCount failed:', e)
      return { success: false }
    }
  }

  _parseWorkshopLevel(item) {
    return {
      id: item.id,
      authorNickname: item.author_nickname,
      name: item.name,
      description: item.description,
      hint: item.hint,
      gridSize: { rows: item.grid_rows, cols: item.grid_cols },
      start: item.start_pos,
      end: item.end_pos,
      obstacles: item.obstacles,
      plants: item.plants,
      correctPath: item.correct_path,
      likesCount: item.likes_count,
      playsCount: item.plays_count,
      totalPoints: item.total_points,
      createdAt: new Date(item.created_at).getTime()
    }
  }

  _calculateTotalPoints(plants) {
    const POINTS = { moss: 10, mushroom: 20, flower: 30 }
    return plants.reduce((sum, p) => sum + (POINTS[p.type] || 0), 0)
  }
}
