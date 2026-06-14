import Phaser from 'phaser'
import { LevelMap } from '../modules/LevelMap.js'
import { PlantState } from '../modules/PlantState.js'
import { Effects } from '../modules/Effects.js'
import { LEVELS } from '../data/levels.js'
import { ThemeManager } from '../modules/ThemeManager.js'

const PLAYER1_COLORS = {
  primary: 0x3b82f6,
  secondary: 0x60a5fa,
  accent: 0x93c5fd,
  path: 0x3b82f6,
  pathGlow: 0x60a5fa,
  success: 0x22c55e,
  error: 0xef4444
}

const PLAYER2_COLORS = {
  primary: 0xec4899,
  secondary: 0xf472b6,
  accent: 0xf9a8d4,
  path: 0xec4899,
  pathGlow: 0xf472b6,
  success: 0x22c55e,
  error: 0xef4444
}

class PlayerPathJudge {
  constructor(scene, levelMap, plantState, playerId, colors) {
    this.scene = scene
    this.levelMap = levelMap
    this.plantState = plantState
    this.playerId = playerId
    this.colors = colors
    this.selectedPath = []
    this.isDrawing = false
    this.pathGraphics = null
    this.onPathComplete = null
    this.onPathInvalid = null
    this.onPathUpdate = null
  }

  init() {
    this.selectedPath = []
    this.isDrawing = false
    this.createPathGraphics()
  }

  createPathGraphics() {
    if (this.pathGraphics) {
      this.pathGraphics.destroy()
    }
    this.pathGraphics = this.scene.add.graphics()
    this.pathGraphics.setDepth(50 + this.playerId * 10)
  }

  handlePointerDown(pointer) {
    const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)
    
    if (!cell || cell.isObstacle) return false
    
