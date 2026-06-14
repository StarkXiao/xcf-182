export const THEMES = {
  default: {
    id: 'default',
    name: '星尘洞穴',
    icon: '✨',
    grid: {
      bg: 0x0d1117,
      bgStroke: 0x1e3a5f,
      cell: 0x1a1f2e,
      cellStroke: 0x2d3748,
      obstacleFill: 0x374151,
      obstacleStroke: 0x4b5563,
      obstacleSpark: 0x6b7280,
      startFill: 0x10b981,
      startStroke: 0x34d399,
      endFill: 0x8b5cf6,
      endStroke: 0xa78bfa
    },
    plants: {
      moss: { color: 0x4ade80, glowColor: 0x22c55e },
      mushroom: { color: 0xf472b6, glowColor: 0xec4899 },
      flower: { color: 0x60a5fa, glowColor: 0x3b82f6 }
    },
    particles: {
      bgTints: [0x60a5fa, 0xa78bfa, 0xf472b6, 0x4ade80],
      ambientGlow: 0x1e3a5f
    },
    creature: {
      body: 0xf97316,
      bodyStroke: 0xea580c,
      glow: 0xfbbf24
    }
  },

  ice: {
    id: 'ice',
    name: '霜寒冰窟',
    icon: '❄️',
    grid: {
      bg: 0x0c1929,
      bgStroke: 0x1e40af,
      cell: 0x0f2847,
      cellStroke: 0x3b82f6,
      obstacleFill: 0x1e40af,
      obstacleStroke: 0x60a5fa,
      obstacleSpark: 0x93c5fd,
      startFill: 0x06b6d4,
      startStroke: 0x22d3ee,
      endFill: 0x0ea5e9,
      endStroke: 0x38bdf8
    },
    plants: {
      moss: { color: 0x67e8f9, glowColor: 0x22d3ee },
      mushroom: { color: 0xa5f3fc, glowColor: 0x67e8f9 },
      flower: { color: 0x7dd3fc, glowColor: 0x38bdf8 }
    },
    particles: {
      bgTints: [0x67e8f9, 0x38bdf8, 0x0ea5e9, 0xa5f3fc],
      ambientGlow: 0x1e3a8a
    },
    creature: {
      body: 0x06b6d4,
      bodyStroke: 0x0891b2,
      glow: 0x22d3ee
    }
  },

  lava: {
    id: 'lava',
    name: '炽热熔岩',
    icon: '🔥',
    grid: {
      bg: 0x1c0a0a,
      bgStroke: 0x991b1b,
      cell: 0x2d1010,
      cellStroke: 0xdc2626,
      obstacleFill: 0x7f1d1d,
      obstacleStroke: 0xef4444,
      obstacleSpark: 0xfca5a5,
      startFill: 0xf97316,
      startStroke: 0xfb923c,
      endFill: 0xeab308,
      endStroke: 0xfacc15
    },
    plants: {
      moss: { color: 0xfb923c, glowColor: 0xf97316 },
      mushroom: { color: 0xf87171, glowColor: 0xef4444 },
      flower: { color: 0xfbbf24, glowColor: 0xf59e0b }
    },
    particles: {
      bgTints: [0xfbbf24, 0xf97316, 0xef4444, 0xf87171],
      ambientGlow: 0x7c2d12
    },
    creature: {
      body: 0xef4444,
      bodyStroke: 0xdc2626,
      glow: 0xfbbf24
    }
  },

  crystal: {
    id: 'crystal',
    name: '璀璨晶洞',
    icon: '💎',
    grid: {
      bg: 0x130f2b,
      bgStroke: 0x6d28d9,
      cell: 0x1e1b4b,
      cellStroke: 0x8b5cf6,
      obstacleFill: 0x4c1d95,
      obstacleStroke: 0xa78bfa,
      obstacleSpark: 0xc4b5fd,
      startFill: 0xd946ef,
      startStroke: 0xe879f9,
      endFill: 0xec4899,
      endStroke: 0xf472b6
    },
    plants: {
      moss: { color: 0xa78bfa, glowColor: 0x8b5cf6 },
      mushroom: { color: 0xf0abfc, glowColor: 0xe879f9 },
      flower: { color: 0xf9a8d4, glowColor: 0xf472b6 }
    },
    particles: {
      bgTints: [0xa78bfa, 0xe879f9, 0xf472b6, 0xc4b5fd],
      ambientGlow: 0x4c1d95
    },
    creature: {
      body: 0xa855f7,
      bodyStroke: 0x9333ea,
      glow: 0xe879f9
    }
  }
}

export class ThemeManager {
  constructor() {
    this.currentThemeId = 'default'
    this.listeners = new Set()
  }

  static getInstance() {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  getCurrentTheme() {
    return THEMES[this.currentThemeId] || THEMES.default
  }

  getTheme(themeId) {
    return THEMES[themeId] || THEMES.default
  }

  getAllThemes() {
    return Object.values(THEMES)
  }

  setTheme(themeId) {
    if (!THEMES[themeId]) {
      console.warn(`Theme "${themeId}" not found, using default`)
      themeId = 'default'
    }
    
    if (this.currentThemeId === themeId) return false
    
    this.currentThemeId = themeId
    const theme = this.getCurrentTheme()
    
    this.listeners.forEach(listener => {
      try {
        listener(theme)
      } catch (e) {
        console.error('Theme listener error:', e)
      }
    })
    
    return true
  }

  onThemeChange(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  offThemeChange(listener) {
    this.listeners.delete(listener)
  }

  getGridColors(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme()
    return theme.grid
  }

  getPlantColors(plantType, themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme()
    const plantColors = theme.plants[plantType]
    if (!plantColors) {
      return { color: 0x4ade80, glowColor: 0x22c55e }
    }
    return plantColors
  }

  getParticleColors(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme()
    return theme.particles
  }

  getCreatureColors(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme()
    return theme.creature
  }

  saveThemeToStorage() {
    try {
      localStorage.setItem('caveGameTheme', this.currentThemeId)
    } catch (e) {}
  }

  loadThemeFromStorage() {
    try {
      const saved = localStorage.getItem('caveGameTheme')
      if (saved && THEMES[saved]) {
        this.currentThemeId = saved
        return true
      }
    } catch (e) {}
    return false
  }
}
