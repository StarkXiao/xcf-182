import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

function hasMultiplePaths(level) {
  const { start, end, gridSize, obstacles, correctPath } = level
  const { rows, cols } = gridSize
  
  const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
  const pathSet = new Set(correctPath.map(p => `${p.row},${p.col}`))
  
  const queue = [{ row: start.row, col: start.col, hasLeftPath: false }]
  const visited = new Set()
  visited.add(`${start.row},${start.col}|false`)
  
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ]
  
  let pathCount = 0
  
  while (queue.length > 0) {
    const current = queue.shift()
    const currentKey = `${current.row},${current.col}`
    
    if (currentKey === `${end.row},${end.col}`) {
      if (current.hasLeftPath) {
        return true
      }
      pathCount++
      if (pathCount > 1) return true
      continue
    }
    
    for (const d of dirs) {
      const nr = current.row + d.dr
      const nc = current.col + d.dc
      const nKey = `${nr},${nc}`
      
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (obsSet.has(nKey)) continue
      
      const nextHasLeft = current.hasLeftPath || !pathSet.has(nKey)
      const stateKey = `${nKey}|${nextHasLeft}`
      
      if (visited.has(stateKey)) continue
      
      visited.add(stateKey)
      queue.push({ row: nr, col: nc, hasLeftPath: nextHasLeft })
    }
  }
  
  return false
}

console.log('=== 寻找有多条路径的种子 ===\n')

let badSeeds = []
const testCount = 200

for (let seed = 1; seed <= testCount; seed++) {
  for (let diff = 1; diff <= 5; diff++) {
    try {
      const generator = new LevelGenerator(diff, seed)
      const level = generator.generate()
      
      if (hasMultiplePaths(level)) {
        badSeeds.push({ seed, diff, level })
        console.log(`✗ 种子 ${seed}, 难度 ${diff}: 存在多条路径`)
      }
    } catch (e) {
      console.log(`! 种子 ${seed}, 难度 ${diff}: 错误 - ${e.message}`)
    }
  }
}

console.log(`\n=== 测试完成 ===`)
console.log(`测试了 ${testCount * 5} 个关卡`)
console.log(`发现 ${badSeeds.length} 个问题关卡`)

if (badSeeds.length > 0) {
  console.log('\n=== 问题关卡详情 ===')
  const firstBad = badSeeds[0]
  console.log(`\n种子: ${firstBad.seed}, 难度: ${firstBad.diff}`)
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
}