    if (cell.isStart || (this.selectedPath.length === 0 && this.isValidStart(cell))) {
      this.isDrawing = true
      this.selectedPath = [cell]
      cell.isOnPath = true
      this.updatePathDisplay()
      this.highlightCell(cell, this.colors.path)
      if (this.onPathUpdate) {
        this.onPathUpdate([...this.selectedPath])
      }
      return true
    }
    return false
  }

  handlePointerMove(pointer) {
    if (!this.isDrawing) return false
    
    const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)
    
    if (!cell || cell.isObstacle) return false
    
    const lastCell = this.selectedPath[this.selectedPath.length - 1]
    
    if (cell === lastCell) return false
    
    if (this.selectedPath.length > 1) {
      const prevCell = this.selectedPath[this.selectedPath.length - 2]
      if (cell === prevCell) {
        const removedCell = this.selectedPath.pop()
        removedCell.isOnPath = false
        this.updatePathDisplay()
        this.unhighlightCell(removedCell)
        if (this.onPathUpdate) {
          this.onPathUpdate([...this.selectedPath])
        }
        return true
      }
    }
    
    if (this.selectedPath.includes(cell)) return false
    
    if (this.levelMap.areAdjacent(lastCell, cell)) {
      cell.isOnPath = true
      this.selectedPath.push(cell)
      this.updatePathDisplay()
      this.highlightCell(cell, this.colors.path)
      
      if (cell.plant && cell.plantSprite) {
        this.plantState.lightUp(cell.plantSprite)
      }
      
      if (this.onPathUpdate) {
        this.onPathUpdate([...this.selectedPath])
      }
      return true
    }
    return false
  }

  handlePointerUp() {
    if (!this.isDrawing) return
    
    this.isDrawing = false
    
    const lastCell = this.selectedPath[this.selectedPath.length - 1]
    
    if (lastCell && lastCell.isEnd) {
      if (this.validatePath()) {
        this.showSuccessEffect()
        if (this.onPathComplete) {
          this.onPathComplete(this.selectedPath)
        }
      } else {
        this.showErrorEffect()
        if (this.onPathInvalid) {
          this.onPathInvalid()
        }
        this.resetPath()
      }
    } else {
      if (this.onPathInvalid) {
        this.onPathInvalid()
      }
      this.resetPath()
    }
  }

  isValidStart(cell) {
    const { start } = this.levelMap.currentLevel
    return cell.row === start.row && cell.col === start.col
  }

  validatePath() {
    const level = this.levelMap.currentLevel
    const correctPath = level.correctPath
    
    if (this.selectedPath.length < 2) return false
    
    const firstCell = this.selectedPath[0]
    const lastCell = this.selectedPath[this.selectedPath.length - 1]
    
    if (!firstCell.isStart || !lastCell.isEnd) return false
    
    for (let i = 0; i < this.selectedPath.length; i++) {
      const cell = this.selectedPath[i]
      
      if (cell.isObstacle) return false
      
      const isInCorrectPath = correctPath.some(
        p => p.row === cell.row && p.col === cell.col
      )
      if (!isInCorrectPath) return false
      
      if (i > 0) {
        const prevCell = this.selectedPath[i - 1]
        if (!this.levelMap.areAdjacent(prevCell, cell)) return false
      }
    }
    
    const requiredPlants = correctPath.filter(p => {
      const cell = this.levelMap.getCellAt(p.row, p.col)
      return cell && cell.plant
    })
    
    const litRequiredPlants = requiredPlants.filter(p => {
      const cell = this.levelMap.getCellAt(p.row, p.col)
      return cell && cell.isLit
    })
    
    return litRequiredPlants.length >= Math.ceil(requiredPlants.length * 0.5)
  }

  updatePathDisplay() {
    if (!this.pathGraphics) return
    
    this.pathGraphics.clear()
    
    if (this.selectedPath.length < 2) return
    
    this.pathGraphics.lineStyle(4, this.colors.path, 0.8)
    this.pathGraphics.beginPath()
    
    const firstPos = this.levelMap.getWorldPosition(
      this.selectedPath[0].row,
      this.selectedPath[0].col
    )
    this.pathGraphics.moveTo(firstPos.x, firstPos.y)
    
    for (let i = 1; i < this.selectedPath.length; i++) {
      const pos = this.levelMap.getWorldPosition(
        this.selectedPath[i].row,
        this.selectedPath[i].col
      )
      this.pathGraphics.lineTo(pos.x, pos.y)
    }
    
    this.pathGraphics.strokePath()
    
    this.pathGraphics.lineStyle(2, this.colors.pathGlow, 0.6)
    this.pathGraphics.beginPath()
    this.pathGraphics.moveTo(firstPos.x, firstPos.y)
    
    for (let i = 1; i < this.selectedPath.length; i++) {
      const pos = this.levelMap.getWorldPosition(
        this.selectedPath[i].row,
        this.selectedPath[i].col
      )
      this.pathGraphics.lineTo(pos.x, pos.y)
    }
    this.pathGraphics.strokePath()
  }

  highlightCell(cell, color) {
    if (cell.sprite) {
      cell.sprite.setFillStyle(color, 0.3)
      cell.sprite.setStrokeStyle(2, color, 0.8)
    }
  }

  unhighlightCell(cell) {
    if (cell.sprite) {
      const themeManager = ThemeManager.getInstance()
      const gridTheme = themeManager.getGridColors()
      cell.sprite.setFillStyle(gridTheme.cell, 0.6)
      cell.sprite.setStrokeStyle(1, gridTheme.cellStroke, 0.5)
    }
  }

  showSuccessEffect() {
    this.selectedPath.forEach((cell, index) => {
      this.scene.time.delayedCall(index * 100, () => {
        this.highlightCell(cell, this.colors.success)
        
        const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
        const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
          speed: { min: 30, max: 100 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 600,
          tint: this.colors.success,
          quantity: 10,
          duration: 200
        })
      })
    })
  }

  showErrorEffect() {
    this.selectedPath.forEach(cell => {
      this.highlightCell(cell, this.colors.error)
      
      const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
      const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
        speed: { min: 20, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        tint: this.colors.error,
        quantity: 8,
        duration: 150
      })
    })
  }

  resetPath() {
    this.selectedPath.forEach(cell => {
      cell.isOnPath = false
      this.unhighlightCell(cell)
    })
    
    this.selectedPath = []
    this.isDrawing = false
    
    if (this.pathGraphics) {
      this.pathGraphics.clear()
    }
    
    this.plantState.resetAll()
    
    if (this.onPathUpdate) {
      this.onPathUpdate([])
    }
  }

  getPathLength() {
    return this.selectedPath.length
  }

  getSelectedPath() {
    return [...this.selectedPath]
  }

  destroy() {
    if (this.pathGraphics) {
      this.pathGraphics.destroy()
    }
    this.selectedPath = []
  }
}

class VersusLevelMap extends LevelMap {
  constructor(scene, themeColors = null, offsetX = 0, offsetY = 0) {
    super(scene, themeColors)
    this.baseOffsetX = offsetX
    this.baseOffsetY = offsetY
  }

  createGrid() {
    const { rows, cols } = this.currentLevel.gridSize
    const gameWidth = this.scene.game.config.width
    const gameHeight = this.scene.game.config.height
    
    const halfWidth = gameWidth / 2 - 40
    const maxCellWidth = (halfWidth - 60) / cols
    const maxCellHeight = (gameHeight - 200) / rows
    this.cellSize = Math.min(maxCellWidth, maxCellHeight, 60)
    
    this.offsetX = this.baseOffsetX + (halfWidth - cols * this.cellSize) / 2
    this.offsetY = this.baseOffsetY + (gameHeight - rows * this.cellSize) / 2 + 50
    
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

  getCellAtPosition(worldX, worldY) {
    const col = Math.floor((worldX - this.offsetX) / this.cellSize)
    const row = Math.floor((worldY - this.offsetY) / this.cellSize)
    return this.getCellAt(row, col)
  }
}

class OpponentPathPreview {
  constructor(scene, targetLevelMap, colors) {
    this.scene = scene
    this.targetLevelMap = targetLevelMap
    this.colors = colors
    this.pathGraphics = null
    this.currentPath = []
  }

