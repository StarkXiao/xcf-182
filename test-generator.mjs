import { LevelGenerator } from './src/game/modules/LevelGenerator.js'
import { LEVELS } from './src/game/data/levels.js'

function printLevelGrid(level) {
  const { rows, cols } = level.gridSize
  const grid = []
  
  for (let r = 0; r < rows; r++) {
    grid[r] = []
    for (let c = 0; c < cols; c++) {
      grid[r][c] = '·'
    }
  }
  
  for (const obs of level.obstacles) {
    grid[obs.row][obs.col] = '█'
  }
  
  for (const p of level.plants) {
    if (grid[p.row][p.col] === '·') {
      const symbol = { moss: '♣', mushroom: '♠', flower: '♥' }[p.type] || '?'
      grid[p.row][p.col] = symbol
    }
  }
  
  for (const cell of level.correctPath) {
    if (grid[cell.row][cell.col] === '·') {
      grid[cell.row][cell.col] = '○'
    }
  }
  
  grid[level.start.row][level.start.col] = '▶'
  grid[level.end.row][level.end.col] = '◀'
  
  console.log()
  for (let r = 0; r < rows; r++) {
    console.log('  ' + grid[r].join(' '))
  }
  console.log()
}

function testSeedReproducibility() {
  console.log('\n=== 测试种子复现性 ===')
  
  const seed = 123456
  const diff = 3
  
  const gen1 = new LevelGenerator(diff, seed)
  const level1 = gen1.generate()
  
  const gen2 = new LevelGenerator(diff, seed)
  const level2 = gen2.generate()
  
  const json1 = JSON.stringify(level1.correctPath)
  const json2 = JSON.stringify(level2.correctPath)
  
  if (json1 === json2) {
    console.log('✓ 种子复现性测试通过')
  } else {
    console.log('✗ 种子复现性测试失败')
    console.log('  路径1:', json1)
    console.log('  路径2:', json2)
    return false
  }
  return true
}

function testDifficultyLevels() {
  console.log('\n=== 测试难度等级 ===')
  
  let allPass = true
  
  for (let diff = 1; diff <= 5; diff++) {
    let validCount = 0
    const totalTests = 10
    const pathLens = []
    const obsCounts = []
    const gridSizes = []
    
    for (let i = 0; i < totalTests; i++) {
      const gen = new LevelGenerator(diff, 1000 + diff * 100 + i)
      const level = gen.generate()
      const validation = LevelGenerator.validateLevel(level)
      
      if (validation.valid) {
        validCount++
      } else {
        console.log(`  难度${diff} 测试${i} 失败: ${validation.error}`)
      }
      
      pathLens.push(level.correctPath.length)
      obsCounts.push(level.obstacles.length)
      gridSizes.push(level.gridSize.rows * level.gridSize.cols)
    }
    
    const avgPath = (pathLens.reduce((a, b) => a + b, 0) / pathLens.length).toFixed(1)
    const avgObs = (obsCounts.reduce((a, b) => a + b, 0) / obsCounts.length).toFixed(1)
    const avgGrid = (gridSizes.reduce((a, b) => a + b, 0) / gridSizes.length).toFixed(1)
    const passRate = ((validCount / totalTests) * 100).toFixed(0)
    
    console.log(`  难度${diff}: 通过率${passRate}% | 网格~${avgGrid}格 | 路径~${avgPath}步 | 障碍~${avgObs}个`)
    
    if (validCount < totalTests) allPass = false
  }
  
  return allPass
}

function testExistingLevels() {
  console.log('\n=== 验证原有关卡数据 (宽松模式) ===')
  
  let allPass = true
  
  for (const level of LEVELS) {
    const validation = LevelGenerator.validateLevel(level, false)
    
    if (validation.valid) {
      console.log(`  ✓ ${level.name}: 验证通过 (路径${level.correctPath.length}步)`)
    } else {
      console.log(`  ✗ ${level.name}: ${validation.error}`)
      allPass = false
    }
  }
  
  return allPass
}

function testSampleOutputs() {
  console.log('\n=== 示例关卡输出 ===')
  
  for (let diff = 1; diff <= 5; diff += 2) {
    const seed = 42 + diff
    const gen = new LevelGenerator(diff, seed)
    const level = gen.generate()
    
    console.log(`\n────────────────────────`)
    console.log(`  难度 ${diff} | 种子 ${seed}`)
    console.log(`  ${level.name}: ${level.description}`)
    printLevelGrid(level)
    console.log(`  正确路径: ${level.correctPath.length} 步`)
    console.log(`  障碍物: ${level.obstacles.length} 个`)
    console.log(`  植物: ${level.plants.length} 个`)
    console.log(`  网格: ${level.gridSize.rows}×${level.gridSize.cols}`)
    console.log(`  提示: ${level.hint}`)
  }
}

function runAllTests() {
  console.log('========================================')
  console.log('   随机关卡生成器 测试套件')
  console.log('========================================')
  
  const results = []
  
  results.push({ name: '种子复现性', pass: testSeedReproducibility() })
  results.push({ name: '原有关卡验证', pass: testExistingLevels() })
  results.push({ name: '难度等级测试', pass: testDifficultyLevels() })
  
  testSampleOutputs()
  
  console.log('\n========================================')
  console.log('   测试总结')
  console.log('========================================')
  
  let allPass = true
  for (const r of results) {
    const status = r.pass ? '✓ 通过' : '✗ 失败'
    console.log(`  ${r.name}: ${status}`)
    if (!r.pass) allPass = false
  }
  
  console.log()
  if (allPass) {
    console.log('🎉 所有测试通过！')
  } else {
    console.log('⚠️  部分测试失败，请检查代码')
  }
  
  return allPass ? 0 : 1
}

process.exit(runAllTests())
