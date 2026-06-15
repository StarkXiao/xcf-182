# PathJudge 拖拽校验链与 LevelMap 网格数据协作分析

## 1. 核心架构概览

### 1.1 模块职责分工

| 模块 | 职责 | 关键数据 |
|------|------|----------|
| **PathJudge** | 拖拽交互、路径校验、历史管理、特殊效果处理 | `selectedPath`、`historyStack`、`redoStack` |
| **LevelMap** | 网格数据管理、坐标转换、障碍物查询、渲染 | `gridCells[][]`、`currentLevel`、`cellSize`、`offsetX/Y` |

### 1.2 协作数据流

```
用户输入 (pointer)
    ↓
PathJudge.onPointerDown/Move/Up
    ↓ 调用 LevelMap 方法
LevelMap.getCellAtPosition(x, y)  → 屏幕坐标 → 网格坐标
LevelMap.getCellAt(row, col)       → 边界检查 + 获取单元格
LevelMap.areAdjacent(c1, c2)       → 相邻性判断
LevelMap.getObstacleAt(r, c)       → 查询障碍物
LevelMap.getWorldPosition(r, c)    → 网格坐标 → 屏幕坐标
    ↓
PathJudge 内部状态更新
    ↓
路径验证 validatePath()
    ↓
成功/失败回调
```

---

## 2. LevelMap 网格数据结构

### 2.1 网格核心数据

**文件**: `src/game/modules/LevelMap.js`

```javascript
// 二维数组存储所有单元格
this.gridCells[row][col] = {
  row, col,                // 网格坐标
  isObstacle,              // 是否有障碍物
  obstacleType,            // 'rock' | 'ice' | 'portal' | 'thorn' | null
  isStart, isEnd,          // 起点/终点标记
  plant,                   // 植物数据
  isLit,                   // 是否点亮
  isOnPath,                // 是否在当前路径上
  sprite                   // 渲染精灵
}
```

### 2.2 关键方法详解

#### `getCellAt(row, col)` - 带边界检查的单元格获取
```javascript
getCellAt(row, col) {
  if (row < 0 || row >= this.currentLevel.gridSize.rows ||
      col < 0 || col >= this.currentLevel.gridSize.cols) {
    return null  // ✅ 正确处理越界
  }
  return this.gridCells[row][col]
}
```

#### `getCellAtPosition(worldX, worldY)` - 屏幕坐标转网格坐标
```javascript
getCellAtPosition(worldX, worldY) {
  const col = Math.floor((worldX - this.offsetX) / this.cellSize)
  const row = Math.floor((worldY - this.offsetY) / this.cellSize)
  return this.getCellAt(row, col)  // ✅ 复用边界检查
}
```

#### `areAdjacent(cell1, cell2)` - 四方向相邻判断
```javascript
areAdjacent(cell1, cell2) {
  const rowDiff = Math.abs(cell1.row - cell2.row)
  const colDiff = Math.abs(cell1.col - cell2.col)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
  // ⚠️ 仅支持上下左右，不支持对角线
}
```

---

## 3. PathJudge 拖拽校验链

### 3.1 完整校验流程

**文件**: `src/game/modules/PathJudge.js`

```
onPointerDown
    ├─ getCellAtPosition() → 获取起点单元格
    ├─ 检查: !cell || obstacleType === 'rock' → 拦截
    ├─ 检查: isStart || isValidStart() → 确认起点
    └─ 初始化 selectedPath = [cell]

onPointerMove (核心校验链)
    ├─ 检查: !isDrawing → 拦截
    ├─ getCellAtPosition() → 获取当前单元格
    ├─ 检查: !cell || obstacleType === 'rock' → 拦截  [边界1]
    ├─ 检查: cell === lastCell → 去重
    ├─ 检查: 回退到上一格 (cell === prevCell) → 执行回退  [边界2]
    ├─ 检查: selectedPath.includes(cell) → 防止重复  [边界3]
    ├─ 检查: areAdjacent(lastCell, cell) → 相邻性  [边界4]
    ├─ addCellToPath(cell) → 添加到路径
    └─ 特殊处理:
        ├─ obstacleType === 'ice' → handleIceSlide()  [特殊1]
        └─ obstacleType === 'portal' → handlePortalTeleport()  [特殊2]

onPointerUp
    ├─ 检查: !isDrawing → 拦截
    ├─ 检查: lastCell.isEnd → 必须在终点结束
    └─ validatePath() → 完整路径验证
```

### 3.2 路径验证 `validatePath()`