  init() {
    if (this.pathGraphics) {
      this.pathGraphics.destroy()
    }
    this.pathGraphics = this.scene.add.graphics()
    this.pathGraphics.setDepth(40)
    this.pathGraphics.setAlpha(0.4)
  }

  updatePath(pathCells) {
    this.currentPath = pathCells
    
    if (!this.pathGraphics) return
    
    this.pathGraphics.clear()
    
    if (pathCells.length < 2) return
    
    this.pathGraphics.lineStyle(3, this.colors.path, 0.5)
    this.pathGraphics.beginPath()
    
    const firstPos = this.targetLevelMap.getWorldPosition(
      pathCells[0].row,
      pathCells[0].col
    )
    this.pathGraphics.moveTo(firstPos.x, firstPos.y)
    
    for (let i = 1; i < pathCells.length; i++) {
      const pos = this.targetLevelMap.getWorldPosition(
        pathCells[i].row,
        pathCells[i].col
      )
      this.pathGraphics.lineTo(pos.x, pos.y)
    }
    
    this.pathGraphics.strokePath()
    
    pathCells.forEach(cell => {
      const pos = this.targetLevelMap.getWorldPosition(cell.row, cell.col)
      const dot = this.scene.add.circle(pos.x, pos.y, 4, this.colors.path, 0.6)
      this.scene.tweens.add({
        targets: dot,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        delay: 100,
        onComplete: () => dot.destroy()
      })
    })
  }

  destroy() {
    if (this.pathGraphics) {
      this.pathGraphics.destroy()
    }
  }
}

export class VersusScene extends Phaser.Scene {
  constructor() {
    super('VersusScene')
    this.currentLevelIndex = 0
    this.player1 = {
      levelMap: null,
      plantState: null,
      pathJudge: null,
      opponentPreview: null,
      score: 0,
      attempts: 0,
      completed: false,
      finishTime: 0
    }
    this.player2 = {
      levelMap: null,
      plantState: null,
      pathJudge: null,
      opponentPreview: null,
      score: 0,
      attempts: 0,
      completed: false,
      finishTime: 0
    }
    this.effects = null
    this.gameStarted = false
    this.countdown = 3
    this.countdownText = null
    this.gameTime = 0
    this.maxTime = 120
    this.timerText = null
    this.gameEnded = false
    this.winner = null
    this.onBackToStart = null
    this.isAnimating = false
    this.themePanel = null
    this.themeButtons = []
    
    this.themeManager = ThemeManager.getInstance()
    this.themeManager.loadThemeFromStorage()
  }

  setVersusConfig(config) {
    this.onBackToStart = config.onBackToStart || null
    this.maxTime = config.maxTime || 120
  }

  preload() {
  }

  create() {
    this.effects = new Effects(this)
    this.effects.init()
    
    this.createDivider()
    this.createPlayerLabels()
    this.createTimerDisplay()
    this.createBackButton()
    this.createThemeButton()
    
    this.startCountdown()
    
    this.input.on('pointerdown', this.onPointerDown, this)
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup', this.onPointerUp, this)
  }

  createThemeButton() {
    const width = this.game.config.width
    const currentTheme = this.themeManager.getCurrentTheme()
    
    const themeBtn = this.add.text(width / 2, 100, `🎨 ${currentTheme.icon} 主题`, {
      fontSize: '14px',
      fill: '#a78bfa',
      fontStyle: 'bold',
      backgroundColor: '#1e1b4b',
      padding: { x: 12, y: 6 }
    })
    themeBtn.setOrigin(0.5)
    themeBtn.setDepth(101)
    const themeBtnBounds = themeBtn.getBounds()
    themeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, themeBtnBounds.width, themeBtnBounds.height), Phaser.Geom.Rectangle.Contains)
    themeBtn.input.cursor = 'pointer'
    
    themeBtn.on('pointerdown', () => {
      this.toggleThemePanel()
    })
    
    themeBtn.on('pointerover', () => {
      themeBtn.setBackgroundColor('#3b0764')
    })
    themeBtn.on('pointerout', () => {
      themeBtn.setBackgroundColor('#1e1b4b')
    })
    
