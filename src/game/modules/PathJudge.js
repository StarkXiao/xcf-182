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
    this.onHistoryChange = null
    this.maxHistorySize = 3
    this.historyStack = []
    this.redoStack = []
    this.matchedBranchId = null
    
    this.themeManager = ThemeManager.getInstance()
    this.themeUnsubscribe = this.themeManager.onThemeChange((theme) => {
      this.applyTheme(theme)
    })
  }

  init() {
    this.selectedPath = []
    this.isDrawing = false
    this.historyStack = []
    this.redoStack = []
    this.createPathGraphics()
    this.setupInputHandlers()
  }

  _saveHistorySnapshot() {
    const snapshot = {
      path: this.selectedPath.map(cell => ({ row: cell.row, col: cell.col })),
      litPlants: []
    }
    const { rows, cols } = this.levelMap.currentLevel.gridSize
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.levelMap.gridCells[row][col]
        if (cell.plantSprite && cell.plantSprite.getData('isLit')) {
          snapshot.litPlants.push({ row, col })
        }
      }
    }
    this.historyStack.push(snapshot)
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift()
    }
    this.redoStack = []
    if (this.onHistoryChange) {
      this.onHistoryChange(this.canUndo(), this.canRedo())
    }
  }

  _restoreSnapshot(snapshot) {
    this.selectedPath.forEach(cell => {
      cell.isOnPath = false
      this.unhighlightCell(cell)
    })
    this.selectedPath = []
    this.plantState.resetAll()

    const { rows, cols } = this.levelMap.currentLevel.gridSize
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.levelMap.gridCells[row][col]
        cell.isOnPath = false
        cell.isLit = false
      }
    }

    if (this.scene.resetCombo) {
      this.scene.resetCombo()
    }
    this.scene.maxCombo = 0
    this.scene.comboScore = 0

    snapshot.path.forEach(pos => {
      const cell = this.levelMap.getCellAt(pos.row, pos.col)
      if (cell) {
        cell.isOnPath = true
        this.selectedPath.push(cell)
        this.highlightCell(cell, 0x3b82f6)
        
        if (cell.plant && cell.plantSprite && !cell.plant.hidden) {
          const lit = this.plantState.lightUp(cell.plantSprite)
          if (lit && this.scene.updatePlantCombo) {
            this.scene.updatePlantCombo(cell.plant.type)
          }
        }
      }
    })

    this.updatePathDisplay()
  }

  canUndo() {
    return this.historyStack.length > 0
  }

  canRedo() {
    return this.redoStack.length > 0
  }

  undo() {
    if (!this.canUndo()) return false
    const currentSnapshot = {
      path: this.selectedPath.map(cell => ({ row: cell.row, col: cell.col })),
      litPlants: []
    }
    const { rows, cols } = this.levelMap.currentLevel.gridSize
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.levelMap.gridCells[row][col]
        if (cell.plantSprite && cell.plantSprite.getData('isLit')) {
          currentSnapshot.litPlants.push({ row, col })
        }
      }
    }
    this.redoStack.push(currentSnapshot)

    const snapshot = this.historyStack.pop()
    this._restoreSnapshot(snapshot)
    if (this.onHistoryChange) {
      this.onHistoryChange(this.canUndo(), this.canRedo())
    }
    return true
  }

  redo() {
    if (!this.canRedo()) return false
    const currentSnapshot = {
      path: this.selectedPath.map(cell => ({ row: cell.row, col: cell.col })),
      litPlants: []
    }
    const { rows, cols } = this.levelMap.currentLevel.gridSize
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.levelMap.gridCells[row][col]
        if (cell.plantSprite && cell.plantSprite.getData('isLit')) {
          currentSnapshot.litPlants.push({ row, col })
        }
      }
    }
    this.historyStack.push(currentSnapshot)

    const snapshot = this.redoStack.pop()
    this._restoreSnapshot(snapshot)
    if (this.onHistoryChange) {
      this.onHistoryChange(this.canUndo(), this.canRedo())
    }
    return true
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
    
    if (!cell || cell.obstacleType === 'rock') return
    
    if (cell.isStart || (this.selectedPath.length === 0 && this.isValidStart(cell))) {
      this._saveHistorySnapshot()
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
    
    if (!cell || cell.obstacleType === 'rock') return
    
    const lastCell = this.selectedPath[this.selectedPath.length - 1]
    
    if (cell === lastCell) return
    
    if (this.selectedPath.length > 1) {
      const prevCell = this.selectedPath[this.selectedPath.length - 2]
      if (cell === prevCell) {
        this._saveHistorySnapshot()
        const removedCell = this.selectedPath.pop()
        removedCell.isOnPath = false
        if (removedCell.plantSprite) {
          this.plantState.lightOff(removedCell.plantSprite)
        }
        this.updatePathDisplay()
        this.unhighlightCell(removedCell)
        if (this.scene.resetCombo) {
          this.scene.resetCombo()
        }
        return
      }
    }
    
    if (this.selectedPath.includes(cell)) return
    
    if (this.levelMap.areAdjacent(lastCell, cell)) {
      this._saveHistorySnapshot()
      this.addCellToPath(cell)
      
      if (cell.obstacleType === 'ice') {
        this.handleIceSlide(cell, lastCell)
      } else if (cell.obstacleType === 'portal') {
        this.handlePortalTeleport(cell)
      }
    }
  }

  addCellToPath(cell) {
    cell.isOnPath = true
    this.selectedPath.push(cell)
    this.updatePathDisplay()
    this.highlightCell(cell, 0x3b82f6)
    
    if (cell.obstacleType === 'thorn') {
      if (this.scene.applyThornDamage) {
        this.scene.applyThornDamage()
      }
    }
    
    if (cell.plant && cell.plantSprite && !cell.plant.hidden) {
      const lit = this.plantState.lightUp(cell.plantSprite)
      if (lit && this.scene.updatePlantCombo) {
        this.scene.updatePlantCombo(cell.plant.type)
      }
    }
  }

  handleIceSlide(iceCell, fromCell) {
    const rowDiff = iceCell.row - fromCell.row
    const colDiff = iceCell.col - fromCell.col
    
    let nextRow = iceCell.row + rowDiff
    let nextCol = iceCell.col + colDiff
    
    const nextCell = this.levelMap.getCellAt(nextRow, nextCol)
    
    if (nextCell && nextCell.obstacleType !== 'rock' && !this.selectedPath.includes(nextCell)) {
      this.addCellToPath(nextCell)
    }
  }

  handlePortalTeleport(portalCell) {
    const obs = this.levelMap.getObstacleAt(portalCell.row, portalCell.col)
    if (!obs || obs.targetRow === undefined || obs.targetCol === undefined) return
    
    const targetCell = this.levelMap.getCellAt(obs.targetRow, obs.targetCol)
    if (targetCell && targetCell.obstacleType !== 'rock' && !this.selectedPath.includes(targetCell)) {
      this.addCellToPath(targetCell)
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
          this.onPathComplete(this.selectedPath, this.matchedBranchId)
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
    const correctPaths = level.correctPaths || [{ path: level.correctPath }]
    
    if (this.selectedPath.length < 2) return false
    
    const firstCell = this.selectedPath[0]
    const lastCell = this.selectedPath[this.selectedPath.length - 1]
    
    if (!firstCell.isStart || !lastCell.isEnd) return false
    
    for (let i = 0; i < this.selectedPath.length; i++) {
      const cell = this.selectedPath[i]
      
      if (cell.obstacleType === 'rock') return false
      
      if (i > 0) {
        const prevCell = this.selectedPath[i - 1]
        const isPortalJump = this.isPortalJump(prevCell, cell)
        if (!this.levelMap.areAdjacent(prevCell, cell) && !isPortalJump) {
          return false
        }
      }
    }
    
    this.matchedBranchId = null
    let matchedPathInfo = null
    
    for (const pathInfo of correctPaths) {
      const targetPath = Array.isArray(pathInfo) ? pathInfo : pathInfo.path
      const pathId = Array.isArray(pathInfo) ? null : pathInfo.id
      
      if (this.isPathMatching(targetPath)) {
        const requiredPlants = targetPath.filter(p => {
          const cell = this.levelMap.getCellAt(p.row, p.col)
          return cell && cell.plant && !cell.plant.hidden
        })
        
        const litRequiredPlants = requiredPlants.filter(p => {
          const cell = this.levelMap.getCellAt(p.row, p.col)
          return cell && cell.isLit
        })
        
        if (requiredPlants.length === 0 || 
            litRequiredPlants.length >= Math.ceil(requiredPlants.length * 0.5)) {
          this.matchedBranchId = pathId
          matchedPathInfo = pathInfo
          break
        }
      }
    }
    
    return matchedPathInfo !== null
  }
  
  isPathMatching(targetPath) {
    if (this.selectedPath.length !== targetPath.length) return false
    
    for (let i = 0; i < this.selectedPath.length; i++) {
      const cell = this.selectedPath[i]
      const target = targetPath[i]
      if (cell.row !== target.row || cell.col !== target.col) {
        return false
      }
    }
    
    return true
  }

  isPortalJump(fromCell, toCell) {
    if (fromCell.obstacleType !== 'portal') return false
    const obs = this.levelMap.getObstacleAt(fromCell.row, fromCell.col)
    if (!obs || obs.targetRow === undefined || obs.targetCol === undefined) return false
    return obs.targetRow === toCell.row && obs.targetCol === toCell.col
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
    this.historyStack = []
    this.redoStack = []
    
    if (this.pathGraphics) {
      this.pathGraphics.clear()
    }
    
    this.plantState.resetAll()
    
    if (this.scene.resetCombo) {
      this.scene.resetCombo()
    }
    
    if (this.onHistoryChange) {
      this.onHistoryChange(this.canUndo(), this.canRedo())
    }
  }

  getPathLength() {
    return this.selectedPath.length
  }

  getSelectedPath() {
    return [...this.selectedPath]
  }

  showHint() {
    const level = this.levelMap.currentLevel
    const correctPaths = level.correctPaths || [{ path: level.correctPath }]
    
    const randomPathInfo = correctPaths[Math.floor(Math.random() * correctPaths.length)]
    const correctPath = Array.isArray(randomPathInfo) ? randomPathInfo : randomPathInfo.path
    
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
  
  getMatchedBranchId() {
    return this.matchedBranchId
  }
  
  getAvailableBranches() {
    const level = this.levelMap.currentLevel
    const correctPaths = level.correctPaths || []
    return correctPaths.map(p => Array.isArray(p) ? null : { id: p.id, name: p.name }).filter(Boolean)
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