```javascript
validatePath() {
  // 基础检查
  if (this.selectedPath.length < 2) return false
  if (!firstCell.isStart || !lastCell.isEnd) return false
  
  // 逐格校验
  for (let i = 0; i < this.selectedPath.length; i++) {
    if (cell.obstacleType === 'rock') return false  // 岩石检查
    
    if (i > 0) {
      const isPortalJump = this.isPortalJump(prevCell, cell)
      // 相邻或传送门跳跃
      if (!areAdjacent(prevCell, cell) && !isPortalJump) return false
    }
  }
  
  // 匹配正确路径 + 植物点亮检查
  for (const pathInfo of correctPaths) {
    if (isPathMatching(targetPath)) {
      // 检查植物点亮率 ≥ 50%
      if (requiredPlants.length === 0 || 
          litRequiredPlants.length >= Math.ceil(requiredPlants.length * 0.5)) {
        return true
      }
    }
  }
  return false
}
```

---

## 4. 边界条件漏洞分析

### 🔴 漏洞 1: 冰面滑动不完整

**位置**: `PathJudge.js:257-269`

```javascript
handleIceSlide(iceCell, fromCell) {
  const rowDiff = iceCell.row - fromCell.row
  const colDiff = iceCell.col - fromCell.col
  let nextRow = iceCell.row + rowDiff
  let nextCol = iceCell.col + colDiff
  const nextCell = this.levelMap.getCellAt(nextRow, nextCol)
  
  if (nextCell && nextCell.obstacleType !== 'rock' && !this.selectedPath.includes(nextCell)) {
    this.addCellToPath(nextCell)
    // ❌ 问题1: 只滑动一格，如果 nextCell 也是冰面，不会继续滑动
    // ❌ 问题2: 如果 nextCell 是传送门，不会触发传送门逻辑
    // ❌ 问题3: 滑动方向只基于进入方向，没有考虑冰面本身的方向性
  }
}
```

**影响**: 
- 连续冰面无法正确滑动
- 冰面 → 传送门的组合效果失效
- 与预期的"冰面会一直滑动直到碰到障碍"行为不符

---

### 🔴 漏洞 2: 传送门后不触发后续效果

**位置**: `PathJudge.js:271-279`

```javascript
handlePortalTeleport(portalCell) {
  const obs = this.levelMap.getObstacleAt(portalCell.row, portalCell.col)
  if (!obs || obs.targetRow === undefined || obs.targetCol === undefined) return
  
  const targetCell = this.levelMap.getCellAt(obs.targetRow, obs.targetCol)
  if (targetCell && targetCell.obstacleType !== 'rock' && !this.selectedPath.includes(targetCell)) {
    this.addCellToPath(targetCell)
    // ❌ 问题1: 如果 targetCell 是冰面，不会触发冰面滑动
    // ❌ 问题2: 没有检查传送目标是否会导致路径循环
    // ❌ 问题3: 传送后如果是终点，onPointerUp 之前无法感知
  }
}
```

**影响**:
- 传送门 → 冰面的组合效果失效
- 理论上可能出现传送门循环（虽然关卡设计会避免）

---

### 🔴 漏洞 3: 回退逻辑不完整

**位置**: `PathJudge.js:205-220`

```javascript
if (this.selectedPath.length > 1) {
  const prevCell = this.selectedPath[this.selectedPath.length - 2]
  if (cell === prevCell) {
    this._saveHistorySnapshot()
    const removedCell = this.selectedPath.pop()
    removedCell.isOnPath = false
    if (removedCell.plantSprite) {
      this.plantState.lightOff(removedCell.plantSprite)
    }
    // ❌ 问题1: 如果 removedCell 触发了冰面滑动添加了额外格子，那些格子没有被回退
    // ❌ 问题2: 如果 removedCell 触发了传送门添加了额外格子，那些格子没有被回退
    // ❌ 问题3: 回退时没有重置 thorn 伤害计数
    // ❌ 问题4: combo 重置时机可能不正确（只重置当前，没有回退历史）
    this.updatePathDisplay()
    this.unhighlightCell(removedCell)
    if (this.scene.resetCombo) {
      this.scene.resetCombo()
    }
    return
  }
}
```

**影响**:
- 经过冰面/传送门后回退，路径状态会不一致
- 回退后植物点亮状态可能不正确
- 回退历史快照保存时机可能有问题（回退前保存当前状态）

---

### 🟡 漏洞 4: 路径验证的植物检查逻辑不一致

**位置**: `PathJudge.js:346-363`

