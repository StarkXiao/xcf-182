import { LEVELS } from '../data/levels.js'

const DEFAULT_THEME = {
  gridBg: 0x0d1117,
  gridBgStroke: 0x1e3a5f,
  gridCell: 0x1a1f2e,
  gridCellStroke: 0x2d3748,
  obstacleFill: 0x374151,
  obstacleStroke: 0x4b5563,
  obstacleSpark: 0x6b7280,
  startFill: 0x10b981,
  startStroke: 0x34d399,
  endFill: 0x8b5cf6,
  endStroke: 0xa78bfa
}

export class LevelMap {
  constructor(scene, themeColors = null) {
    this.scene = scene
    this.currentLevel = null
    this.gridCells = []
    this.cellSize = 0
    this.offsetX = 0
    this.offsetY = 0
    this.dailyLevel = null
    this.theme = { ...DEFAULT_THEME, ...(themeColors || {}) }
  }

  setDailyLevel(level) {
    this.dailyLevel = level
  }

  loadLevel(levelIndex) {
    if (this.dailyLevel) {
      this.currentLevel = JSON.parse(JSON.stringify(this.dailyLevel))
      this.createGrid()
      return this.currentLevel
    }

    if (levelIndex >= LEVELS.length) {
      return null
    }
    this.currentLevel = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
    this.createGrid()
    return this.currentLevel
  }

  createGrid() {
    const { rows, cols } = this.currentLevel.gridSize
    const gameWidth = this.scene.game.config.width
    const gameHeight = this.scene.game.config.height
    
    const maxCellWidth = (gameWidth - 100) / cols
    const maxCellHeight = (gameHeight - 200) / rows
    this.cellSize = Math.min(maxCellWidth, maxCellHeight, 80)
    
    this.offsetX = (gameWidth - cols * this.cellSize) / 2
    this.offsetY = (gameHeight - rows * this.cellSize) / 2 + 50
    
    this.gridCells = []
    for (let row = 0; row < rows; row++) {
      this.gridCells[row] = []
      for (let col = 0; col < cols; col++) {
        this.gridCells[row][col] = {
          row,
          col,
          isObstacle: this.isObstacle(row, col),
          isStart: this.isStart(row, col),
          isEnd: this.isEnd(row, col),
          plant: this.getPlantAt(row, col),
          isLit: false,
          isOnPath: false
        }
      }
    }
  }

  render() {
    this.renderBackground()
    this.renderGrid()
    this.renderObstacles()
    this.renderStartEnd()
  }

  renderBackground() {
    const { rows, cols } = this.currentLevel.gridSize
    const width = cols * this.cellSize + 20
    const height = rows * this.cellSize + 20
    
    const bg = this.scene.add.rectangle(
      this.offsetX + (cols * this.cellSize) / 2,
      this.offsetY + (rows * this.cellSize) / 2,
      width,
      height,
      this.theme.gridBg,
      0.8
    )
    bg.setStrokeStyle(2, this.theme.gridBgStroke, 1)
    
    this.scene.tweens.add({
      targets: bg,
      alpha: { from: 0.6, to: 0.9 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  renderGrid() {
    const { rows, cols } = this.currentLevel.gridSize
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.gridCells[row][col]
        if (cell.isObstacle) continue
        
        const x = this.offsetX + col * this.cellSize + this.cellSize / 2
        const y = this.offsetY + row * this.cellSize + this.cellSize / 2
        
        const cellBg = this.scene.add.rectangle(
          x, y,
          this.cellSize - 4,
          this.cellSize - 4,
          this.theme.gridCell,
          0.6
        )
        cellBg.setStrokeStyle(1, this.theme.gridCellStroke, 0.5)
        cellBg.setData('cell', cell)
        cellBg.setInteractive({ useHandCursor: true })
        
        cell.sprite = cellBg
      }
    }
  }

  renderObstacles() {
    const { obstacles } = this.currentLevel
    
    obstacles.forEach(obs => {
      const x = this.offsetX + obs.col * this.cellSize + this.cellSize / 2
      const y = this.offsetY + obs.row * this.cellSize + this.cellSize / 2
      
      const rock = this.scene.add.circle(x, y, this.cellSize * 0.35, this.theme.obstacleFill, 0.9)
      rock.setStrokeStyle(2, this.theme.obstacleStroke, 1)
      
      this.scene.tweens.add({
        targets: rock,
        scale: { from: 0.95, to: 1.05 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 1000
      })
      
      const sparkles = this.scene.add.particles(x, y, 'sparkle', {
        speed: 10,
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 1000,
        frequency: 500,
        tint: this.theme.obstacleSpark
      })
      sparkles.stop()
      this.scene.time.addEvent({
        delay: Math.random() * 3000,
        callback: () => sparkles.start(),
        loop: false
      })
    })
  }

  renderStartEnd() {
    const { start, end } = this.currentLevel
    
    const startX = this.offsetX + start.col * this.cellSize + this.cellSize / 2
    const startY = this.offsetY + start.row * this.cellSize + this.cellSize / 2
    
    const startMarker = this.scene.add.circle(startX, startY, this.cellSize * 0.4, this.theme.startFill, 0.8)
    startMarker.setStrokeStyle(3, this.theme.startStroke, 1)
    
    const startText = this.scene.add.text(startX, startY, '起', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    })
    startText.setOrigin(0.5)
    
    this.scene.tweens.add({
      targets: [startMarker],
      scale: { from: 0.9, to: 1.1 },
      alpha: { from: 0.6, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    const endX = this.offsetX + end.col * this.cellSize + this.cellSize / 2
    const endY = this.offsetY + end.row * this.cellSize + this.cellSize / 2
    
    const endMarker = this.scene.add.circle(endX, endY, this.cellSize * 0.4, this.theme.endFill, 0.8)
    endMarker.setStrokeStyle(3, this.theme.endStroke, 1)
    
    const endText = this.scene.add.text(endX, endY, '终', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    })
    endText.setOrigin(0.5)
    
    this.scene.tweens.add({
      targets: [endMarker],
      scale: { from: 1.1, to: 0.9 },
      alpha: { from: 1, to: 0.6 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  isObstacle(row, col) {
    return this.currentLevel.obstacles.some(
      obs => obs.row === row && obs.col === col
    )
  }

  isStart(row, col) {
    return this.currentLevel.start.row === row && this.currentLevel.start.col === col
  }

  isEnd(row, col) {
    return this.currentLevel.end.row === row && this.currentLevel.end.col === col
  }

  getPlantAt(row, col) {
    return this.currentLevel.plants.find(
      p => p.row === row && p.col === col
    )
  }

  getCellAt(row, col) {
    if (row < 0 || row >= this.currentLevel.gridSize.rows ||
        col < 0 || col >= this.currentLevel.gridSize.cols) {
      return null
    }
    return this.gridCells[row][col]
  }

  getCellAtPosition(worldX, worldY) {
    const col = Math.floor((worldX - this.offsetX) / this.cellSize)
    const row = Math.floor((worldY - this.offsetY) / this.cellSize)
    return this.getCellAt(row, col)
  }

  getWorldPosition(row, col) {
    return {
      x: this.offsetX + col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + row * this.cellSize + this.cellSize / 2
    }
  }

  areAdjacent(cell1, cell2) {
    const rowDiff = Math.abs(cell1.row - cell2.row)
    const colDiff = Math.abs(cell1.col - cell2.col)
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
  }

  getCurrentLevel() {
    return this.currentLevel
  }
}
