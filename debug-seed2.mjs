import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

const seed = 5
const diff = 4

console.log(`=== 调试种子 ${seed}, 难度 ${diff} ===\n`)

const generator = new LevelGenerator(diff, seed)
const level = generator.generate()

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

console.log('\n测试 _hasAlternativePath:')
const tempGen = new LevelGenerator(1, 1)
const result = tempGen._hasAlternativePath(
  level.start, level.end, rows, cols, level.obstacles, pathSet
)
console.log(`_hasAlternativePath 返回: ${result}`)

console.log('\n手动搜索所有路径（不限制长度）:')
function findAllPaths(level, maxPaths = 5) {
  const { start, end, gridSize, obstacles } = level
  const { rows, cols } = gridSize
  
  const obsSet = new Set(obstacles.map(o => `${o.row},${o.col}`))
  
  const paths = []
  const stack = [{ 
    row: start.row, 
    col: start.col, 
    path: [{ row: start.row, col: start.col }], 
    visited: new Set([`${start.row},${start.col}`]) 
  }]
  
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ]
  
  let iterations = 0
  const maxIterations = 500000
  
  while (stack.length > 0 && paths.length < maxPaths && iterations < maxIterations) {
    iterations++
    const current = stack.pop()
    
    if (current.row === end.row && current.col === end.col) {
      paths.push([...current.path])
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
      const newPath = [...current.path, { row: nr, col: nc }]
      stack.push({ row: nr, col: nc, path: newPath, visited: newVisited })
    }
  }
  
  console.log(`搜索了 ${iterations} 次迭代`)
  return paths
}

const allPaths = findAllPaths(level, 3)
console.log(`找到 ${allPaths.length} 条路径`)
for (let i = 0; i < allPaths.length; i++) {
  console.log(`\n路径 ${i + 1} (长度 ${allPaths[i].length}):`)
  console.log(`  ${allPaths[i].map(p => `(${p.row},${p.col})`).join(' → ')}`)
}
