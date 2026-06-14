import { LevelGenerator } from './src/game/modules/LevelGenerator.js'

const seed = 5
const diff = 4

const generator = new LevelGenerator(diff, seed)
const level = generator.generate()

const { rows, cols } = level.gridSize
const obsSet = new Set(level.obstacles.map(o => `${o.row},${o.col}`))
const pathSet = new Set(level.correctPath.map(p => `${p.row},${p.col}`))

console.log(`=== 问题关卡分析：种子 ${seed}, 难度 ${diff} ===\n`)
console.log(`网格: ${rows}×${cols}, 起点: (${level.start.row},${level.start.col}), 终点: (${level.end.row},${level.end.col})`)
console.log(`路径长度: ${level.correctPath.length}, 障碍物: ${level.obstacles.length}`)

console.log('\n关卡地图:')
for (let r = 0; r < rows; r++) {
  let line = ''
  for (let c = 0; c < cols; c++) {
    const key = `${r},${c}`
    if (r === level.start.row && c === level.start.col) line += '▶ '
    else if (r === level.end.row && c === level.end.col) line += '◀ '
    else if (obsSet.has(key)) line += '█ '
    else if (pathSet.has(key)) line += '· '
    else line += '○ '
  }
  console.log(line)
}

console.log('\n正确路径:')
console.log(level.correctPath.map(p => `(${p.row},${p.col})`).join(' → '))

console.log('\n=== 分析非路径可通行区域 ===')
const walkableNonPath = []
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const key = `${r},${c}`
    if (!obsSet.has(key) && !pathSet.has(key)) {
      walkableNonPath.push({ r, c })
    }
  }
}
console.log(`非路径可通行格子: ${walkableNonPath.length} 个`)
console.log(walkableNonPath.map(p => `(${p.r},${p.c})`).join(', '))

console.log('\n=== 暴力搜索所有路径（无限制） ===')
function findAllPaths(start, end, rows, cols, obsSet, maxPaths = 10) {
  const startKey = `${start.row},${start.col}`
  const endKey = `${end.row},${end.col}`
  const paths = []
  
  const stack = [{
    row: start.row, col: start.col,
    path: [{ row: start.row, col: start.col }],
    visited: new Set([startKey])
  }]
  
  const dirs = [
    { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
    { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
  ]
  
  let iterations = 0
  const maxIter = 5000000
  
  while (stack.length > 0 && paths.length < maxPaths && iterations < maxIter) {
    iterations++
    const cur = stack.pop()
    const curKey = `${cur.row},${cur.col}`
    
    if (curKey === endKey) {
      paths.push([...cur.path])
      continue
    }
    
    for (let i = dirs.length - 1; i >= 0; i--) {
      const d = dirs[i]
      const nr = cur.row + d.dr
      const nc = cur.col + d.dc
      const nKey = `${nr},${nc}`
      
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (obsSet.has(nKey)) continue
      if (cur.visited.has(nKey)) continue
      
      const newVisited = new Set(cur.visited)
      newVisited.add(nKey)
      stack.push({
        row: nr, col: nc,
        path: [...cur.path, { row: nr, col: nc }],
        visited: newVisited
      })
    }
  }
  
  console.log(`搜索迭代: ${iterations}`)
  return paths
}

const allPaths = findAllPaths(level.start, level.end, rows, cols, obsSet, 5)
console.log(`找到 ${allPaths.length} 条路径`)
for (let i = 0; i < allPaths.length; i++) {
  const p = allPaths[i]
  let offPathCount = 0
  for (const cell of p) {
    if (!pathSet.has(`${cell.row},${cell.col}`)) offPathCount++
  }
  console.log(`\n路径 ${i + 1} (长度 ${p.length}, 偏离路径 ${offPathCount} 格):`)
  console.log(`  ${p.map(c => `(${c.row},${c.col})`).join(' → ')}`)
}

console.log('\n=== _hasAlternativePath 详细分析 ===')
const gen = new LevelGenerator(1, 1)
console.log('返回值:', gen._hasAlternativePath(level.start, level.end, rows, cols, level.obstacles, pathSet))