    this.themeToggleBtn = themeBtn
    this.createThemePanel()
  }

  createThemePanel() {
    const width = this.game.config.width
    const height = this.game.config.height
    
    this.themePanel = this.add.container(0, 0)
    this.themePanel.setDepth(500)
    this.themePanel.setVisible(false)
    
    const panelWidth = 320
    const panelHeight = 340
    const panelX = width / 2
    const panelY = height / 2
    
    const bg = this.add.rectangle(
      panelX, panelY,
      panelWidth, panelHeight,
      0x0d1117, 0.98
    )
    bg.setStrokeStyle(2, 0xa78bfa, 0.9)
    this.themePanel.add(bg)
    
    const title = this.add.text(panelX, panelY - panelHeight / 2 + 25, '🎨 选择主题', {
      fontSize: '20px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5, 0.5)
    this.themePanel.add(title)
    
    const subtitle = this.add.text(panelX, panelY - panelHeight / 2 + 50, '切换洞穴风格主题', {
      fontSize: '13px',
      fill: '#94a3b8'
    })
    subtitle.setOrigin(0.5, 0.5)
    this.themePanel.add(subtitle)
    
    const themes = this.themeManager.getAllThemes()
    const btnWidth = panelWidth - 60
    const btnHeight = 50
    const startY = panelY - panelHeight / 2 + 80
    
    themes.forEach((theme, index) => {
      const btnY = startY + index * (btnHeight + 12)
      
      const btnBg = this.add.rectangle(
        panelX, btnY,
        btnWidth, btnHeight,
        theme.grid.cell, 0.8
      )
      btnBg.setStrokeStyle(2, theme.grid.cellStroke, 0.8)
      btnBg.setInteractive(new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains)
      if (btnBg.input) btnBg.input.cursor = 'pointer'
      this.themePanel.add(btnBg)
      
      const iconText = this.add.text(panelX - btnWidth / 2 + 25, btnY, theme.icon, {
        fontSize: '22px'
      })
      iconText.setOrigin(0, 0.5)
      this.themePanel.add(iconText)
      
      const nameText = this.add.text(panelX - btnWidth / 2 + 60, btnY - 8, theme.name, {
        fontSize: '15px',
        fill: '#ffffff',
        fontStyle: 'bold'
      })
      nameText.setOrigin(0, 0.5)
      this.themePanel.add(nameText)
      
      const descY = btnY + 12
      const dotColors = [
        theme.plants.moss.color,
        theme.plants.mushroom.color,
        theme.plants.flower.color
      ]
      
      for (let i = 0; i < 3; i++) {
        const dot = this.add.circle(
          panelX - btnWidth / 2 + 60 + i * 18,
          descY,
          5,
          dotColors[i],
          0.9
        )
        this.themePanel.add(dot)
      }
      
      const isCurrent = theme.id === this.themeManager.currentThemeId
      if (isCurrent) {
        const check = this.add.text(panelX + btnWidth / 2 - 25, btnY, '✓', {
          fontSize: '18px',
          fill: '#22c55e',
          fontStyle: 'bold'
        })
        check.setOrigin(0.5, 0.5)
        this.themePanel.add(check)
        btnBg.setStrokeStyle(3, theme.grid.endFill, 1)
      }
      
      btnBg.on('pointerdown', () => {
        if (theme.id !== this.themeManager.currentThemeId) {
          this.switchTheme(theme.id)
        }
      })
      
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(theme.grid.bgStroke, 0.9)
      })
      btnBg.on('pointerout', () => {
        const isSelected = theme.id === this.themeManager.currentThemeId
        btnBg.setFillStyle(theme.grid.cell, 0.8)
      })
      
      this.themeButtons.push({
        bg: btnBg,
        theme: theme
      })
    })
    
    const tipText = this.add.text(panelX, panelY + panelHeight / 2 - 20, '主题切换后所有元素将实时更新', {
      fontSize: '11px',
      fill: '#64748b'
    })
    tipText.setOrigin(0.5, 0.5)
    this.themePanel.add(tipText)
    
    const closeTarget = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.01
    )
    closeTarget.setDepth(499)
    closeTarget.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains)
    closeTarget.setVisible(false)
    closeTarget.on('pointerdown', () => {
      this.hideThemePanel()
    })
    this.themePanelCloseMask = closeTarget
  }

  switchTheme(themeId) {
    const changed = this.themeManager.setTheme(themeId)
    if (changed) {
      this.themeManager.saveThemeToStorage()
      this.refreshThemePanel()
      this.playThemeChangeEffect()
      
      const newTheme = this.themeManager.getCurrentTheme()
      if (this.themeToggleBtn) {
        this.themeToggleBtn.setText(`🎨 ${newTheme.icon} 主题`)
      }
    }
  }

  refreshThemePanel() {
    this.themeButtons.forEach(item => {
      const theme = item.theme
      const isCurrent = theme.id === this.themeManager.currentThemeId
      if (isCurrent) {
        item.bg.setStrokeStyle(3, theme.grid.endFill, 1)
      } else {
        item.bg.setStrokeStyle(2, theme.grid.cellStroke, 0.8)
      }
    })
  }

  playThemeChangeEffect() {
    const width = this.game.config.width
    const height = this.game.config.height
    const currentTheme = this.themeManager.getCurrentTheme()
    
    for (let i = 0; i < 25; i++) {
      this.time.delayedCall(i * 30, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const colors = Object.values(currentTheme.plants).map(p => p.glowColor)
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        this.add.particles(x, y, 'sparkle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 700,
          tint: color,
          quantity: 8,
          duration: 250,
          blendMode: 'ADD'
        })
      })
    }
  }

  toggleThemePanel() {
    if (!this.themePanel) return
    
    if (this.themePanel.visible) {
      this.hideThemePanel()
    } else {
      this.showThemePanel()
    }
  }

  showThemePanel() {
    if (!this.themePanel) return
    
    this.themePanelCloseMask.setVisible(true)
    this.themePanel.setVisible(true)
    this.themePanel.setAlpha(0)
    this.themePanel.setScale(0.8)
    
    this.tweens.add({
      targets: this.themePanel,
      alpha: 1,
      scale: 1,
      duration: 250,
      ease: 'Back.out'
    })
  }

  hideThemePanel() {
    if (!this.themePanel) return
    
    this.themePanelCloseMask.setVisible(false)
    
    this.tweens.add({
      targets: this.themePanel,
      alpha: 0,
      scale: 0.8,
      duration: 150,
      ease: 'Cubic.In',
      onComplete: () => {
        this.themePanel.setVisible(false)
      }
    })
  }

  createDivider() {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const divider = this.add.rectangle(width / 2, height / 2, 4, height, 0x334155, 0.8)
    divider.setDepth(5)
    
    const dividerGlow = this.add.rectangle(width / 2, height / 2, 8, height, 0x475569, 0.3)
    dividerGlow.setDepth(4)
  }

  createPlayerLabels() {
    const width = this.game.config.width
    
    const p1Label = this.add.text(width / 4, 50, '玩家 1', {
      fontSize: '24px',
      fill: '#60a5fa',
      fontStyle: 'bold'
    })
    p1Label.setOrigin(0.5)
    p1Label.setDepth(100)
    
    const p1Sub = this.add.text(width / 4, 78, '👤 蓝色方', {
      fontSize: '14px',
      fill: '#94a3b8'
    })
    p1Sub.setOrigin(0.5)
    p1Sub.setDepth(100)
    
    const p2Label = this.add.text((width * 3) / 4, 50, '玩家 2', {
      fontSize: '24px',
      fill: '#f472b6',
      fontStyle: 'bold'
    })
    p2Label.setOrigin(0.5)
    p2Label.setDepth(100)
    
    const p2Sub = this.add.text((width * 3) / 4, 78, '👤 粉色方', {
      fontSize: '14px',
      fill: '#94a3b8'
    })
    p2Sub.setOrigin(0.5)
    p2Sub.setDepth(100)
  }

  createTimerDisplay() {
    const width = this.game.config.width
    
    const timerBg = this.add.rectangle(width / 2, 50, 120, 50, 0x0d1117, 0.9)
    timerBg.setStrokeStyle(2, 0x475569, 0.8)
    timerBg.setDepth(100)
    
    this.timerText = this.add.text(width / 2, 50, '⏱ 02:00', {
      fontSize: '20px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    this.timerText.setOrigin(0.5)
    this.timerText.setDepth(101)
  }

  createBackButton() {
    const backBtn = this.add.text(20, 50, '← 返回', {
      fontSize: '16px',
      fill: '#94a3b8',
      fontStyle: 'bold',
      backgroundColor: '#1e293b',
      padding: { x: 12, y: 6 }
    })
    backBtn.setOrigin(0, 0.5)
    backBtn.setDepth(101)
    backBtn.setInteractive({ useHandCursor: true })
    
    backBtn.on('pointerdown', () => {
      if (this.onBackToStart) {
        this.onBackToStart()
      }
    })
    
    backBtn.on('pointerover', () => {
      backBtn.setFill('#e2e8f0')
      backBtn.setBackgroundColor('#334155')
    })
    backBtn.on('pointerout', () => {
      backBtn.setFill('#94a3b8')
      backBtn.setBackgroundColor('#1e293b')
    })
  }

  startCountdown() {
    const width = this.game.config.width
    const height = this.game.config.height
    
    this.countdown = 3
    
    this.countdownText = this.add.text(width / 2, height / 2, '3', {
      fontSize: '120px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    this.countdownText.setOrigin(0.5)
    this.countdownText.setDepth(500)
    
    const readyText = this.add.text(width / 2, height / 2 - 100, '准备开始！', {
      fontSize: '28px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    readyText.setOrigin(0.5)
    readyText.setDepth(500)
    
    this.tweens.add({
      targets: [this.countdownText, readyText],
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.countdown--
        
        if (this.countdown > 0) {
          this.countdownText.setText(this.countdown.toString())
          
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Back.out'
          })
        } else {
          this.countdownTimer.remove(false)
          this.countdownText.setText('开始！')
          readyText.destroy()
          
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Back.out'
          })
          
          this.time.delayedCall(500, () => {
            this.countdownText.destroy()
            this.startGame()
          })
        }
      },
      repeat: 3
    })
  }

  startGame() {
    this.gameStarted = true
    this.gameEnded = false
    this.gameTime = this.maxTime
    this.gameStartTime = Date.now()
    this.winner = null
    
    this.player1.completed = false
    this.player1.score = 0
    this.player1.attempts = 0
    this.player1.finishTime = 0
    
    this.player2.completed = false
    this.player2.score = 0
    this.player2.attempts = 0
    this.player2.finishTime = 0
    
    this.initPlayer1()
    this.initPlayer2()
    
    this.startGameTimer()
  }

  initPlayer1() {
    const width = this.game.config.width
    
    this.player1.levelMap = new VersusLevelMap(this, null, 0, 0)
    this.player1.levelMap.loadLevel(this.currentLevelIndex)
    this.player1.levelMap.render()
    
    this.player1.plantState = new PlantState(this, this.player1.levelMap)
    this.player1.plantState.init()
    
    this.player1.pathJudge = new PlayerPathJudge(this, this.player1.levelMap, this.player1.plantState, 1, PLAYER1_COLORS)
    this.player1.pathJudge.init()
    
    this.player1.pathJudge.onPathComplete = (path) => this.onPlayer1Complete(path)
    this.player1.pathJudge.onPathInvalid = () => this.onPlayer1Invalid()
    
    this.player1.opponentPreview = new OpponentPathPreview(this, this.player1.levelMap, PLAYER2_COLORS)
    this.player1.opponentPreview.init()
    
    this.player1.pathJudge.onPathUpdate = (path) => {
      if (this.player2.opponentPreview) {
        this.player2.opponentPreview.updatePath(path)
      }
    }
  }

  initPlayer2() {
    const width = this.game.config.width
    
    this.player2.levelMap = new VersusLevelMap(this, null, width / 2, 0)
    this.player2.levelMap.loadLevel(this.currentLevelIndex)
    this.player2.levelMap.render()
    
    this.player2.plantState = new PlantState(this, this.player2.levelMap)
    this.player2.plantState.init()
    
    this.player2.pathJudge = new PlayerPathJudge(this, this.player2.levelMap, this.player2.plantState, 2, PLAYER2_COLORS)
    this.player2.pathJudge.init()
    
    this.player2.pathJudge.onPathComplete = (path) => this.onPlayer2Complete(path)
    this.player2.pathJudge.onPathInvalid = () => this.onPlayer2Invalid()
    
    this.player2.opponentPreview = new OpponentPathPreview(this, this.player2.levelMap, PLAYER1_COLORS)
    this.player2.opponentPreview.init()
    
    this.player2.pathJudge.onPathUpdate = (path) => {
      if (this.player1.opponentPreview) {
        this.player1.opponentPreview.updatePath(path)
      }
    }
  }

  startGameTimer() {
    if (this.gameTimer) {
      this.gameTimer.remove(false)
      this.gameTimer = null
    }
    
    this.lastTimerUpdate = Date.now()
    
    this.gameTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        const now = Date.now()
        const elapsed = Math.floor((now - this.gameStartTime) / 1000)
        const remaining = Math.max(0, this.maxTime - elapsed)
        
        if (remaining !== this.gameTime) {
          this.gameTime = remaining
          this.updateTimerDisplay()
        }
        
        if (this.gameTime <= 0) {
          this.endGameDueToTime()
        }
      },
      loop: true
    })
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.gameTime / 60)
    const seconds = this.gameTime % 60
    const timeStr = `⏱ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    
    if (this.timerText) {
      this.timerText.setText(timeStr)
    }
    
    if (this.gameTime <= 10) {
      this.timerText.setFill('#ef4444')
      this.tweens.add({
        targets: this.timerText,
        scale: { from: 1.1, to: 1 },
        duration: 300,
        ease: 'Cubic.out'
      })
    } else if (this.gameTime <= 30) {
      this.timerText.setFill('#f97316')
    } else {
      this.timerText.setFill('#fbbf24')
    }
  }

  onPointerDown(pointer) {
    if (!this.gameStarted || this.gameEnded) return
    
    const width = this.game.config.width
    
    if (pointer.x < width / 2) {
      this.player1.pathJudge.handlePointerDown(pointer)
    } else {
      this.player2.pathJudge.handlePointerDown(pointer)
    }
  }

  onPointerMove(pointer) {
    if (!this.gameStarted || this.gameEnded) return
    
    const width = this.game.config.width
    
    if (pointer.x < width / 2) {
      this.player1.pathJudge.handlePointerMove(pointer)
    } else {
      this.player2.pathJudge.handlePointerMove(pointer)
    }
  }

  onPointerUp(pointer) {
    if (!this.gameStarted || this.gameEnded) return
    
    const width = this.game.config.width
    
    if (pointer.x < width / 2) {
      this.player1.pathJudge.handlePointerUp()
    } else {
      this.player2.pathJudge.handlePointerUp()
    }
  }

  onPlayer1Complete(path) {
    if (this.player1.completed) return
    
    this.player1.completed = true
    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000)
    this.player1.finishTime = elapsed
    this.player1.attempts++
    
    const litCount = this.player1.plantState.getLitCount()
    const levelScore = litCount * 10 + 50
    this.player1.score = levelScore
    
    const endPos = this.player1.levelMap.getWorldPosition(
      this.player1.levelMap.currentLevel.end.row,
      this.player1.levelMap.currentLevel.end.col
    )
    this.effects.createSuccessEffect(endPos.x, endPos.y, PLAYER1_COLORS.success)
    
    this.checkWinCondition()
  }

  onPlayer2Complete(path) {
    if (this.player2.completed) return
    
    this.player2.completed = true
    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000)
    this.player2.finishTime = elapsed
    this.player2.attempts++
    
    const litCount = this.player2.plantState.getLitCount()
    const levelScore = litCount * 10 + 50
    this.player2.score = levelScore
    
    const endPos = this.player2.levelMap.getWorldPosition(
      this.player2.levelMap.currentLevel.end.row,
      this.player2.levelMap.currentLevel.end.col
    )
    this.effects.createSuccessEffect(endPos.x, endPos.y, PLAYER2_COLORS.success)
    
    this.checkWinCondition()
  }

  onPlayer1Invalid() {
    this.player1.attempts++
  }

  onPlayer2Invalid() {
    this.player2.attempts++
  }

  checkWinCondition() {
    if (this.player1.completed && this.player2.completed) {
      this.determineWinner()
    } else if (this.player1.completed) {
      this.winner = 1
      this.endGame()
    } else if (this.player2.completed) {
      this.winner = 2
      this.endGame()
    }
  }

  determineWinner() {
    if (this.player1.score > this.player2.score) {
      this.winner = 1
    } else if (this.player2.score > this.player1.score) {
      this.winner = 2
    } else {
      if (this.player1.finishTime < this.player2.finishTime) {
        this.winner = 1
      } else if (this.player2.finishTime < this.player1.finishTime) {
        this.winner = 2
      } else {
        this.winner = 0
      }
    }
    this.endGame()
  }

  endGameDueToTime() {
    if (this.gameEnded) return
    
    if (this.player1.completed && !this.player2.completed) {
      this.winner = 1
    } else if (this.player2.completed && !this.player1.completed) {
      this.winner = 2
    } else if (this.player1.completed && this.player2.completed) {
      this.determineWinner()
      return
    } else {
      const p1Progress = this.player1.pathJudge.getPathLength()
      const p2Progress = this.player2.pathJudge.getPathLength()
      
      if (p1Progress > p2Progress) {
        this.winner = 1
      } else if (p2Progress > p1Progress) {
        this.winner = 2
      } else {
        this.winner = 0
      }
    }
    this.endGame()
  }

  endGame() {
    this.gameEnded = true
    this.gameStarted = false
    
    if (this.gameTimer) {
      this.gameTimer.remove(false)
    }
    
    this.showResultPanel()
  }

  showResultPanel() {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const panel = this.add.container(0, 0)
    panel.setDepth(600)
    
    const bg = this.add.rectangle(
      width / 2, height / 2,
      width * 0.7, 400,
      0x0d1117, 0.95
    )
    
    let winnerColor = 0xfbbf24
    let winnerText = '平局！'
    let winnerSub = '势均力敌，再来一局？'
    
    if (this.winner === 1) {
      winnerColor = PLAYER1_COLORS.primary
      winnerText = '🎉 玩家 1 获胜！'
      winnerSub = '蓝色方技高一筹'
    } else if (this.winner === 2) {
      winnerColor = PLAYER2_COLORS.primary
      winnerText = '🎉 玩家 2 获胜！'
      winnerSub = '粉色方更胜一筹'
    }
    
    bg.setStrokeStyle(3, winnerColor, 0.8)
    panel.add(bg)
    
    const title = this.add.text(width / 2, height / 2 - 140, winnerText, {
      fontSize: '32px',
      fill: '#' + winnerColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    const subtitle = this.add.text(width / 2, height / 2 - 100, winnerSub, {
      fontSize: '16px',
      fill: '#94a3b8'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)
    
    const p1ScoreText = this.add.text(width / 2 - 150, height / 2 - 40, `玩家 1: ${this.player1.score} 分`, {
      fontSize: '20px',
      fill: '#60a5fa',
      fontStyle: 'bold'
    })
    p1ScoreText.setOrigin(0.5)
    panel.add(p1ScoreText)
    
    const p2ScoreText = this.add.text(width / 2 + 150, height / 2 - 40, `玩家 2: ${this.player2.score} 分`, {
      fontSize: '20px',
      fill: '#f472b6',
      fontStyle: 'bold'
    })
    p2ScoreText.setOrigin(0.5)
    panel.add(p2ScoreText)
    
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    const p1TimeText = this.add.text(width / 2 - 150, height / 2, 
      `用时: ${this.player1.completed ? formatTime(this.player1.finishTime) : '未完成'}`, {
      fontSize: '14px',
      fill: '#94a3b8'
    })
    p1TimeText.setOrigin(0.5)
    panel.add(p1TimeText)
    
    const p2TimeText = this.add.text(width / 2 + 150, height / 2,
      `用时: ${this.player2.completed ? formatTime(this.player2.finishTime) : '未完成'}`, {
      fontSize: '14px',
      fill: '#94a3b8'
    })
    p2TimeText.setOrigin(0.5)
    panel.add(p2TimeText)
    
    const p1AttemptsText = this.add.text(width / 2 - 150, height / 2 + 35, 
      `尝试: ${this.player1.attempts} 次`, {
      fontSize: '13px',
      fill: '#64748b'
    })
    p1AttemptsText.setOrigin(0.5)
    panel.add(p1AttemptsText)
    
    const p2AttemptsText = this.add.text(width / 2 + 150, height / 2 + 35,
      `尝试: ${this.player2.attempts} 次`, {
      fontSize: '13px',
      fill: '#64748b'
    })
    p2AttemptsText.setOrigin(0.5)
    panel.add(p2AttemptsText)
    
    const restartBtn = this.add.text(width / 2 - 100, height / 2 + 100, '🔄 再来一局', {
      fontSize: '16px',
      fill: '#22c55e',
      fontStyle: 'bold',
      backgroundColor: '#14532d',
      padding: { x: 20, y: 10 }
    })
    restartBtn.setOrigin(0.5)
    restartBtn.setInteractive({ useHandCursor: true })
    
    restartBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          this.restartGame()
        }
      })
    })
    
    restartBtn.on('pointerover', () => {
      restartBtn.setBackgroundColor('#166534')
    })
    restartBtn.on('pointerout', () => {
      restartBtn.setBackgroundColor('#14532d')
    })
    panel.add(restartBtn)
    
    const nextBtn = this.add.text(width / 2 + 100, height / 2 + 100, '下一关 →', {
      fontSize: '16px',
      fill: '#a78bfa',
      fontStyle: 'bold',
      backgroundColor: '#4c1d95',
      padding: { x: 20, y: 10 }
    })
    nextBtn.setOrigin(0.5)
    nextBtn.setInteractive({ useHandCursor: true })
    
    nextBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          this.nextLevel()
        }
      })
    })
    
    nextBtn.on('pointerover', () => {
      nextBtn.setBackgroundColor('#6d28d9')
    })
    nextBtn.on('pointerout', () => {
      nextBtn.setBackgroundColor('#4c1d95')
    })
    panel.add(nextBtn)
    
    const backBtn = this.add.text(width / 2, height / 2 + 155, '🏠 返回首页', {
      fontSize: '14px',
      fill: '#94a3b8',
      fontStyle: 'bold',
      backgroundColor: '#1e293b',
      padding: { x: 20, y: 8 }
    })
    backBtn.setOrigin(0.5)
    backBtn.setInteractive({ useHandCursor: true })
    
    backBtn.on('pointerdown', () => {
      if (this.onBackToStart) {
        this.onBackToStart()
      }
    })
    
    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#334155')
    })
    backBtn.on('pointerout', () => {
      backBtn.setBackgroundColor('#1e293b')
    })
    panel.add(backBtn)
    
    panel.setAlpha(0)
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 60, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [winnerColor, 0xfbbf24, 0x22c55e][Math.floor(Math.random() * 3)]
        
        this.add.particles(x, y, 'sparkle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 1000,
          tint: color,
          quantity: 10,
          duration: 300
        })
      })
    }
  }

  restartGame() {
    this.destroyPlayer1()
    this.destroyPlayer2()
    this.startCountdown()
  }

  nextLevel() {
    this.currentLevelIndex++
    if (this.currentLevelIndex >= LEVELS.length) {
      this.currentLevelIndex = 0
    }
    this.destroyPlayer1()
    this.destroyPlayer2()
    this.startCountdown()
  }

  destroyPlayer1() {
    if (this.player1.pathJudge) {
      this.player1.pathJudge.destroy()
      this.player1.pathJudge = null
    }
    if (this.player1.plantState) {
      this.player1.plantState.destroy()
      this.player1.plantState = null
    }
    if (this.player1.levelMap) {
      if (this.player1.levelMap.destroy) {
        this.player1.levelMap.destroy()
      }
      this.player1.levelMap = null
    }
    if (this.player1.opponentPreview) {
      this.player1.opponentPreview.destroy()
      this.player1.opponentPreview = null
    }
  }

  destroyPlayer2() {
    if (this.player2.pathJudge) {
      this.player2.pathJudge.destroy()
      this.player2.pathJudge = null
    }
    if (this.player2.plantState) {
      this.player2.plantState.destroy()
      this.player2.plantState = null
    }
    if (this.player2.levelMap) {
      if (this.player2.levelMap.destroy) {
        this.player2.levelMap.destroy()
      }
      this.player2.levelMap = null
    }
    if (this.player2.opponentPreview) {
      this.player2.opponentPreview.destroy()
      this.player2.opponentPreview = null
    }
  }

  update(time, delta) {
  }

  destroy() {
    if (this.gameTimer) {
      this.gameTimer.remove(false)
    }
    if (this.countdownTimer) {
      this.countdownTimer.remove(false)
    }
    
    this.input.off('pointerdown', this.onPointerDown, this)
    this.input.off('pointermove', this.onPointerMove, this)
    this.input.off('pointerup', this.onPointerUp, this)
    
    this.destroyPlayer1()
    this.destroyPlayer2()
    
    if (this.effects) {
      this.effects.destroy()
    }
    
    if (this.themePanel) {
      this.themePanel.destroy()
    }
    if (this.themePanelCloseMask) {
      this.themePanelCloseMask.destroy()
    }
  }
}
