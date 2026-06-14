import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

function countAllPaths(level) {
  const { start, end, gridSize, obstacles } = level
  const { rows, cols } = gridSize
  
  const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
  
  const queue = [{ row: start.row, col: start.col, visited: new Set([`${start.row},${start.col}`]) }]
  
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ]
  
  let pathCount = 0
  let maxSearch = 100000
  let searched = 0
  
  while (queue.length > 0 && searched < maxSearch) {
    const current = queue.shift()
    searched++
    
    if (current.row === end.row && current.col === end.col) {
      pathCount++
      if (pathCount > 1) return pathCount
      continue
    }
    
    for (const d of dirs) {
      const nr = current.row + d.dr
      const nc = current.col + d.dc
      const nKey = `${nr},${nc}`
      
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (obsSet.has(nKey)) continue
      if (current.visited.has(nKey)) continue
      
      const newVisited = new Set(current.visited)
      newVisited.add(nKey)
      queue.push({ row: nr, col: nc, visited: newVisited })
    }
  }
  
  return pathCount
}

console.log('=== 严格测试：寻找有多条路径的种子 ===\n')

let badSeeds = []
const testCount = 100

for (let seed = 1; seed <= testCount; seed++) {
  for (let diff = 1; diff <= 5; diff++) {
    try {
      const generator = new LevelGenerator(diff, seed)
      const level = generator.generate()
      
      const pathCount = countAllPaths(level)
      
      if (pathCount > 1) {
        badSeeds.push({ seed, diff, level, pathCount })
        console.log(`✗ 种子 ${seed}, 难度 ${diff}: 发现 ${pathCount} 条路径`)
      }
    } catch (e) {
      console.log(`! 种子 ${seed}, 难度 ${diff}: 错误 - ${e.message}`)
    }
  }
  
  if (seed % 10 === 0) {
    console.log(`已测试 ${seed * 5} 个关卡...`)
  }
}

console.log(`\n=== 测试完成 ===`)
console.log(`测试了 ${testCount * 5} 个关卡`)
console.log(`发现 ${badSeeds.length} 个问题关卡`)

if (badSeeds.length > 0) {
  console.log('\n=== 问题关卡详情 ===')
  const firstBad = badSeeds[0]
  console.log(`\n种子: ${firstBad.seed}, 难度: ${firstBad.diff}, 路径数: ${firstBad.pathCount}`)
  const level = firstBad.level
  const { rows, cols } = level.gridSize
  const obsSet = new Set(level.obstacles.map(o => `${o.row},${o.col}`))
  const pathSet = new Set(level.correctPath.map(p => `${p.row},${p.col}`))
  
  console.log(`网格: ${rows}×${cols}`)
  console.log(`起点: (${level.start.row},${level.start.col})`)
  console.log(`终点: (${level.end.row},${level.end.col})`)
  console.log(`路径长度: ${level.correctPath.length}`)
  console.log(`障碍物: ${level.obstacles.length}`)
  
  console.log('\n关卡地图:')
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`
      if (r === level.start.row && c === level.start.col) {
        line += '▶ '
      } else if (r === level.end.row && c === level.end.col) {
        line += '◀ '
      } else if (obsSet.has(key)) {
        line += '█ '
      } else if (pathSet.has(key)) {
        line += '· '
      } else {
        line += '○ '
      }
    }
    console.log(line)
  }
  
  console.log('\n正确路径:')
  console.log(level.correctPath.map(p => `(${p.row},${p.col})`).join(' → '))
  
  console.log('\n用 _hasAlternativePath 检测:')
  const tempGen = new LevelGenerator(1, 1)
  const hasAlt = tempGen._hasAlternativePath(
    level.start, level.end, rows, cols, level.obstacles,
    new Set(level.correctPath.map(p => `${p.row},${p.col}`))
  )
  console.log(`_hasAlternativePath 返回: ${hasAlt}`)
}
