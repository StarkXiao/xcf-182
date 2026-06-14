class SeededRandom {
  constructor(seed) {
    this.seed = seed >>> 0
    this.state = this.seed || 0xDEADBEEF
  }

  next() {
    this.state |= 0
    this.state = (this.state + 0x6D2B79F5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min
  }

  pick(array) {
    return array[Math.floor(this.next() * array.length)]
  }

  shuffle(array) {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

const DIFFICULTY_CONFIG = {
  1: {
    name: '入门',
    rows: [5, 5],
    cols: [5, 5],
    pathLengthRatio: [0.3, 0.5],
    obstacleDensity: [0.3, 0.4],
    twistiness: 0.2,
    extraPathDensity: [0.05, 0.1]
  },
  2: {
    name: '简单',
    rows: [5, 6],
    cols: [5, 6],
    pathLengthRatio: [0.4, 0.6],
    obstacleDensity: [0.25, 0.35],
    twistiness: 0.35,
    extraPathDensity: [0.08, 0.15]
  },
  3: {
    name: '普通',
    rows: [6, 7],
    cols: [6, 7],
    pathLengthRatio: [0.5, 0.7],
    obstacleDensity: [0.2, 0.3],
    twistiness: 0.5,
    extraPathDensity: [0.12, 0.2]
  },
  4: {
    name: '困难',
    rows: [7, 8],
    cols: [7, 8],
    pathLengthRatio: [0.55, 0.75],
    obstacleDensity: [0.18, 0.28],
    twistiness: 0.65,
    extraPathDensity: [0.15, 0.25]
  },
  5: {
    name: '专家',
    rows: [8, 10],
    cols: [8, 10],
    pathLengthRatio: [0.6, 0.85],
    obstacleDensity: [0.15, 0.25],
    twistiness: 0.8,
    extraPathDensity: [0.2, 0.3]
  }
}

const LEVEL_NAMES = [
  ['迷雾森林', '幽静小径', '萤火点点', '苔痕石阶', '浅滩漫步'],
  ['幽深洞穴', '蜿蜒长廊', '竹林迷踪', '溪流婉转', '落英缤纷'],
  ['古树盘根', '晶簇丛生', '薄雾缭绕', '深谷回响', '幽潭倒影'],
  ['迷雾深渊', '秘境回廊', '暗夜烛火', '悬岩峭壁', '冰川裂隙'],
  ['远古圣殿', '地心秘境', '星辰回廊', '混沌迷宫', '无尽深渊']
]

const PLANT_TYPE_KEYS = ['moss', 'mushroom', 'flower']

export class LevelGenerator {
  constructor(difficulty = 3, seed = null) {
    this.difficulty = Math.max(1, Math.min(5, difficulty))
    this.seed = seed !== null ? seed : Math.floor(Math.random() * 0xFFFFFFFF)
    this.rng = new SeededRandom(this.seed)
    this.config = DIFFICULTY_CONFIG[this.difficulty]
  }

  generate() {
    const level = {
      id: `random-${this.seed}`,
      seed: this.seed,
      difficulty: this.difficulty,
      isRandom: true
    }

    level.gridSize = this._generateGridSize()
    const { rows, cols } = level.gridSize

    level.start = this._generateStart(rows, cols)
    level.end = this._generateEnd(rows, cols, level.start)

    level.correctPath = this._generatePath(level.start, level.end, rows, cols)

    level.obstacles = this._generateObstaclesWithUniqueness(
      level.correctPath,
      rows,
      cols
    )

    const pathSet = new Set(level.correctPath.map(p => `${p.row},${p.col}`))
    const obsSet = new Set(level.obstacles.map(o => `${o.row},${o.col}`))
    
    this._carveDeadEnds(level.correctPath, obsSet, rows, cols, pathSet)
    
    level.obstacles = []
    for (const key of obsSet) {
      const [r, c] = key.split(',').map(Number)
      level.obstacles.push({ row: r, col: c })
    }

    const hasAlt = this._hasAlternativePath(
      level.start,
      level.end,
      rows,
      cols,
      level.obstacles,
      pathSet
    )
    
    if (hasAlt) {
      level.obstacles = this._generateObstaclesWithUniqueness(
        level.correctPath,
        rows,
        cols
      )
    }

    level.plants = this._generatePlants(
      level.correctPath,
      level.obstacles,
      rows,
      cols
    )

    level.name = this._generateName()
    level.description = this._generateDescription(level)
    level.hint = this._generateHint(level)

    const validation = LevelGenerator.validateLevel(level, true)
    if (!validation.valid) {
      return this.generate()
    }

    const finalPathSet = new Set(level.correctPath.map(p => `${p.row},${p.col}`))
    const finalHasAlt = this._hasAlternativePath(
      level.start,
      level.end,
      level.gridSize.rows,
      level.gridSize.cols,
      level.obstacles,
      finalPathSet
    )
    
    if (finalHasAlt) {
      return this.generate()
    }

    return level
  }

  _generateGridSize() {
    return {
      rows: this.rng.nextInt(this.config.rows[0], this.config.rows[1]),
      cols: this.rng.nextInt(this.config.cols[0], this.config.cols[1])
    }
  }

  _generateStart(rows, cols) {
    const edges = ['top', 'left']
    const edge = this.rng.pick(edges)

    if (edge === 'top') {
      return { row: 0, col: this.rng.nextInt(0, cols - 1) }
    } else {
      return { row: this.rng.nextInt(0, rows - 1), col: 0 }
    }
  }

  _generateEnd(rows, cols, start) {
    const minDist = Math.floor((rows + cols) * 0.5)
    let end
    let attempts = 0

    do {
      const edges = ['bottom', 'right']
      const edge = this.rng.pick(edges)

      if (edge === 'bottom') {
        end = { row: rows - 1, col: this.rng.nextInt(0, cols - 1) }
      } else {
        end = { row: this.rng.nextInt(0, rows - 1), col: cols - 1 }
      }
      attempts++
    } while (
      this._manhattanDistance(start, end) < minDist &&
      attempts < 50
    )

    return end
  }

  _manhattanDistance(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
  }

  _generatePath(start, end, rows, cols) {
    const totalCells = rows * cols
    const minPathLen = Math.floor(totalCells * this.config.pathLengthRatio[0])
    const maxPathLen = Math.floor(totalCells * this.config.pathLengthRatio[1])
    const twistiness = this.config.twistiness

    let bestPath = null
    let bestScore = -1
    const maxAttempts = 200

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let path = this._randomWalkPath(start, end, rows, cols, maxPathLen, twistiness)
      
      if (!path || path.length < minPathLen * 0.5) continue
      if (!this._isPathSimple(path)) continue

      if (path.length < maxPathLen) {
        const expanded = this._expandPath(path, rows, cols, maxPathLen, twistiness)
        if (this._isPathSimple(expanded)) {
          path = expanded
        }
      }

      if (path.length >= minPathLen && this._isPathSimple(path)) {
        const score = this._scorePath(path, start, end, minPathLen, maxPathLen)
        if (score > bestScore) {
          bestScore = score
          bestPath = path
          if (path.length >= maxPathLen * 0.85) break
        }
      }
    }

    if (!bestPath) {
      bestPath = this._astarPath(start, end, rows, cols, [])
    }

    return bestPath.map(p => ({ row: p.row, col: p.col }))
  }

  _randomWalkPath(start, end, rows, cols, maxLen, twistiness) {
    const path = [{ row: start.row, col: start.col }]
    const visited = new Set([`${start.row},${start.col}`])
    let current = { ...start }
    
    const maxSteps = Math.min(maxLen * 1.5, rows * cols)
    let steps = 0

    while (steps < maxSteps) {
      if (current.row === end.row && current.col === end.col) {
        if (path.length >= 4) {
          return [...path]
        }
      }

      const neighbors = this._getWalkableNeighbors(current, rows, cols, visited)
      
      if (neighbors.length === 0) {
        break
      }

      let nextCell
      
      if (this.rng.next() < twistiness) {
        nextCell = this.rng.pick(neighbors)
      } else {
        const scored = neighbors.map(n => {
          const dist = this._manhattanDistance(n, end)
          return { cell: n, score: -dist + this.rng.nextFloat(-2, 2) }
        })
        scored.sort((a, b) => b.score - a.score)
        nextCell = scored[0].cell
      }

      current = nextCell
      path.push({ row: current.row, col: current.col })
      visited.add(`${current.row},${current.col}`)
      steps++
    }

    const last = path[path.length - 1]
    if (last.row === end.row && last.col === end.col && path.length >= 4) {
      return path
    }

    return null
  }

  _scorePath(path, start, end, minLen, maxLen) {
    let score = 0
    score += Math.min(path.length / maxLen, 1) * 50

    const straightPenalty = this._countStraightRuns(path)
    score -= straightPenalty * 2

    const distStart = this._manhattanDistance(path[0], start)
    const distEnd = this._manhattanDistance(path[path.length - 1], end)
    score -= (distStart + distEnd) * 5

    return score
  }

  _countStraightRuns(path) {
    if (path.length < 3) return path.length
    let straights = 0
    for (let i = 2; i < path.length; i++) {
      const dr1 = path[i - 1].row - path[i - 2].row
      const dc1 = path[i - 1].col - path[i - 2].col
      const dr2 = path[i].row - path[i - 1].row
      const dc2 = path[i].col - path[i - 1].col
      if (dr1 === dr2 && dc1 === dc2) straights++
    }
    return straights
  }

  _isPathSimple(path) {
    const pathSet = new Set(path.map(p => `${p.row},${p.col}`))
    if (pathSet.size !== path.length) return false

    for (let i = 0; i < path.length; i++) {
      for (let j = i + 2; j < path.length; j++) {
        if (j === i + 1) continue
        const dr = Math.abs(path[i].row - path[j].row)
        const dc = Math.abs(path[i].col - path[j].col)
        if (dr + dc === 1) {
          return false
        }
      }
    }
    return true
  }

  _expandPath(path, rows, cols, targetLen, twistiness) {
    let result = path.map(p => ({ ...p }))
    const maxIterations = 200
    let iterations = 0
    let lastLen = 0

    while (result.length < targetLen && iterations < maxIterations) {
      if (result.length === lastLen) break
      lastLen = result.length
      
      const expanded = this._tryExpandPath(result, rows, cols, twistiness)
      if (expanded) {
        result = expanded
      }
      iterations++
    }

    return result
  }

  _tryExpandPath(path, rows, cols, twistiness) {
    const pathSet = new Set(path.map(p => `${p.row},${p.col}`))
    
    const candidates = []
    for (let i = 0; i < path.length - 1; i++) {
      const curr = path[i]
      const next = path[i + 1]
      
      const dr = next.row - curr.row
      const dc = next.col - curr.col
      
      let perpDirs
      if (dr !== 0) {
        perpDirs = [{ dr: 0, dc: 1 }, { dr: 0, dc: -1 }]
      } else {
        perpDirs = [{ dr: 1, dc: 0 }, { dr: -1, dc: 0 }]
      }
      
      for (const pd of perpDirs) {
        const r1 = curr.row + pd.dr
        const c1 = curr.col + pd.dc
        const r2 = next.row + pd.dr
        const c2 = next.col + pd.dc
        
        if (r1 < 0 || r1 >= rows || c1 < 0 || c1 >= cols) continue
        if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) continue
        
        const k1 = `${r1},${c1}`
        const k2 = `${r2},${c2}`
        
        if (!pathSet.has(k1) && !pathSet.has(k2)) {
          candidates.push({ i, pd, r1, c1, r2, c2 })
        }
      }
    }

    if (candidates.length === 0) return null

    const pickCount = Math.min(3, candidates.length)
    const shuffled = this.rng.shuffle(candidates)
    
    for (let c = 0; c < pickCount; c++) {
      const cand = shuffled[c]
      const newPath = []
      for (let j = 0; j <= cand.i; j++) {
        newPath.push(path[j])
      }
      newPath.push({ row: cand.r1, col: cand.c1 })
      newPath.push({ row: cand.r2, col: cand.c2 })
      for (let j = cand.i + 1; j < path.length; j++) {
        newPath.push(path[j])
      }
      
      const newSet = new Set(newPath.map(p => `${p.row},${p.col}`))
      if (newSet.size === newPath.length) {
        return newPath
      }
    }

    return null
  }

  _getWalkableNeighbors(cell, rows, cols, visited) {
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ]

    const neighbors = []
    for (const d of dirs) {
      const nr = cell.row + d.dr
      const nc = cell.col + d.dc
      const key = `${nr},${nc}`
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key)) {
        neighbors.push({ row: nr, col: nc })
      }
    }
    return this.rng.shuffle(neighbors)
  }

  _astarPath(start, end, rows, cols, obstacles) {
    const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
    const openSet = new Map()
    const cameFrom = new Map()
    const gScore = new Map()
    const fScore = new Map()

    const startKey = `${start.row},${start.col}`
    const endKey = `${end.row},${end.col}`

    openSet.set(startKey, start)
    gScore.set(startKey, 0)
    fScore.set(startKey, this._manhattanDistance(start, end))

    while (openSet.size > 0) {
      let currentKey = null
      let lowestF = Infinity

      for (const [key, cell] of openSet) {
        const f = fScore.get(key) ?? Infinity
        if (f < lowestF) {
          lowestF = f
          currentKey = key
        }
      }

      if (currentKey === endKey) {
        const path = []
        let ck = currentKey
        while (ck) {
          const [r, c] = ck.split(',').map(Number)
          path.unshift({ row: r, col: c })
          ck = cameFrom.get(ck)
        }
        return path
      }

      const current = openSet.get(currentKey)
      openSet.delete(currentKey)

      const neighbors = this._getWalkableNeighbors(current, rows, cols, new Set())

      for (const n of neighbors) {
        const nKey = `${n.row},${n.col}`
        if (obsSet.has(nKey)) continue

        const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1
        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, currentKey)
          gScore.set(nKey, tentativeG)
          fScore.set(nKey, tentativeG + this._manhattanDistance(n, end))
          if (!openSet.has(nKey)) {
            openSet.set(nKey, n)
          }
        }
      }
    }

    return [start, end]
  }

  _generateObstaclesWithUniqueness(correctPath, rows, cols) {
    const pathSet = new Set(correctPath.map(p => `${p.row},${p.col}`))
    const totalCells = rows * cols
    const density = this.rng.nextFloat(
      this.config.obstacleDensity[0],
      this.config.obstacleDensity[1]
    )
    const targetObstacles = Math.floor(totalCells * density)

    const obstacleSet = new Set()

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`
        if (!pathSet.has(key)) {
          obstacleSet.add(key)
        }
      }
    }

    const nonPathCells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`
        if (!pathSet.has(key)) {
          nonPathCells.push({ row: r, col: c, key })
        }
      }
    }

    const shuffled = this.rng.shuffle(nonPathCells)
    const currentObsList = () => {
      const arr = []
      for (const key of obstacleSet) {
        const [r, c] = key.split(',').map(Number)
        arr.push({ row: r, col: c })
      }
      return arr
    }

    for (const cell of shuffled) {
      if (obstacleSet.size <= targetObstacles) break

      if (!obstacleSet.has(cell.key)) continue

      obstacleSet.delete(cell.key)

      const obsList = currentObsList()
      const hasAlt = this._hasAlternativePath(
        correctPath[0],
        correctPath[correctPath.length - 1],
        rows,
        cols,
        obsList,
        pathSet
      )

      if (hasAlt) {
        obstacleSet.add(cell.key)
      }
    }

    const obstacles = []
    for (const key of obstacleSet) {
      const [r, c] = key.split(',').map(Number)
      obstacles.push({ row: r, col: c })
    }

    return obstacles
  }

  _carveDeadEnds(correctPath, obstacleSet, rows, cols, pathSet) {
    const pathLen = correctPath.length
    const numDeadEnds = Math.floor(pathLen * 0.3) + this.rng.nextInt(1, 3)
    const maxDeadEndLen = Math.floor(pathLen * 0.25) + 2

    const pathIndices = []
    for (let i = 1; i < pathLen - 1; i++) {
      pathIndices.push(i)
    }
    const shuffledIndices = this.rng.shuffle(pathIndices)

    let carved = 0
    for (const idx of shuffledIndices) {
      if (carved >= numDeadEnds) break

      const cell = correctPath[idx]
      const neighbors = this._getDeadEndDirections(cell, rows, cols, obstacleSet)

      if (neighbors.length === 0) continue

      let dir = this.rng.pick(neighbors)
      const deadEndLen = this.rng.nextInt(1, maxDeadEndLen)

      let current = {
        row: cell.row + dir.dr,
        col: cell.col + dir.dc
      }

      let carvedThisTime = 0
      for (let i = 0; i < deadEndLen; i++) {
        const key = `${current.row},${current.col}`
        if (!obstacleSet.has(key)) break
        if (pathSet.has(key)) break

        obstacleSet.delete(key)
        carvedThisTime++

        const nextDirs = this._getDeadEndDirections(current, rows, cols, obstacleSet)
        const forwardDirs = nextDirs.filter(d => !(d.dr === -dir.dr && d.dc === -dir.dc))

        if (forwardDirs.length === 0) break

        const nextDir = this.rng.pick(forwardDirs)
        current = {
          row: current.row + nextDir.dr,
          col: current.col + nextDir.dc
        }
        dir = nextDir
      }

      if (carvedThisTime > 0) {
        carved++
      }
    }
  }

  _getDeadEndDirections(cell, rows, cols, obstacleSet) {
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ]

    const result = []
    for (const d of dirs) {
      const nr = cell.row + d.dr
      const nc = cell.col + d.dc
      const key = `${nr},${nc}`
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && obstacleSet.has(key)) {
        result.push(d)
      }
    }
    return result
  }

  _hasAlternativePath(start, end, rows, cols, obstacles, pathSet) {
    const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
    const startKey = `${start.row},${start.col}`
    const endKey = `${end.row},${end.col}`
    
    if (obsSet.has(startKey) || obsSet.has(endKey)) {
      return false
    }
    
    const pathCells = []
    for (const key of pathSet) {
      const [r, c] = key.split(',').map(Number)
      pathCells.push({ row: r, col: c, key })
    }
    
    for (const cell of pathCells) {
      if (cell.row === start.row && cell.col === start.col) continue
      if (cell.row === end.row && cell.col === end.col) continue
      
      obsSet.add(cell.key)
      
      const hasPath = this._bfsHasPath(start, end, rows, cols, obsSet)
      
      obsSet.delete(cell.key)
      
      if (hasPath) {
        return true
      }
    }
    
    for (let i = 0; i < pathCells.length; i++) {
      for (let j = i + 1; j < pathCells.length; j++) {
        const c1 = pathCells[i]
        const c2 = pathCells[j]
        const dr = Math.abs(c1.row - c2.row)
        const dc = Math.abs(c1.col - c2.col)
        if (dr + dc !== 1) continue
        
        if ((c1.row === start.row && c1.col === start.col) || 
            (c2.row === start.row && c2.col === start.col)) continue
        if ((c1.row === end.row && c1.col === end.col) || 
            (c2.row === end.row && c2.col === end.col)) continue
        
        obsSet.add(c1.key)
        obsSet.add(c2.key)
        
        const hasPath = this._bfsHasPath(start, end, rows, cols, obsSet)
        
        obsSet.delete(c1.key)
        obsSet.delete(c2.key)
        
        if (hasPath) {
          return true
        }
      }
    }
    
    return this._dfsHasAlternative(start, end, rows, cols, obstacles, pathSet)
  }

  _dfsHasAlternative(start, end, rows, cols, obstacles, pathSet) {
    const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
    const startKey = `${start.row},${start.col}`
    const endKey = `${end.row},${end.col}`
    
    let pathCount = 0
    const maxPathsToFind = 2
    const maxSearch = 2000000
    let searched = 0
    
    const totalCells = rows * cols
    const maxPathLen = totalCells
    
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ]
    
    const stack = [{
      row: start.row,
      col: start.col,
      visited: new Set([startKey]),
      len: 1,
      hasDeviated: false
    }]
    
    while (stack.length > 0 && pathCount < maxPathsToFind && searched < maxSearch) {
      searched++
      const current = stack.pop()
      const currentKey = `${current.row},${current.col}`
      
      if (currentKey === endKey) {
        if (current.hasDeviated) {
          pathCount++
          if (pathCount >= 1) {
            return true
          }
        } else {
          pathCount++
          if (pathCount >= maxPathsToFind) {
            return true
          }
        }
        continue
      }
      
      if (current.len >= maxPathLen) {
        continue
      }
      
      const remainingMin = Math.abs(current.row - end.row) + Math.abs(current.col - end.col)
      if (current.len + remainingMin > maxPathLen) {
        continue
      }
      
      for (let i = dirs.length - 1; i >= 0; i--) {
        const d = dirs[i]
        const nr = current.row + d.dr
        const nc = current.col + d.dc
        const nKey = `${nr},${nc}`
        
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        if (obsSet.has(nKey)) continue
        if (current.visited.has(nKey)) continue
        
        const nextRemaining = Math.abs(nr - end.row) + Math.abs(nc - end.col)
        if (current.len + 1 + nextRemaining > maxPathLen) continue
        
        const nextDeviated = current.hasDeviated || !pathSet.has(nKey)
        const newVisited = new Set(current.visited)
        newVisited.add(nKey)
        stack.push({
          row: nr,
          col: nc,
          visited: newVisited,
          len: current.len + 1,
          hasDeviated: nextDeviated
        })
      }
    }
    
    return pathCount > 1
  }

  _bfsHasPath(start, end, rows, cols, obsSet) {
    const startKey = `${start.row},${start.col}`
    const endKey = `${end.row},${end.col}`
    
    if (obsSet.has(startKey) || obsSet.has(endKey)) {
      return false
    }
    
    const visited = new Set([startKey])
    const queue = [{ row: start.row, col: start.col }]
    
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ]
    
    while (queue.length > 0) {
      const current = queue.shift()
      const currentKey = `${current.row},${current.col}`
      
      if (currentKey === endKey) {
        return true
      }
      
      for (const d of dirs) {
        const nr = current.row + d.dr
        const nc = current.col + d.dc
        const nKey = `${nr},${nc}`
        
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        if (obsSet.has(nKey)) continue
        if (visited.has(nKey)) continue
        
        visited.add(nKey)
        queue.push({ row: nr, col: nc })
      }
    }
    
    return false
  }

  _generatePlants(correctPath, obstacles, rows, cols) {
    const plants = []
    const pathSet = new Set(correctPath.map(p => `${p.row},${p.col}`))
    const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))

    const pathLen = correctPath.length
    const minPlantsOnPath = Math.ceil(pathLen * 0.6)
    const targetPlantsOnPath = Math.ceil(pathLen * 0.85)

    const pathCells = correctPath.slice(1, pathLen - 1)
    const shuffledPath = this.rng.shuffle(pathCells)

    let placedOnPath = 0
    for (const cell of shuffledPath) {
      if (placedOnPath >= targetPlantsOnPath) break

      const type = this._pickPlantType()
      plants.push({ row: cell.row, col: cell.col, type })
      placedOnPath++
    }

    if (placedOnPath < minPlantsOnPath) {
      for (const cell of shuffledPath) {
        const exists = plants.some(p => p.row === cell.row && p.col === cell.col)
        if (!exists) {
          const type = this._pickPlantType()
          plants.push({ row: cell.row, col: cell.col, type })
          placedOnPath++
          if (placedOnPath >= minPlantsOnPath) break
        }
      }
    }

    const extraPlantTargets = Math.floor(rows * cols * 0.1)
    const offPathCandidates = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`
        if (!pathSet.has(key) && !obsSet.has(key)) {
          offPathCandidates.push({ row: r, col: c })
        }
      }
    }

    const shuffledOff = this.rng.shuffle(offPathCandidates)
    for (let i = 0; i < Math.min(extraPlantTargets, shuffledOff.length); i++) {
      const cell = shuffledOff[i]
      const type = this._pickPlantType()
      plants.push({ row: cell.row, col: cell.col, type })
    }

    return plants
  }

  _pickPlantType() {
    const weights = [0.5, 0.35, 0.15]
    const r = this.rng.next()
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i]
      if (r < sum) return PLANT_TYPE_KEYS[i]
    }
    return 'moss'
  }

  _generateName() {
    const names = LEVEL_NAMES[this.difficulty - 1]
    return this.rng.pick(names)
  }

  _generateDescription(level) {
    const templates = [
      `难度${this.config.name}：从${this._posText(level.start, level.gridSize)}出发，寻找通往${this._posText(level.end, level.gridSize)}的道路`,
      `穿越这片神秘的区域，点亮沿途的荧光植物`,
      `在迷宫般的网格中，找出唯一正确的路径`,
      `小心障碍物，规划好每一步的路线`,
      `让光芒指引你前进的方向`
    ]
    return this.rng.pick(templates)
  }

  _posText(pos, gridSize) {
    const dirs = []
    const { rows, cols } = gridSize
    if (pos.row === 0) dirs.push('上方')
    else if (pos.row === rows - 1) dirs.push('下方')
    if (pos.col === 0) dirs.push('左侧')
    else if (pos.col === cols - 1) dirs.push('右侧')
    if (dirs.length === 0) {
      return `(${pos.row},${pos.col})位置`
    }
    return dirs.join('')
  }

  _generateHint(level) {
    const pathLen = level.correctPath.length

    const hints = [
      `从起点出发，注意避开障碍物`,
      `路径长度约 ${pathLen} 步，寻找最直接的路线`,
      `注意路径上的植物，它们是你的路标`,
      this._generateDirectionHint(level.start, level.end),
      `可以先观察全局，再规划路线`
    ]

    return this.rng.pick(hints)
  }

  _generateDirectionHint(start, end) {
    const dr = end.row - start.row
    const dc = end.col - start.col

    const vertical = dr > 0 ? '向下' : '向上'
    const horizontal = dc > 0 ? '向右' : '向左'

    if (Math.abs(dr) > Math.abs(dc)) {
      return `主要方向是${vertical}，适当${horizontal}移动`
    } else if (Math.abs(dc) > Math.abs(dr)) {
      return `主要方向是${horizontal}，适当${vertical}移动`
    } else {
      return `${vertical}与${horizontal}交替进行`
    }
  }

  static validateLevel(level, strict = true) {
    const { gridSize, start, end, obstacles, correctPath } = level
    const { rows, cols } = gridSize

    if (!correctPath || correctPath.length < 2) {
      return { valid: false, error: '路径太短' }
    }

    if (correctPath[0].row !== start.row || correctPath[0].col !== start.col) {
      return { valid: false, error: '路径起点不匹配' }
    }

    const last = correctPath[correctPath.length - 1]
    if (last.row !== end.row || last.col !== end.col) {
      return { valid: false, error: '路径终点不匹配' }
    }

    const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
    for (const cell of correctPath) {
      const key = `${cell.row},${cell.col}`
      if (obsSet.has(key)) {
        return { valid: false, error: '路径穿过障碍物' }
      }
    }

    for (let i = 1; i < correctPath.length; i++) {
      const a = correctPath[i - 1]
      const b = correctPath[i]
      const dr = Math.abs(a.row - b.row)
      const dc = Math.abs(a.col - b.col)
      if (dr + dc !== 1) {
        return { valid: false, error: '路径有跳步' }
      }
    }

    const pathSet = new Set()
    for (const cell of correctPath) {
      const key = `${cell.row},${cell.col}`
      if (pathSet.has(key)) {
        return { valid: false, error: '路径有重复节点' }
      }
      pathSet.add(key)
    }

    if (strict) {
      const tempGen = new LevelGenerator(1, 1)
      const hasAlt = tempGen._hasAlternativePath(
        start, end, rows, cols, obstacles,
        new Set(correctPath.map(p => `${p.row},${p.col}`))
      )

      if (hasAlt) {
        return { valid: false, error: '存在多条路径' }
      }
    }

    return { valid: true }
  }
}
