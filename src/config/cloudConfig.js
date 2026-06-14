export const CLOUD_CONFIG = {
  backend: (import.meta.env.LEADERBOARD_BACKEND || '').trim(),

  leancloud: {
    appId: (import.meta.env.VITE_LEANCLOUD_APP_ID || '').trim(),
    appKey: (import.meta.env.VITE_LEANCLOUD_APP_KEY || '').trim(),
    serverURL: (import.meta.env.VITE_LEANCLOUD_SERVER_URL || '').trim()
  },

  supabase: {
    url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
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
