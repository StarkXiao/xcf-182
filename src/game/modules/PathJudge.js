import { ThemeManager } from './ThemeManager.js'

export class PathJudge {
  constructor(scene, levelMap, plantState) {
    this.scene = scene
    this.levelMap = levelMap
    this.plantState = plantState
    this.selectedPath = []
    this.isDrawing = false
    this.pathLine = null
    this.pathGraphics = null
    this.onPathComplete = null
    this.onPathInvalid = null
    
    this.themeManager = ThemeManager.getInstance()
    this.themeUnsubscribe = this.themeManager.onThemeChange((theme) => {
      this.applyTheme(theme)
    })
  }

  init() {
    this.selectedPath = []
    this.isDrawing = false
    this.createPathGraphics()
    this.setupInputHandlers()
  }

  createPathGraphics() {
    if (this.pathGraphics) {
      this.pathGraphics.destroy()
    }
    this.pathGraphics = this.scene.add.graphics()
    this.pathGraphics.setDepth(50)
  }

  setupInputHandlers() {
    this.scene.input.on('pointerdown', this.onPointerDown, this)
    this.scene.input.on('pointermove', this.onPointerMove, this)
    this.scene.input.on('pointerup', this.onPointerUp, this)
  }

  removeInputHandlers() {
    this.scene.input.off('pointerdown', this.onPointerDown, this)
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
  }

  onPointerDown(pointer) {
    const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)
    
    if (!cell || cell.isObstacle) return
    
    if (cell.isStart || (this.selectedPath.length === 0 && this.isValidStart(cell))) {
      this.isDrawing = true
      this.selectedPath = [cell]
      cell.isOnPath = true
      this.updatePathDisplay()
      this.highlightCell(cell, 0x3b82f6)
    }
  }

  onPointerMove(pointer) {
    if (!this.isDrawing) return
    
    const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)
    
    if (!cell || cell.isObstacle) return
    
    const lastCell = this.selectedPath[this.selectedPath.length - 1]
    
    if (cell === lastCell) return
    
    if (this.selectedPath.length > 1) {
      const prevCell = this.selectedPath[this.selectedPath.length - 2]
      if (cell === prevCell) {
        const removedCell = this.selectedPath.pop()
        removedCell.isOnPath = false
        this.updatePathDisplay()
        this.unhighlightCell(removedCell)
        return
      }
    }
    
    if (this.selectedPath.includes(cell)) return
    
    if (this.levelMap.areAdjacent(lastCell, cell)) {
      cell.isOnPath = true
      this.selectedPath.push(cell)
      this.updatePathDisplay()
      this.highlightCell(cell, 0x3b82f6)
      
      if (cell.plant && cell.plantSprite) {
        this.plantState.lightUp(cell.plantSprite)
      }
    }
  }

  onPointerUp() {
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
    
    this.pathGraphics.lineStyle(4, 0x3b82f6, 0.8)
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
    
    this.pathGraphics.lineStyle(2, 0x60a5fa, 0.6)
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
      const gridTheme = this.themeManager.getGridColors()
      cell.sprite.setFillStyle(gridTheme.cell, 0.6)
      cell.sprite.setStrokeStyle(1, gridTheme.cellStroke, 0.5)
    }
  }

  applyTheme(theme) {
    const gridTheme = theme.grid
    this.selectedPath.forEach(cell => {
      if (cell.sprite && !cell.isOnPath) {
        cell.sprite.setFillStyle(gridTheme.cell, 0.6)
        cell.sprite.setStrokeStyle(1, gridTheme.cellStroke, 0.5)
      }
    })
  }

  showSuccessEffect() {
    this.selectedPath.forEach((cell, index) => {
      this.scene.time.delayedCall(index * 100, () => {
        this.highlightCell(cell, 0x22c55e)
        
        const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
        const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
          speed: { min: 30, max: 100 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 600,
          tint: 0x22c55e,
          quantity: 10,
          duration: 200
        })
      })
    })
  }

  showErrorEffect() {
    this.selectedPath.forEach(cell => {
      this.highlightCell(cell, 0xef4444)
      
      const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
      const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
        speed: { min: 20, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        tint: 0xef4444,
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
  }

  getPathLength() {
    return this.selectedPath.length
  }

  getSelectedPath() {
    return [...this.selectedPath]
  }

  showHint() {
    const level = this.levelMap.currentLevel
    const correctPath = level.correctPath
    
    correctPath.forEach((pos, index) => {
      this.scene.time.delayedCall(index * 200, () => {
        const cell = this.levelMap.getCellAt(pos.row, pos.col)
        if (cell) {
          this.highlightCell(cell, 0xfbbf24)
          
          this.scene.time.delayedCall(1000, () => {
            if (!cell.isOnPath) {
              this.unhighlightCell(cell)
            }
          })
        }
      })
    })
  }

  destroy() {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe()
    }
    this.removeInputHandlers()
    if (this.pathGraphics) {
      this.pathGraphics.destroy()
    }
    this.selectedPath = []
  }
}
