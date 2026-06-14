import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

console.log('=== 批量路径唯一性验证（使用改进后的 _hasAlternativePath） ===\n')

let badSeeds = []
const testCount = 300

for (let seed = 1; seed <= testCount; seed++) {
  for (let diff = 1; diff <= 5; diff++) {
    try {
      const generator = new LevelGenerator(diff, seed)
      const level = generator.generate()
      
      const pathSet = new Set(level.correctPath.map(p => `${p.row},${p.col}`))
      const hasAlt = generator._hasAlternativePath(
        level.start,
        level.end,
        level.gridSize.rows,
        level.gridSize.cols,
        level.obstacles,
        pathSet
      )
      
      if (hasAlt) {
        badSeeds.push({ seed, diff })
        console.log(`✗ 种子 ${seed}, 难度 ${diff}: 检测到多条路径`)
      }
      
      const validation = LevelGenerator.validateLevel(level, true)
      if (!validation.valid) {
        console.log(`! 种子 ${seed}, 难度 ${diff}: 验证失败 - ${validation.error}`)
      }
      
    } catch (e) {
      console.log(`! 种子 ${seed}, 难度 ${diff}: 错误 - ${e.message}`)
    }
  }
  
  if (seed % 50 === 0) {
    console.log(`已测试 ${seed * 5} 个关卡... (发现 ${badSeeds.length} 个问题)`)
  }
}

console.log(`\n=== 测试完成 ===`)
console.log(`测试了 ${testCount * 5} 个关卡`)
console.log(`发现 ${badSeeds.length} 个问题关卡`)

if (badSeeds.length === 0) {
  console.log('\n🎉 所有关卡路径唯一！验证通过！')
}

console.log('\n=== 再抽查5个问题关卡用暴力枚举确认 ===')
const checkCount = Math.min(5, badSeeds.length)

function countAllPathsBrutal(level) {
  const { start, end, gridSize, obstacles } = level
  const { rows, cols } = gridSize
  
  const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
  let pathCount = 0
  const maxPathsToFind = 3
  
  const stack = [{
    row: start.row,
    col: start.col,
    visited: new Set([`${start.row},${start.col}`])
  }]
  
  const dirs = [
    { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
    { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
  ]
  
  let iterations = 0
  const maxIterations = 3000000
  
  while (stack.length > 0 && pathCount < maxPathsToFind && iterations < maxIterations) {
    iterations++
    const current = stack.pop()
    const currentKey = `${current.row},${current.col}`
    
    if (currentKey === `${end.row},${end.col}`) {
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

for (let i = 0; i < checkCount; i++) {
  const { seed, diff } = badSeeds[i]
  const generator = new LevelGenerator(diff, seed)
  const level = generator.generate()
  
  const result = countAllPathsBrutal(level)
  console.log(`  抽查 ${i + 1}: 种子 ${seed}, 难度 ${diff} -> 暴力枚举找到 ${result.pathCount} 条路径 (迭代 ${result.iterations})`)
}

if (checkCount === 0) {
  console.log('  没有问题关卡需要抽查')
}
