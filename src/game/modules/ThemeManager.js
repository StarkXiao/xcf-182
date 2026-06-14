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
      endStroke: 0xa78bfa,
      obstacleStyle: 'rock',
      cellPattern: 'none'
    },
    plants: {
      moss: { color: 0x4ade80, glowColor: 0x22c55e, shape: 'moss_blob' },
      mushroom: { color: 0xf472b6, glowColor: 0xec4899, shape: 'cap_mushroom' },
      flower: { color: 0x60a5fa, glowColor: 0x3b82f6, shape: 'round_petal' }
    },
    particles: {
      bgTints: [0x60a5fa, 0xa78bfa, 0xf472b6, 0x4ade80],
      ambientGlow: 0x1e3a5f,
      particleShape: 'star',
      floatDirection: 'random',
      speedRange: [5, 20]
    },
    creature: {
      body: 0xf97316,
      bodyStroke: 0xea580c,
      glow: 0xfbbf24,
      shape: 'round_larva',
      antennaType: 'thin',
      eyeStyle: 'round',
      hasWings: false,
      hasTail: false
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
      endStroke: 0x38bdf8,
      obstacleStyle: 'ice_pillar',
      cellPattern: 'frost'
    },
    plants: {
      moss: { color: 0x67e8f9, glowColor: 0x22d3ee, shape: 'ice_crystal' },
      mushroom: { color: 0xa5f3fc, glowColor: 0x67e8f9, shape: 'frost_cap' },
      flower: { color: 0x7dd3fc, glowColor: 0x38bdf8, shape: 'snowflake' }
    },
    particles: {
      bgTints: [0x67e8f9, 0x38bdf8, 0x0ea5e9, 0xa5f3fc, 0xffffff],
      ambientGlow: 0x1e3a8a,
      particleShape: 'snowflake',
      floatDirection: 'down',
      speedRange: [8, 25]
    },
    creature: {
      body: 0x06b6d4,
      bodyStroke: 0x0891b2,
      glow: 0x22d3ee,
      shape: 'crystal_fish',
      antennaType: 'ice_spike',
      eyeStyle: 'ice_blue',
      hasWings: true,
      hasTail: true
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
      endStroke: 0xfacc15,
      obstacleStyle: 'lava_rock',
      cellPattern: 'crack'
    },
    plants: {
      moss: { color: 0xfb923c, glowColor: 0xf97316, shape: 'fire_fern' },
      mushroom: { color: 0xf87171, glowColor: 0xef4444, shape: 'flame_cap' },
      flower: { color: 0xfbbf24, glowColor: 0xf59e0b, shape: 'ember_bloom' }
    },
    particles: {
      bgTints: [0xfbbf24, 0xf97316, 0xef4444, 0xf87171, 0xfde68a],
      ambientGlow: 0x7c2d12,
      particleShape: 'ember',
      floatDirection: 'up',
      speedRange: [15, 40]
    },
    creature: {
      body: 0xef4444,
      bodyStroke: 0xdc2626,
      glow: 0xfbbf24,
      shape: 'fire_salamander',
      antennaType: 'flame',
      eyeStyle: 'ember',
      hasWings: false,
      hasTail: true
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
      endStroke: 0xf472b6,
      obstacleStyle: 'crystal_cluster',
      cellPattern: 'prism'
    },
    plants: {
      moss: { color: 0xa78bfa, glowColor: 0x8b5cf6, shape: 'amthyst_cluster' },
      mushroom: { color: 0xf0abfc, glowColor: 0xe879f9, shape: 'crystal_cap' },
      flower: { color: 0xf9a8d4, glowColor: 0xf472b6, shape: 'gem_rose' }
    },
    particles: {
      bgTints: [0xa78bfa, 0xe879f9, 0xf472b6, 0xc4b5fd, 0xf0abfc],
      ambientGlow: 0x4c1d95,
      particleShape: 'diamond',
      floatDirection: 'radial',
      speedRange: [3, 15]
    },
    creature: {
      body: 0xa855f7,
      bodyStroke: 0x9333ea,
      glow: 0xe879f9,
      shape: 'fairy_gem',
      antennaType: 'crystal_shard',
      eyeStyle: 'rainbow',
      hasWings: true,
      hasTail: false
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
      return { color: 0x4ade80, glowColor: 0x22c55e, shape: 'moss_blob' }
    }
    return plantColors
  }

  getPlantShape(plantType, themeId = null) {
    const plantConfig = this.getPlantColors(plantType, themeId)
    return plantConfig.shape || 'moss_blob'
  }

  getParticleColors(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme()
    return theme.particles
  }

  getCreatureColors(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme()
    return theme.creature
  }

  getCreatureShape(themeId = null) {
    return this.getCreatureColors(themeId).shape || 'round_larva'
  }

  getThemeId() {
    return this.currentThemeId
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