```javascript
if (this.isPathMatching(targetPath)) {
  const requiredPlants = targetPath.filter(p => {
    const cell = this.levelMap.getCellAt(p.row, p.col)
    return cell && cell.plant && !cell.plant.hidden
  })
  
  const litRequiredPlants = requiredPlants.filter(p => {
    const cell = this.levelMap.getCellAt(p.row, p.col)
    return cell && cell.isLit
  })
  
  // ❌ 问题: 只检查 targetPath 上的植物，不检查实际路径上的植物
  // 如果用户走了正确路径但点亮了路径外的植物，这里不验证
  // 另外，isLit 是 cell 的属性，不是 plantSprite 的属性，存在数据同步风险
}
```

**影响**:
- 植物点亮验证可能不准确
- `cell.isLit` 和 `plantSprite.getData('isLit')` 可能不同步

---

### 🟡 漏洞 5: 拖拽起点的动态障碍物检查缺失

**位置**: `PathJudge.js:179-192`

```javascript
onPointerDown(pointer) {
  const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)
  
  if (!cell || cell.obstacleType === 'rock') return
  
  if (cell.isStart || (this.selectedPath.length === 0 && this.isValidStart(cell))) {
    // ✅ 检查了起点是否是 rock
    // ❌ 但如果起点格子在拖拽过程中被动态添加了障碍物（如 removeObstacle 的反向操作），没有处理
    // ❌ 另外，起点如果是 ice/portal/thorn，是否允许开始？
  }
}
```

**影响**:
- 理论上可能出现起点被动态阻塞的情况
- 起点本身是特殊障碍物时的行为不明确

---

### 🟡 漏洞 6: 冰面滑出边界的处理

**位置**: `PathJudge.js:264`

```javascript
const nextCell = this.levelMap.getCellAt(nextRow, nextCol)
// ✅ getCellAt 会返回 null 处理越界
// ❌ 但如果冰面在网格边缘，滑动方向指向边界外，应该停止而不是 silently fail
```

**影响**:
- 边界冰面的滑动行为可能不符合预期

---

### 🟡 漏洞 7: 历史快照保存频率过高

**位置**: `PathJudge.js:208, 226`

```javascript
// 每次回退前保存
this._saveHistorySnapshot()

// 每次添加格子前保存
this._saveHistorySnapshot()
```

**问题**: 
- 冰面滑动或传送门一次添加多个格子时，会保存多次快照
- `maxHistorySize = 3` 可能不够用，快速操作会丢失历史

---

## 5. 已正确处理的边界

### ✅ 正确 1: 网格越界检查
```javascript
// LevelMap.getCellAt 正确处理所有越界情况
if (row < 0 || row >= rows || col < 0 || col >= cols) return null
```

### ✅ 正确 2: 岩石阻塞检查
```javascript
// 拖拽过程中全程检查 rock
if (!cell || cell.obstacleType === 'rock') return
```

### ✅ 正确 3: 路径重复检查
```javascript
if (this.selectedPath.includes(cell)) return
```

### ✅ 正确 4: 相邻性检查（含传送门例外）
```javascript
const isPortalJump = this.isPortalJump(prevCell, cell)
if (!areAdjacent(prevCell, cell) && !isPortalJump) return false
```

### ✅ 正确 5: 起点终点校验
```javascript
if (!firstCell.isStart || !lastCell.isEnd) return false
```

---

## 6. 修复建议优先级

| 优先级 | 漏洞 | 修复难度 | 影响程度 |
|--------|------|----------|----------|
| 🔴 高 | 冰面滑动不完整（连续冰面+传送门联动） | 中 | 严重 |
| 🔴 高 | 传送门后不触发冰面滑动 | 低 | 严重 |
| 🔴 高 | 回退逻辑不处理特殊效果添加的格子 | 高 | 严重 |
| 🟡 中 | 植物检查逻辑不一致 | 中 | 中等 |
| 🟡 中 | 历史快照保存频率过高 | 低 | 中等 |
| 🟢 低 | 起点动态障碍物检查 | 低 | 轻微 |
| 🟢 低 | 冰面滑出边界处理 | 低 | 轻微 |

---

## 7. 关键代码位置索引

| 功能 | 文件 | 行号 |
|------|------|------|
| 拖拽起点处理 | `PathJudge.js` | 179-192 |
| 拖拽移动校验链 | `PathJudge.js` | 194-235 |
| 回退逻辑 | `PathJudge.js` | 205-220 |
| 冰面滑动处理 | `PathJudge.js` | 257-269 |
| 传送门处理 | `PathJudge.js` | 271-279 |
| 路径验证 | `PathJudge.js` | 314-367 |
| 历史快照 | `PathJudge.js` | 35-57 |
| 网格坐标转换 | `LevelMap.js` | 989-1000 |
| 单元格边界检查 | `LevelMap.js` | 981-987 |
| 相邻性判断 | `LevelMap.js` | 1002-1006 |
