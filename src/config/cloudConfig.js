function readEnv(key, def = '') {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const val = import.meta.env[key]
      if (val != null) return String(val)
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key]
      if (val != null) return String(val)
    }
  } catch (e) {}
  return def
}

export const CLOUD_CONFIG = {
  backend: (readEnv('LEADERBOARD_BACKEND', '')).trim(),

  leancloud: {
    appId: (readEnv('VITE_LEANCLOUD_APP_ID', '')).trim(),
    appKey: (readEnv('VITE_LEANCLOUD_APP_KEY', '')).trim(),
    serverURL: (readEnv('VITE_LEANCLOUD_SERVER_URL', '')).trim()
  },

  supabase: {
    url: (readEnv('VITE_SUPABASE_URL', '')).trim(),
    anonKey: (readEnv('VITE_SUPABASE_ANON_KEY', '')).trim()
  }
}

export function isLeanCloudConfigured() {
  const c = CLOUD_CONFIG.leancloud
  return !!(c.appId && c.appKey)
}

export function isSupabaseConfigured() {
  const c = CLOUD_CONFIG.supabase
  return !!(c.url && c.anonKey)
}

export function detectBackendType() {
  const explicit = CLOUD_CONFIG.backend.toLowerCase()
  if (explicit === 'leancloud' || explicit === 'supabase' || explicit === 'local') {
    return explicit
  }
  if (isLeanCloudConfigured()) return 'leancloud'
  if (isSupabaseConfigured()) return 'supabase'
  return 'local'
}
