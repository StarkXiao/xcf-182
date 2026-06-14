import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

function countAllPathsBrutal(level) {
  const { start, end, gridSize, obstacles } = level
  const { rows, cols } = gridSize
  
  const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
  const startKey = `${start.row},${start.col}`
  const endKey = `${end.row},${end.col}`
  
  let pathCount = 0
  const maxPathsToFind = 3
  
  const stack = [{
    row: start.row,
    col: start.col,
    visited: new Set([startKey])
  }]
  
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ]
  
  let iterations = 0
  const maxIterations = 2000000
  
  while (stack.length > 0 && pathCount < maxPathsToFind && iterations < maxIterations) {
    iterations++
    const current = stack.pop()
    const currentKey = `${current.row},${current.col}`
    
    if (currentKey === endKey) {
      pathCount++
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
      
      const newVisited = new Set(current.visited)
      newVisited.add(nKey)
      stack.push({ row: nr, col: nc, visited: newVisited })
    }
  }
  
  return { pathCount, iterations }
}

console.log('=== 严格枚举路径数 ===\n')

let badSeeds = []
const testCount = 150

for (let seed = 1; seed <= testCount; seed++) {
  for (let diff = 1; diff <= 5; diff++) {
    try {
      const generator = new LevelGenerator(diff, seed)
      const level = generator.generate()
      
      const result = countAllPathsBrutal(level)
      
      if (result.pathCount > 1) {
        badSeeds.push({ seed, diff, level, pathCount: result.pathCount })
        console.log(`✗ 种子 ${seed}, 难度 ${diff}: ${result.pathCount} 条路径 (迭代${result.iterations})`)
      }
    } catch (e) {
      console.log(`! 种子 ${seed}, 难度 ${diff}: 错误 - ${e.message}`)
    }
  }
  
  if (seed % 25 === 0) {
    console.log(`已测试 ${seed * 5} 个关卡...`)
  }
}

console.log(`\n=== 测试完成 ===`)
console.log(`测试了 ${testCount * 5} 个关卡`)
console.log(`发现 ${badSeeds.length} 个问题关卡`)

if (badSeeds.length > 0) {
  console.log('\n=== 第一个问题关卡 ===')
  const first = badSeeds[0]
  const { rows, cols } = first.level.gridSize
  const obsSet = new Set(first.level.obstacles.map(o => `${o.row},${o.col}`))
  const pathSet = new Set(first.level.correctPath.map(p => `${p.row},${p.col}`))
  
  console.log(`种子: ${first.seed}, 难度: ${first.diff}, 路径数: ${first.pathCount}`)
  
  console.log('\n关卡地图:')
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`
      if (r === first.level.start.row && c === first.level.start.col) {
        line += '▶ '
      } else if (r === first.level.end.row && c === first.level.end.col) {
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
  console.log(first.level.correctPath.map(p => `(${p.row},${p.col})`).join(' → '))
  
  console.log('\n_hasAlternativePath 返回:')
  const gen = new LevelGenerator(1, 1)
  const result = gen._hasAlternativePath(
    first.level.start, first.level.end, rows, cols, first.level.obstacles, pathSet
  )
  console.log(`  ${result}`)
}
