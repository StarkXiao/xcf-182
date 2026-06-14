import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

console.log('=== 最终验证：测试所有种子的路径唯一性 ===\n')

let badSeeds = []
const testCount = 200

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
        badSeeds.push({ seed, diff, level })
        console.log(`✗ 种子 ${seed}, 难度 ${diff}: 存在多条路径`)
      }
      
      const validation = LevelGenerator.validateLevel(level, true)
      if (!validation.valid) {
        console.log(`! 种子 ${seed}, 难度 ${diff}: 验证失败 - ${validation.error}`)
      }
      
    } catch (e) {
      console.log(`! 种子 ${seed}, 难度 ${diff}: 错误 - ${e.message}`)
    }
  }
  
  if (seed % 20 === 0) {
    console.log(`已测试 ${seed * 5} 个关卡...`)
  }
}

console.log(`\n=== 测试完成 ===`)
console.log(`测试了 ${testCount * 5} 个关卡`)
console.log(`发现 ${badSeeds.length} 个问题关卡`)

if (badSeeds.length === 0) {
  console.log('\n🎉 所有关卡路径唯一！验证通过！')
} else {
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
}

console.log('\n=== 运行原测试套件 ===')
