<template>
  <div class="editor-container">
    <div class="editor-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')">← 返回</button>
        <h1 class="editor-title">🎨 关卡编辑器</h1>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="importLevel">📂 导入</button>
        <button class="action-btn primary" @click="exportLevel">💾 导出</button>
        <button class="action-btn success" @click="togglePreview">
          {{ isPreview ? '🛠 编辑' : '▶️ 预览试玩' }}
        </button>
      </div>
    </div>

    <div class="editor-body" :class="{ previewMode: isPreview }">
      <div class="editor-sidebar" v-show="!isPreview">
        <div class="panel">
          <h3>📐 网格设置</h3>
          <div class="grid-settings">
            <div class="setting-row">
              <label>行数</label>
              <input type="number" v-model.number="rows" min="3" max="15" @change="resizeGrid" />
            </div>
            <div class="setting-row">
              <label>列数</label>
              <input type="number" v-model.number="cols" min="3" max="15" @change="resizeGrid" />
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>🎯 关卡信息</h3>
          <div class="level-info">
            <div class="setting-row">
              <label>关卡名称</label>
              <input type="text" v-model="levelData.name" placeholder="输入关卡名称" />
            </div>
            <div class="setting-row">
              <label>描述</label>
              <textarea v-model="levelData.description" placeholder="输入关卡描述" rows="2"></textarea>
            </div>
            <div class="setting-row">
              <label>提示</label>
              <textarea v-model="levelData.hint" placeholder="输入提示信息" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>🖌 编辑工具</h3>
          <div class="tools-grid">
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'start' }"
              @click="currentTool = 'start'"
            >
              <span class="tool-icon start-icon">🚩</span>
              <span>起点</span>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'end' }"
              @click="currentTool = 'end'"
            >
              <span class="tool-icon end-icon">🏁</span>
              <span>终点</span>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'obstacle' }"
              @click="currentTool = 'obstacle'"
            >
              <span class="tool-icon obstacle-icon">🪨</span>
              <span>障碍</span>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'erase' }"
              @click="currentTool = 'erase'"
            >
              <span class="tool-icon erase-icon">🧹</span>
              <span>擦除</span>
            </button>
          </div>
        </div>

        <div class="panel">
          <h3>🌱 植物类型</h3>
          <div class="plants-grid">
            <button
              class="tool-btn plant-btn"
              :class="{ active: currentTool === 'moss' }"
              @click="currentTool = 'moss'"
            >
              <span class="plant-dot moss"></span>
              <span>苔藓</span>
              <small>10分</small>
            </button>
            <button
              class="tool-btn plant-btn"
              :class="{ active: currentTool === 'mushroom' }"
              @click="currentTool = 'mushroom'"
            >
              <span class="plant-dot mushroom"></span>
              <span>蘑菇</span>
              <small>20分</small>
            </button>
            <button
              class="tool-btn plant-btn"
              :class="{ active: currentTool === 'flower' }"
              @click="currentTool = 'flower'"
            >
              <span class="plant-dot flower"></span>
              <span>夜光花</span>
              <small>30分</small>
            </button>
          </div>
        </div>

        <div class="panel">
          <h3>🛣 正确路径</h3>
          <p class="panel-desc">点击「开始绘制」后，依次点击格子来定义正确路径</p>
          <div class="path-actions">
            <button
              class="path-btn"
              :class="{ active: isDrawingPath }"
              @click="toggleDrawPath"
            >
              {{ isDrawingPath ? '⏹ 停止绘制' : '✏️ 开始绘制' }}
            </button>
            <button class="path-btn danger" @click="clearPath">🗑 清空路径</button>
          </div>
          <div class="path-info" v-if="levelData.correctPath.length > 0">
            已绘制 {{ levelData.correctPath.length }} 个路径点
          </div>
        </div>

        <div class="panel">
          <h3>⚡ 快捷操作</h3>
          <div class="quick-actions">
            <button class="action-btn danger" @click="clearAll">🗑 清空关卡</button>
            <button class="action-btn" @click="loadSample">📋 加载示例</button>
          </div>
        </div>
      </div>

      <div class="editor-main">
        <div v-show="!isPreview" class="grid-wrapper">
          <div
            class="grid-container"
            :style="gridContainerStyle"
            ref="gridContainer"
          >
            <div
              v-for="row in rows"
              :key="'row-' + row"
              class="grid-row"
            >
              <div
                v-for="col in cols"
                :key="'cell-' + row + '-' + col"
                class="grid-cell"
                :style="cellStyle"
                :class="getCellClass(row - 1, col - 1)"
                @mousedown="onCellMouseDown(row - 1, col - 1)"
                @mouseenter="onCellMouseEnter(row - 1, col - 1)"
                @mouseup="onCellMouseUp"
              >
                <span class="cell-content" v-if="getCellContent(row - 1, col - 1)">
                  {{ getCellContent(row - 1, col - 1) }}
                </span>
                <div class="path-index" v-if="getPathIndex(row - 1, col - 1) !== -1">
                  {{ getPathIndex(row - 1, col - 1) + 1 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="isPreview" class="preview-wrapper">
          <div ref="previewContainer" id="preview-game"></div>
          <div class="preview-hint" v-if="previewMessage">
            {{ previewMessage }}
          </div>
        </div>
      </div>

      <div class="editor-rightbar" v-show="!isPreview">
        <div class="panel">
          <h3>📊 统计信息</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">格子总数</span>
              <span class="stat-value">{{ rows * cols }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">障碍物</span>
              <span class="stat-value">{{ levelData.obstacles.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">植物总数</span>
              <span class="stat-value">{{ levelData.plants.length }}</span>
            </div>
            <div class="stat-item plant-stat moss-stat">
              <span class="stat-label">🌿 苔藓</span>
              <span class="stat-value">{{ plantCounts.moss }}</span>
            </div>
            <div class="stat-item plant-stat mushroom-stat">
              <span class="stat-label">🍄 蘑菇</span>
              <span class="stat-value">{{ plantCounts.mushroom }}</span>
            </div>
            <div class="stat-item plant-stat flower-stat">
              <span class="stat-label">🌸 夜光花</span>
              <span class="stat-value">{{ plantCounts.flower }}</span>
            </div>
            <div class="stat-item total-points">
              <span class="stat-label">💎 总分值</span>
              <span class="stat-value">{{ totalPoints }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>✅ 验证检查</h3>
          <div class="validation-list">
            <div class="validation-item" :class="{ valid: levelData.start, invalid: !levelData.start }">
              <span>{{ levelData.start ? '✓' : '✗' }}</span>
              <span>已设置起点</span>
            </div>
            <div class="validation-item" :class="{ valid: levelData.end, invalid: !levelData.end }">
              <span>{{ levelData.end ? '✓' : '✗' }}</span>
              <span>已设置终点</span>
            </div>
            <div class="validation-item" :class="{ valid: levelData.correctPath.length >= 2, invalid: levelData.correctPath.length < 2 }">
              <span>{{ levelData.correctPath.length >= 2 ? '✓' : '✗' }}</span>
              <span>正确路径 ({{ levelData.correctPath.length }} 点)</span>
            </div>
            <div class="validation-item" :class="{ valid: isValidPath, invalid: !isValidPath }">
              <span>{{ isValidPath ? '✓' : '✗' }}</span>
              <span>路径连通且无障碍物</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>📖 使用说明</h3>
          <div class="instructions">
            <p><strong>1.</strong> 先设置网格大小（3-15行/列）</p>
            <p><strong>2.</strong> 选择「起点/终点」工具点击格子，或直接拖拽已有起点/终点</p>
            <p><strong>3.</strong> 选择植物或障碍工具，点击/拖拽放置</p>
            <p><strong>4.</strong> 绘制正确路径：点击开始，再依次点击格子</p>
            <p><strong>5.</strong> 点击「预览试玩」测试关卡</p>
            <p><strong>6.</strong> 导出 JSON 保存关卡</p>
            <p class="tip">💡 提示：直接按住起点/终点图标可拖动到新位置</p>
          </div>
        </div>
      </div>
    </div>

    <input type="file" ref="fileInput" accept=".json" @change="handleFileImport" style="display: none" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { LEVELS, PLANT_TYPES } from '../game/data/levels.js'
import { Game } from '../game/Game.js'

const emit = defineEmits(['back'])

const rows = ref(5)
const cols = ref(5)
const currentTool = ref('start')
const isDrawingPath = ref(false)
const isPreview = ref(false)
const previewMessage = ref('')
const gridContainer = ref(null)
const previewContainer = ref(null)
const fileInput = ref(null)

let isMouseDown = false
let previewGameInstance = null
let savedOriginalLevels = null
let dragState = null

const CELL_SIZE = 60

const levelData = reactive({
  id: 99,
  name: '自定义关卡',
  description: '',
  gridSize: { rows: 5, cols: 5 },
  start: null,
  end: null,
  obstacles: [],
  plants: [],
  correctPath: [],
  hint: ''
})

const gridContainerStyle = computed(() => ({
  width: `${cols.value * CELL_SIZE}px`,
  height: `${rows.value * CELL_SIZE}px`
}))

const cellStyle = computed(() => ({
  width: `${CELL_SIZE}px`,
  height: `${CELL_SIZE}px`
}))

const plantCounts = computed(() => {
  const counts = { moss: 0, mushroom: 0, flower: 0 }
  levelData.plants.forEach(p => {
    if (counts[p.type] !== undefined) counts[p.type]++
  })
  return counts
})

const totalPoints = computed(() => {
  return levelData.plants.reduce((sum, p) => {
    const pt = PLANT_TYPES[p.type]
    return sum + (pt ? pt.points : 0)
  }, 0)
})

const isValidPath = computed(() => {
  if (levelData.correctPath.length < 2) return false
  if (!levelData.start || !levelData.end) return false
  
  const first = levelData.correctPath[0]
  const last = levelData.correctPath[levelData.correctPath.length - 1]
  
  if (first.row !== levelData.start.row || first.col !== levelData.start.col) return false
  if (last.row !== levelData.end.row || last.col !== levelData.end.col) return false
  
  for (let i = 0; i < levelData.correctPath.length; i++) {
    const cell = levelData.correctPath[i]
    if (isObstacle(cell.row, cell.col)) return false
  }
  
  for (let i = 1; i < levelData.correctPath.length; i++) {
    const prev = levelData.correctPath[i - 1]
    const curr = levelData.correctPath[i]
    const rowDiff = Math.abs(prev.row - curr.row)
    const colDiff = Math.abs(prev.col - curr.col)
    if (rowDiff + colDiff !== 1) return false
  }
  
  return true
})

function isStart(row, col) {
  return levelData.start && levelData.start.row === row && levelData.start.col === col
}

function isEnd(row, col) {
  return levelData.end && levelData.end.row === row && levelData.end.col === col
}

function isObstacle(row, col) {
  return levelData.obstacles.some(o => o.row === row && o.col === col)
}

function getPlant(row, col) {
  return levelData.plants.find(p => p.row === row && p.col === col)
}

function getPathIndex(row, col) {
  return levelData.correctPath.findIndex(p => p.row === row && p.col === col)
}

function getCellClass(row, col) {
  const classes = []
  
  if (isDrawingPath.value) {
    const idx = getPathIndex(row, col)
    if (idx !== -1) classes.push('path-cell')
    if (idx === levelData.correctPath.length - 1) classes.push('path-last')
  }
  
  if (isStart(row, col)) classes.push('start-cell')
  else if (isEnd(row, col)) classes.push('end-cell')
  else if (isObstacle(row, col)) classes.push('obstacle-cell')
  else {
    const plant = getPlant(row, col)
    if (plant) classes.push(`plant-${plant.type}`)
  }
  
  return classes
}

function getCellContent(row, col) {
  if (isStart(row, col)) return '🚩'
  if (isEnd(row, col)) return '🏁'
  if (isObstacle(row, col)) return '🪨'
  const plant = getPlant(row, col)
  if (plant) {
    if (plant.type === 'moss') return '🌿'
    if (plant.type === 'mushroom') return '🍄'
    if (plant.type === 'flower') return '🌸'
  }
  return null
}

function onCellMouseDown(row, col) {
  isMouseDown = true
  
  if (currentTool.value === 'start' || currentTool.value === 'end') {
    handleCellAction(row, col)
    return
  }
  
  if (isStart(row, col)) {
    dragState = { type: 'start', moved: false }
    return
  }
  if (isEnd(row, col)) {
    dragState = { type: 'end', moved: false }
    return
  }
  
  handleCellAction(row, col)
}

function onCellMouseEnter(row, col) {
  if (dragState) {
    if (!isObstacle(row, col) && !isStart(row, col) && !isEnd(row, col)) {
      dragState.moved = true
      if (dragState.type === 'start') {
        levelData.start = { row, col }
        removeObstacle(row, col)
        removePlant(row, col)
        updatePathPoint(0, row, col)
      } else if (dragState.type === 'end') {
        levelData.end = { row, col }
        removeObstacle(row, col)
        removePlant(row, col)
        updatePathPoint(levelData.correctPath.length - 1, row, col)
      }
    }
    return
  }
  
  if (isMouseDown && !isDrawingPath.value) {
    if (currentTool.value === 'obstacle' || currentTool.value === 'erase' || 
        currentTool.value === 'moss' || currentTool.value === 'mushroom' || currentTool.value === 'flower') {
      handleCellAction(row, col)
    }
  }
}

function onCellMouseUp() {
  isMouseDown = false
  if (dragState && !dragState.moved) {
    dragState = null
  }
  dragState = null
}

function updatePathPoint(index, row, col) {
  if (levelData.correctPath.length > 0 && index >= 0 && index < levelData.correctPath.length) {
    levelData.correctPath[index] = { row, col }
  }
}

function handleCellAction(row, col) {
  if (isDrawingPath.value) {
    handlePathDraw(row, col)
    return
  }
  
  switch (currentTool.value) {
    case 'start':
      levelData.start = { row, col }
      removeObstacle(row, col)
      removePlant(row, col)
      break
    case 'end':
      levelData.end = { row, col }
      removeObstacle(row, col)
      removePlant(row, col)
      break
    case 'obstacle':
      if (!isStart(row, col) && !isEnd(row, col)) {
        addObstacle(row, col)
        removePlant(row, col)
      }
      break
    case 'erase':
      if (isStart(row, col)) levelData.start = null
      else if (isEnd(row, col)) levelData.end = null
      removeObstacle(row, col)
      removePlant(row, col)
      break
    case 'moss':
    case 'mushroom':
    case 'flower':
      if (!isStart(row, col) && !isEnd(row, col) && !isObstacle(row, col)) {
        addOrUpdatePlant(row, col, currentTool.value)
      }
      break
  }
}

function handlePathDraw(row, col) {
  const idx = getPathIndex(row, col)
  
  if (idx !== -1) {
    levelData.correctPath = levelData.correctPath.slice(0, idx + 1)
    return
  }
  
  if (levelData.correctPath.length === 0) {
    levelData.correctPath.push({ row, col })
    return
  }
  
  const last = levelData.correctPath[levelData.correctPath.length - 1]
  const rowDiff = Math.abs(last.row - row)
  const colDiff = Math.abs(last.col - col)
  
  if (rowDiff + colDiff === 1 && !isObstacle(row, col)) {
    levelData.correctPath.push({ row, col })
  }
}

function addObstacle(row, col) {
  if (!isObstacle(row, col)) {
    levelData.obstacles.push({ row, col })
  }
}

function removeObstacle(row, col) {
  const idx = levelData.obstacles.findIndex(o => o.row === row && o.col === col)
  if (idx !== -1) levelData.obstacles.splice(idx, 1)
}

function addOrUpdatePlant(row, col, type) {
  const existing = getPlant(row, col)
  if (existing) {
    existing.type = type
  } else {
    levelData.plants.push({ row, col, type })
  }
}

function removePlant(row, col) {
  const idx = levelData.plants.findIndex(p => p.row === row && p.col === col)
  if (idx !== -1) levelData.plants.splice(idx, 1)
}

function resizeGrid() {
  levelData.gridSize.rows = rows.value
  levelData.gridSize.cols = cols.value
  
  if (levelData.start && (levelData.start.row >= rows.value || levelData.start.col >= cols.value)) {
    levelData.start = null
  }
  if (levelData.end && (levelData.end.row >= rows.value || levelData.end.col >= cols.value)) {
    levelData.end = null
  }
  
  levelData.obstacles = levelData.obstacles.filter(o => o.row < rows.value && o.col < cols.value)
  levelData.plants = levelData.plants.filter(p => p.row < rows.value && p.col < cols.value)
  levelData.correctPath = levelData.correctPath.filter(p => p.row < rows.value && p.col < cols.value)
}

function toggleDrawPath() {
  isDrawingPath.value = !isDrawingPath.value
}

function clearPath() {
  levelData.correctPath = []
}

function clearAll() {
  if (!confirm('确定要清空所有内容吗？')) return
  levelData.name = '自定义关卡'
  levelData.description = ''
  levelData.hint = ''
  levelData.start = null
  levelData.end = null
  levelData.obstacles = []
  levelData.plants = []
  levelData.correctPath = []
}

function loadSample() {
  const sample = LEVELS[0]
  rows.value = sample.gridSize.rows
  cols.value = sample.gridSize.cols
  levelData.gridSize = { ...sample.gridSize }
  levelData.name = sample.name + ' (副本)'
  levelData.description = sample.description
  levelData.hint = sample.hint
  levelData.start = { ...sample.start }
  levelData.end = { ...sample.end }
  levelData.obstacles = sample.obstacles.map(o => ({ ...o }))
  levelData.plants = sample.plants.map(p => ({ ...p }))
  levelData.correctPath = sample.correctPath.map(p => ({ ...p }))
}

function togglePreview() {
  if (!isPreview.value) {
    if (!validateForPreview()) return
    isPreview.value = true
    nextTick(() => {
      startPreview()
    })
  } else {
    stopPreview()
    isPreview.value = false
  }
}

function validateForPreview() {
  if (!levelData.start) {
    alert('请先设置起点！')
    return false
  }
  if (!levelData.end) {
    alert('请先设置终点！')
    return false
  }
  if (levelData.correctPath.length < 2) {
    alert('请至少绘制2个路径点的正确路径！')
    return false
  }
  return true
}

function startPreview() {
  previewMessage.value = '正在加载预览...'
  
  savedOriginalLevels = LEVELS.map(l => JSON.parse(JSON.stringify(l)))
  const previewLevel = JSON.parse(JSON.stringify(levelData))
  previewLevel.id = 0
  previewLevel.gridSize = { rows: rows.value, cols: cols.value }
  
  LEVELS.length = 0
  LEVELS.push(previewLevel)
  
  nextTick(() => {
    if (previewContainer.value) {
      try {
        previewGameInstance = new Game(previewContainer.value)
        previewMessage.value = '💡 试玩提示：从起点拖动到终点，点亮沿途的植物'
      } catch (e) {
        previewMessage.value = '预览加载失败：' + e.message
        console.error(e)
        restoreOriginalLevels()
      }
    }
  })
}

function restoreOriginalLevels() {
  if (savedOriginalLevels) {
    LEVELS.length = 0
    savedOriginalLevels.forEach(l => LEVELS.push(l))
    savedOriginalLevels = null
  }
}

function stopPreview() {
  if (previewGameInstance) {
    previewGameInstance.destroy()
    previewGameInstance = null
  }
  restoreOriginalLevels()
  previewMessage.value = ''
}

function exportLevel() {
  if (!levelData.start) { alert('请设置起点！'); return }
  if (!levelData.end) { alert('请设置终点！'); return }
  
  const exportData = JSON.parse(JSON.stringify(levelData))
  exportData.gridSize = { rows: rows.value, cols: cols.value }
  
  const jsonStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${levelData.name || 'level'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importLevel() {
  fileInput.value.click()
}

function handleFileImport(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)
      applyImportedData(data)
    } catch (err) {
      alert('导入失败：无效的 JSON 文件')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function applyImportedData(data) {
  if (data.gridSize) {
    rows.value = data.gridSize.rows
    cols.value = data.gridSize.cols
    levelData.gridSize = { ...data.gridSize }
  }
  levelData.id = data.id ?? 99
  levelData.name = data.name ?? '导入关卡'
  levelData.description = data.description ?? ''
  levelData.hint = data.hint ?? ''
  levelData.start = data.start ? { ...data.start } : null
  levelData.end = data.end ? { ...data.end } : null
  levelData.obstacles = (data.obstacles ?? []).map(o => ({ ...o }))
  levelData.plants = (data.plants ?? []).map(p => ({ ...p }))
  levelData.correctPath = (data.correctPath ?? []).map(p => ({ ...p }))
}

onMounted(() => {
  document.addEventListener('mouseup', onCellMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', onCellMouseUp)
  stopPreview()
})
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
  color: #e2e8f0;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(13, 17, 23, 0.95);
  border-bottom: 1px solid rgba(96, 165, 250, 0.3);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.4);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(96, 165, 250, 0.3);
  border-color: #60a5fa;
}

.editor-title {
  font-size: 1.4rem;
  margin: 0;
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  background: rgba(100, 116, 139, 0.3);
  color: #cbd5e1;
  border: 1px solid rgba(100, 116, 139, 0.4);
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-1px);
  background: rgba(100, 116, 139, 0.5);
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
}

.action-btn.primary:hover {
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.action-btn.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: transparent;
  color: white;
}

.action-btn.success:hover {
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: transparent;
  color: white;
}

.action-btn.danger:hover {
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-body.previewMode .editor-main {
  padding: 0;
}

.editor-sidebar, .editor-rightbar {
  width: 280px;
  padding: 16px;
  overflow-y: auto;
  background: rgba(13, 17, 23, 0.6);
}

.editor-sidebar {
  border-right: 1px solid rgba(96, 165, 250, 0.15);
}

.editor-rightbar {
  border-left: 1px solid rgba(96, 165, 250, 0.15);
}

.panel {
  background: rgba(15, 23, 42, 0.8);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.panel h3 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: #fbbf24;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.15);
}

.panel-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.setting-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.setting-row label {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 4px;
}

.setting-row input[type="number"],
.setting-row input[type="text"],
.setting-row textarea {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.setting-row input:focus,
.setting-row textarea:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
}

.setting-row textarea {
  resize: vertical;
  min-height: 40px;
}

.tools-grid, .plants-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #cbd5e1;
  font-size: 12px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(96, 165, 250, 0.4);
}

.tool-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #60a5fa;
  color: #93c5fd;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.2);
}

.tool-icon {
  font-size: 1.4rem;
}

.plant-btn small {
  font-size: 10px;
  color: #94a3b8;
}

.tool-btn.active small {
  color: #93c5fd;
}

.plant-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.plant-dot.moss {
  background: #4ade80;
  box-shadow: 0 0 8px #22c55e;
}

.plant-dot.mushroom {
  background: #f472b6;
  box-shadow: 0 0 8px #ec4899;
}

.plant-dot.flower {
  background: #60a5fa;
  box-shadow: 0 0 8px #3b82f6;
}

.path-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.path-btn {
  padding: 10px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  color: #93c5fd;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.path-btn:hover {
  background: rgba(59, 130, 246, 0.35);
}

.path-btn.active {
  background: rgba(245, 158, 11, 0.3);
  border-color: #f59e0b;
  color: #fcd34d;
}

.path-btn.danger {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.path-btn.danger:hover {
  background: rgba(239, 68, 68, 0.35);
}

.path-info {
  text-align: center;
  font-size: 12px;
  color: #22d3ee;
  padding: 6px;
  background: rgba(34, 211, 238, 0.1);
  border-radius: 6px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-actions .action-btn {
  width: 100%;
  text-align: center;
}

.editor-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
}

.grid-wrapper {
  padding: 20px;
  background: rgba(13, 17, 23, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 0 30px rgba(96, 165, 250, 0.1);
}

.grid-container {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(96, 165, 250, 0.3);
}

.grid-row {
  display: flex;
}

.grid-cell {
  border: 1px solid rgba(96, 165, 250, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
  background: rgba(30, 41, 59, 0.4);
}

.grid-cell:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(96, 165, 250, 0.5);
}

.grid-cell.start-cell {
  background: rgba(34, 197, 94, 0.3);
  border-color: #22c55e;
  box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.3);
  cursor: grab;
}

.grid-cell.start-cell:active {
  cursor: grabbing;
}

.grid-cell.end-cell {
  background: rgba(168, 85, 247, 0.3);
  border-color: #a855f7;
  box-shadow: inset 0 0 15px rgba(168, 85, 247, 0.3);
  cursor: grab;
}

.grid-cell.end-cell:active {
  cursor: grabbing;
}

.grid-cell.obstacle-cell {
  background: rgba(100, 116, 139, 0.5);
  border-color: #64748b;
}

.grid-cell.plant-moss {
  background: rgba(74, 222, 128, 0.15);
}

.grid-cell.plant-mushroom {
  background: rgba(244, 114, 182, 0.15);
}

.grid-cell.plant-flower {
  background: rgba(96, 165, 250, 0.15);
}

.grid-cell.path-cell {
  background: rgba(251, 191, 36, 0.25) !important;
  border-color: rgba(251, 191, 36, 0.6) !important;
}

.grid-cell.path-last {
  box-shadow: inset 0 0 20px rgba(251, 191, 36, 0.5);
}

.cell-content {
  font-size: 1.6rem;
  user-select: none;
  pointer-events: none;
}

.path-index {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  background: rgba(251, 191, 36, 0.9);
  color: #1e293b;
  font-size: 10px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.preview-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.preview-wrapper #preview-game {
  flex: 1;
  width: 100%;
  min-height: 500px;
}

.preview-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: #fcd34d;
  padding: 10px 24px;
  border-radius: 20px;
  border: 1px solid rgba(251, 191, 36, 0.4);
  font-size: 14px;
  z-index: 10;
  white-space: nowrap;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 6px;
  font-size: 13px;
}

.stat-label {
  color: #94a3b8;
}

.stat-value {
  color: #e2e8f0;
  font-weight: 600;
}

.plant-stat.moss-stat .stat-value {
  color: #4ade80;
}

.plant-stat.mushroom-stat .stat-value {
  color: #f472b6;
}

.plant-stat.flower-stat .stat-value {
  color: #60a5fa;
}

.total-points {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.total-points .stat-label {
  color: #fbbf24;
}

.total-points .stat-value {
  color: #fcd34d;
  font-size: 1.1rem;
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
}

.validation-item.valid {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.validation-item.invalid {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.validation-item span:first-child {
  font-weight: bold;
  width: 16px;
  text-align: center;
}

.instructions {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.8;
}

.instructions p {
  margin: 4px 0;
}

.instructions strong {
  color: #60a5fa;
}

.instructions .tip {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(96, 165, 250, 0.3);
  color: #fbbf24;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(96, 165, 250, 0.5);
}
</style>
