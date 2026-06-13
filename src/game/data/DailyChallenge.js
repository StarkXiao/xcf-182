const STORAGE_KEY = 'moss_cave_daily_challenge'

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function dateToSeed(dateStr) {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const ch = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + ch
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const CHALLENGE_NAMES = [
  '幽暗深渊', '星光小径', '蘑菇丛林', '水晶洞窟', '荧光秘境',
  '暗河回廊', '萤火之谷', '碧苔古道', '月影迷踪', '翡翠长廊',
  '龙舌兰径', '紫晶暗道', '琥珀石阶', '灵光小路', '深渊花园',
  '星空隧道', '碧波洞天', '暗夜竹林', '银河小径', '幽光圣殿',
  '霞光峡谷', '迷雾森林', '翡翠迷宫', '紫藤幽径', '金辉小路',
  '月光走廊', '星尘密道', '琥珀长廊', '碧落回廊', '晨曦小径',
  '苍穹之路'
]

const CHALLENGE_HINTS = [
  '沿着发光的方向前进，不要被岔路迷惑',
  '仔细观察植物的分布，它们会指引方向',
  '避开岩石障碍，寻找最短路径',
  '从边缘绕行，可能有惊喜发现',
  '每一步都要谨慎，错误的路会浪费机会',
  '跟随最亮的荧光，它们标记了正确方向',
  '别忘了沿途点亮植物，分数很重要',
  '大胆尝试不同的路线',
  '岩石之间总有缝隙可以通过',
  '从高处俯瞰，路线会变得清晰'
]

const PLANT_TYPE_LIST = ['moss', 'mushroom', 'flower']

function generateDailyLevel(dateStr) {
  const seed = dateToSeed(dateStr)
  const rand = seededRandom(seed)

  const dayIndex = seed % CHALLENGE_NAMES.length
  const name = CHALLENGE_NAMES[dayIndex]
  const hint = CHALLENGE_HINTS[seed % CHALLENGE_HINTS.length]

  const rows = 5 + Math.floor(rand() * 4)
  const cols = 5 + Math.floor(rand() * 4)
  const gridSize = { rows, cols }

  let startRow, startCol, endRow, endCol
  const cornerChoice = Math.floor(rand() * 4)
  switch (cornerChoice) {
    case 0:
      startRow = 0; startCol = 0; endRow = rows - 1; endCol = cols - 1
      break
    case 1:
      startRow = 0; startCol = cols - 1; endRow = rows - 1; endCol = 0
      break
    case 2:
      startRow = rows - 1; startCol = 0; endRow = 0; endCol = cols - 1
      break
    default:
      startRow = rows - 1; startCol = cols - 1; endRow = 0; endCol = 0
      break
  }

  const start = { row: startRow, col: startCol }
  const end = { row: endRow, col: endCol }

  const correctPath = generatePath(start, end, gridSize, rand)

  const pathSet = new Set(correctPath.map(p => `${p.row},${p.col}`))
  const startKey = `${start.row},${start.col}`
  const endKey = `${end.row},${end.col}`

  const totalCells = rows * cols
  const obstacleCount = Math.floor(totalCells * (0.15 + rand() * 0.1))
  const obstacles = []
  const obstacleSet = new Set()

  let attempts = 0
  while (obstacles.length < obstacleCount && attempts < 200) {
    attempts++
    const r = Math.floor(rand() * rows)
    const c = Math.floor(rand() * cols)
    const key = `${r},${c}`
    if (!pathSet.has(key) && !obstacleSet.has(key) && key !== startKey && key !== endKey) {
      obstacles.push({ row: r, col: c })
      obstacleSet.add(key)
    }
  }

  const plantCount = Math.floor(totalCells * (0.25 + rand() * 0.15))
  const plants = []
  const plantSet = new Set()

  for (let i = 0; i < correctPath.length; i++) {
    const p = correctPath[i]
    const key = `${p.row},${p.col}`
    if (key !== startKey && key !== endKey && rand() > 0.2) {
      const typeIdx = Math.floor(rand() * PLANT_TYPE_LIST.length)
      plants.push({ row: p.row, col: p.col, type: PLANT_TYPE_LIST[typeIdx] })
      plantSet.add(key)
    }
  }

  attempts = 0
  while (plants.length < plantCount && attempts < 200) {
    attempts++
    const r = Math.floor(rand() * rows)
    const c = Math.floor(rand() * cols)
    const key = `${r},${c}`
    if (!pathSet.has(key) && !obstacleSet.has(key) && !plantSet.has(key) && key !== startKey && key !== endKey) {
      const typeIdx = Math.floor(rand() * PLANT_TYPE_LIST.length)
      plants.push({ row: r, col: c, type: PLANT_TYPE_LIST[typeIdx] })
      plantSet.add(key)
    }
  }

  return {
    id: -1,
    name,
    description: `${dateStr} 每日挑战`,
    gridSize,
    start,
    end,
    obstacles,
    plants,
    correctPath,
    hint,
    isDailyChallenge: true,
    challengeDate: dateStr
  }
}

function generatePath(start, end, gridSize, rand) {
  const { rows, cols } = gridSize
  const path = [{ row: start.row, col: start.col }]
  let current = { row: start.row, col: start.col }

  const maxSteps = rows * cols
  let steps = 0

  while ((current.row !== end.row || current.col !== end.col) && steps < maxSteps) {
    steps++
    const dr = end.row - current.row
    const dc = end.col - current.col

    const moves = []

    if (dr > 0 && current.row + 1 < rows) {
      moves.push({ row: current.row + 1, col: current.col, weight: Math.abs(dr) * 2 + rand() })
    }
    if (dr < 0 && current.row - 1 >= 0) {
      moves.push({ row: current.row - 1, col: current.col, weight: Math.abs(dr) * 2 + rand() })
    }
    if (dc > 0 && current.col + 1 < cols) {
      moves.push({ row: current.row, col: current.col + 1, weight: Math.abs(dc) * 2 + rand() })
    }
    if (dc < 0 && current.col - 1 >= 0) {
      moves.push({ row: current.row, col: current.col - 1, weight: Math.abs(dc) * 2 + rand() })
    }

    if (dr === 0 && rand() > 0.4 && current.row + 1 < rows) {
      moves.push({ row: current.row + 1, col: current.col, weight: rand() * 0.5 })
    }
    if (dr === 0 && rand() > 0.4 && current.row - 1 >= 0) {
      moves.push({ row: current.row - 1, col: current.col, weight: rand() * 0.5 })
    }
    if (dc === 0 && rand() > 0.4 && current.col + 1 < cols) {
      moves.push({ row: current.row, col: current.col + 1, weight: rand() * 0.5 })
    }
    if (dc === 0 && rand() > 0.4 && current.col - 1 >= 0) {
      moves.push({ row: current.row, col: current.col - 1, weight: rand() * 0.5 })
    }

    if (moves.length === 0) break

    moves.sort((a, b) => b.weight - a.weight)

    const next = moves[0]
    path.push({ row: next.row, col: next.col })
    current = { row: next.row, col: next.col }
  }

  return path
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {}
  return {
    completedDates: [],
    currentStreak: 0,
    badges: [],
    themeSkins: [],
    bestScore: 0
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {}
}

function isTodayCompleted() {
  const state = loadState()
  return state.completedDates.includes(getTodayStr())
}

function markTodayCompleted(score) {
  const state = loadState()
  const today = getTodayStr()
  const yesterday = getYesterdayStr()

  if (!state.completedDates.includes(today)) {
    state.completedDates.push(today)

    if (state.completedDates.includes(yesterday)) {
      state.currentStreak += 1
    } else if (state.currentStreak === 0) {
      state.currentStreak = 1
    } else {
      state.currentStreak = 1
    }

    if (score > state.bestScore) {
      state.bestScore = score
    }

    if (state.currentStreak >= 7 && !state.badges.includes('streak_7')) {
      state.badges.push('streak_7')
    }
    if (state.currentStreak >= 14 && !state.badges.includes('streak_14')) {
      state.badges.push('streak_14')
    }
    if (state.currentStreak >= 30 && !state.badges.includes('streak_30')) {
      state.badges.push('streak_30')
    }
    if (state.completedDates.length >= 10 && !state.badges.includes('veteran_10')) {
      state.badges.push('veteran_10')
    }
    if (state.completedDates.length >= 30 && !state.badges.includes('veteran_30')) {
      state.badges.push('veteran_30')
    }

    if (state.currentStreak >= 7 && !state.themeSkins.includes('aurora')) {
      state.themeSkins.push('aurora')
    }
    if (state.currentStreak >= 14 && !state.themeSkins.includes('starry')) {
      state.themeSkins.push('starry')
    }
    if (state.currentStreak >= 30 && !state.themeSkins.includes('crystal')) {
      state.themeSkins.push('crystal')
    }

    saveState(state)
  }

  return state
}

function recalculateStreak() {
  const state = loadState()
  const sorted = [...state.completedDates].sort().reverse()
  let streak = 0
  const today = getTodayStr()

  if (sorted.length === 0) {
    state.currentStreak = 0
    saveState(state)
    return state
  }

  let checkDate = new Date()

  for (let i = 0; i < 365; i++) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
    if (sorted.includes(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }

  state.currentStreak = streak
  saveState(state)
  return state
}

function getChallengeState() {
  return recalculateStreak()
}

function getDaysUntilNextStreak() {
  const state = getChallengeState()
  const current = state.currentStreak
  const milestones = [7, 14, 30]
  for (const m of milestones) {
    if (current < m) return m - current
  }
  return 0
}

export const BADGE_INFO = {
  streak_7: { name: '七星徽章', icon: '🌟', description: '连续7天完成每日挑战' },
  streak_14: { name: '双星徽章', icon: '💫', description: '连续14天完成每日挑战' },
  streak_30: { name: '月耀徽章', icon: '🌙', description: '连续30天完成每日挑战' },
  veteran_10: { name: '老练探险家', icon: '🏅', description: '累计完成10次每日挑战' },
  veteran_30: { name: '传奇探险家', icon: '🏆', description: '累计完成30次每日挑战' }
}

export const THEME_SKIN_INFO = {
  aurora: { name: '极光主题', icon: '🌌', description: '连续7天解锁 · 极光流动背景', colors: { primary: '#34d399', secondary: '#8b5cf6', accent: '#06b6d4' } },
  starry: { name: '星空主题', icon: '✨', description: '连续14天解锁 · 星空闪烁背景', colors: { primary: '#fbbf24', secondary: '#60a5fa', accent: '#a78bfa' } },
  crystal: { name: '水晶主题', icon: '💎', description: '连续30天解锁 · 水晶折射背景', colors: { primary: '#f472b6', secondary: '#22d3ee', accent: '#4ade80' } }
}

const THEME_GAME_CONFIGS = {
  default: {
    bgTints: [0x60a5fa, 0xa78bfa, 0xf472b6, 0x4ade80],
    ambientGlow: 0x1e3a5f,
    gridBg: 0x0d1117,
    gridBgStroke: 0x1e3a5f,
    gridCell: 0x1a1f2e,
    gridCellStroke: 0x2d3748,
    obstacleFill: 0x374151,
    obstacleStroke: 0x4b5563,
    obstacleSpark: 0x6b7280,
    startFill: 0x10b981,
    startStroke: 0x34d399,
    endFill: 0x8b5cf6,
    endStroke: 0xa78bfa
  },
  aurora: {
    bgTints: [0x34d399, 0x8b5cf6, 0x06b6d4, 0x22d3ee],
    ambientGlow: 0x0f3d3e,
    gridBg: 0x0a1a1a,
    gridBgStroke: 0x0d4f4f,
    gridCell: 0x122828,
    gridCellStroke: 0x1a4a4a,
    obstacleFill: 0x2d4a4a,
    obstacleStroke: 0x3d6a6a,
    obstacleSpark: 0x34d399,
    startFill: 0x06b6d4,
    startStroke: 0x22d3ee,
    endFill: 0x8b5cf6,
    endStroke: 0xa78bfa
  },
  starry: {
    bgTints: [0xfbbf24, 0x60a5fa, 0xa78bfa, 0xfde68a],
    ambientGlow: 0x1a1a3f,
    gridBg: 0x0d0d1a,
    gridBgStroke: 0x2a2a5f,
    gridCell: 0x1a1a2e,
    gridCellStroke: 0x2d2d4a,
    obstacleFill: 0x373751,
    obstacleStroke: 0x4b4b66,
    obstacleSpark: 0xfbbf24,
    startFill: 0xfbbf24,
    startStroke: 0xfde68a,
    endFill: 0x60a5fa,
    endStroke: 0x93c5fd
  },
  crystal: {
    bgTints: [0xf472b6, 0x22d3ee, 0x4ade80, 0xf9a8d4],
    ambientGlow: 0x2a1030,
    gridBg: 0x100a15,
    gridBgStroke: 0x4a1a5f,
    gridCell: 0x1a1028,
    gridCellStroke: 0x2d1a48,
    obstacleFill: 0x3d2040,
    obstacleStroke: 0x5a3060,
    obstacleSpark: 0xf472b6,
    startFill: 0x22d3ee,
    startStroke: 0x67e8f9,
    endFill: 0xf472b6,
    endStroke: 0xf9a8d4
  }
}

function getActiveThemeColors() {
  const savedSkin = localStorage.getItem('moss_cave_active_skin') || 'default'
  return THEME_GAME_CONFIGS[savedSkin] || THEME_GAME_CONFIGS.default
}

function getActiveSkinId() {
  return localStorage.getItem('moss_cave_active_skin') || 'default'
}

export {
  generateDailyLevel,
  loadState,
  saveState,
  isTodayCompleted,
  markTodayCompleted,
  getTodayStr,
  getChallengeState,
  getDaysUntilNextStreak,
  recalculateStreak,
  getActiveThemeColors,
  getActiveSkinId
}
