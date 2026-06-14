import { LEVELS } from '../data/levels.js'
import { LevelGenerator } from './LevelGenerator.js'
import { ThemeManager } from './ThemeManager.js'

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
    
    this.themeManager = ThemeManager.getInstance()
    this.theme = { ...DEFAULT_THEME, ...(themeColors || {}) }
    
    this.renderedElements = {
      bg: null,
      cells: [],
      obstacles: [],
      startMarker: null,
      startText: null,
      endMarker: null,
      endText: null,
      obstacleParticles: []
    }
    
    this.themeUnsubscribe = this.themeManager.onThemeChange((theme) => {
      this.applyTheme(theme)
    })
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

  loadRandomLevel(difficulty = 3, seed = null) {
    const generator = new LevelGenerator(difficulty, seed)
    this.currentLevel = generator.generate()
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
    this.updateThemeColors()
    this.renderBackground()
    this.renderGrid()
    this.renderObstacles()
    this.renderStartEnd()
  }

  updateThemeColors() {
    const gridTheme = this.themeManager.getGridColors()
    this.theme = {
      gridBg: gridTheme.bg,
      gridBgStroke: gridTheme.bgStroke,
      gridCell: gridTheme.cell,
      gridCellStroke: gridTheme.cellStroke,
      obstacleFill: gridTheme.obstacleFill,
      obstacleStroke: gridTheme.obstacleStroke,
      obstacleSpark: gridTheme.obstacleSpark,
      startFill: gridTheme.startFill,
      startStroke: gridTheme.startStroke,
      endFill: gridTheme.endFill,
      endStroke: gridTheme.endStroke
    }
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
    
    this.renderedElements.bg = bg
  }

  renderGrid() {
    const { rows, cols } = this.currentLevel.gridSize
    this.renderedElements.cells = []
    
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
        cellBg.setInteractive(new Phaser.Geom.Rectangle(-(this.cellSize - 4) / 2, -(this.cellSize - 4) / 2, this.cellSize - 4, this.cellSize - 4), Phaser.Geom.Rectangle.Contains)
        if (cellBg.input) cellBg.input.cursor = 'pointer'
        
        cell.sprite = cellBg
        this.renderedElements.cells.push(cellBg)
      }
    }
  }

  renderObstacles() {
    const { obstacles } = this.currentLevel
    const gridTheme = this.themeManager.getGridColors()
    const obstacleStyle = gridTheme.obstacleStyle || 'rock'
    const cellPattern = gridTheme.cellPattern || 'none'
    
    this.renderedElements.obstacles = []
    this.renderedElements.obstacleParticles = []
    this.renderedElements.cellDecorations = []
    
    obstacles.forEach(obs => {
      const x = this.offsetX + obs.col * this.cellSize + this.cellSize / 2
      const y = this.offsetY + obs.row * this.cellSize + this.cellSize / 2
      
      let obstacleContainer
      switch (obstacleStyle) {
        case 'ice_pillar':
          obstacleContainer = this.createIcePillarObstacle(x, y)
          break
        case 'lava_rock':
          obstacleContainer = this.createLavaRockObstacle(x, y)
          break
        case 'crystal_cluster':
          obstacleContainer = this.createCrystalClusterObstacle(x, y)
          break
        case 'rock':
        default:
          obstacleContainer = this.createRockObstacle(x, y)
      }
      
      this.scene.tweens.add({
        targets: obstacleContainer,
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
      
      this.renderedElements.obstacles.push(obstacleContainer)
      this.renderedElements.obstacleParticles.push(sparkles)
    })
    
    if (cellPattern !== 'none') {
      const { rows, cols } = this.currentLevel.gridSize
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = this.gridCells[row][col]
          if (cell.isObstacle) continue
          
          const x = this.offsetX + col * this.cellSize + this.cellSize / 2
          const y = this.offsetY + row * this.cellSize + this.cellSize / 2
          
          let decoration
          switch (cellPattern) {
            case 'frost':
              decoration = this.createFrostDecoration(x, y)
              break
            case 'crack':
              decoration = this.createCrackDecoration(x, y)
              break
            case 'prism':
              decoration = this.createPrismDecoration(x, y)
              break
          }
          if (decoration) {
            this.renderedElements.cellDecorations.push(decoration)
          }
        }
      }
    }
  }

  createRockObstacle(x, y) {
    const container = this.scene.add.container(x, y)
    const size = this.cellSize * 0.35
    
    const rock = this.scene.add.circle(0, 0, size, this.theme.obstacleFill, 0.9)
    rock.setStrokeStyle(2, this.theme.obstacleStroke, 1)
    container.add(rock)
    
    const highlight = this.scene.add.circle(-size * 0.3, -size * 0.3, size * 0.3, 0xffffff, 0.15)
    container.add(highlight)
    
    const shadow = this.scene.add.circle(size * 0.25, size * 0.25, size * 0.4, 0x000000, 0.2)
    container.add(shadow)
    
    return container
  }

  createIcePillarObstacle(x, y) {
    const container = this.scene.add.container(x, y)
    const size = this.cellSize * 0.38
    
    const base = this.scene.add.ellipse(0, size * 0.6, size * 1.1, size * 0.4, this.theme.obstacleStroke, 0.8)
    container.add(base)
    
    const pillar = this.scene.add.graphics()
    pillar.fillStyle(this.theme.obstacleFill, 0.92)
    pillar.lineStyle(2, this.theme.obstacleStroke, 0.95)
    pillar.beginPath()
    pillar.moveTo(-size * 0.6, size * 0.5)
    pillar.lineTo(-size * 0.45, -size * 0.7)
    pillar.lineTo(-size * 0.2, -size * 0.95)
    pillar.lineTo(0, -size * 1.1)
    pillar.lineTo(size * 0.2, -size * 0.95)
    pillar.lineTo(size * 0.45, -size * 0.7)
    pillar.lineTo(size * 0.6, size * 0.5)
    pillar.closePath()
    pillar.fillPath()
    pillar.strokePath()
    
    pillar.fillStyle(0xe0f2fe, 0.55)
    pillar.beginPath()
    pillar.moveTo(-size * 0.2, -size * 0.85)
    pillar.lineTo(-size * 0.05, -size * 0.2)
    pillar.lineTo(-size * 0.3, size * 0.2)
    pillar.lineTo(-size * 0.4, -size * 0.3)
    pillar.closePath()
    pillar.fillPath()
    container.add(pillar)
    
    const iceShards = 3
    for (let i = 0; i < iceShards; i++) {
      const angle = (i / iceShards) * Math.PI * 2 - Math.PI / 2
      const shardX = Math.cos(angle) * size * 0.4
      const shardY = Math.sin(angle) * size * 0.25 - size * 0.2
      const shardSize = size * (0.25 + Math.random() * 0.15)
      
      const shard = this.scene.add.graphics()
      shard.fillStyle(i % 2 === 0 ? this.theme.obstacleSpark : 0xffffff, 0.85)
      shard.lineStyle(1, 0xbae6fd, 0.7)
      shard.translateCanvas(shardX, shardY)
      shard.rotate(angle + Math.random() * 0.4 - 0.2)
      shard.beginPath()
      shard.moveTo(0, -shardSize)
      shard.lineTo(shardSize * 0.35, 0)
      shard.lineTo(0, shardSize * 0.5)
      shard.lineTo(-shardSize * 0.35, 0)
      shard.closePath()
      shard.fillPath()
      shard.strokePath()
      container.add(shard)
    }
    
    return container
  }

  createLavaRockObstacle(x, y) {
    const container = this.scene.add.container(x, y)
    const size = this.cellSize * 0.36
    
    const rock = this.scene.add.graphics()
    rock.fillStyle(this.theme.obstacleFill, 0.95)
    rock.lineStyle(2.5, this.theme.obstacleStroke, 1)
    
    const irregular = []
    const points = 10
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = size * (0.85 + Math.sin(i * 2.7) * 0.18)
      irregular.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      })
    }
    rock.beginPath()
    irregular.forEach((p, i) => {
      if (i === 0) rock.moveTo(p.x, p.y)
      else rock.quadraticCurveTo(p.x * 0.95, p.y * 0.95, p.x, p.y)
    })
    rock.closePath()
    rock.fillPath()
    rock.strokePath()
    
    rock.lineStyle(2, this.theme.obstacleSpark, 0.85)
    const crack1 = [
      { x: -size * 0.2, y: -size * 0.3 },
      { x: size * 0.05, y: -size * 0.05 },
      { x: -size * 0.1, y: size * 0.2 },
      { x: size * 0.15, y: size * 0.45 }
    ]
    rock.beginPath()
    crack1.forEach((p, i) => {
      if (i === 0) rock.moveTo(p.x, p.y)
      else rock.lineTo(p.x, p.y)
    })
    rock.strokePath()
    
    const crack2 = [
      { x: size * 0.3, y: -size * 0.1 },
      { x: size * 0.1, y: size * 0.05 },
      { x: size * 0.4, y: size * 0.2 }
    ]
    rock.beginPath()
    crack2.forEach((p, i) => {
      if (i === 0) rock.moveTo(p.x, p.y)
      else rock.lineTo(p.x, p.y)
    })
    rock.strokePath()
    
    rock.fillStyle(this.theme.obstacleSpark, 0.9)
    rock.beginPath()
    rock.arc(-size * 0.05, -size * 0.05, 2.5, 0, Math.PI * 2)
    rock.arc(size * 0.1, size * 0.05, 2, 0, Math.PI * 2)
    rock.fill()
    container.add(rock)
    
    const ventCount = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < ventCount; i++) {
      const vx = -size * 0.2 + i * size * 0.3 + (Math.random() - 0.5) * size * 0.1
      const vy = -size * 0.1 + (Math.random() - 0.5) * size * 0.2
      
      const vent = this.scene.add.circle(vx, vy, 2 + Math.random() * 1.5, 0xfbbf24, 0.95)
      container.add(vent)
      
      this.scene.tweens.add({
        targets: vent,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 0.9, to: 1.15 },
        duration: 900 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 800
      })
    }
    
    return container
  }

  createCrystalClusterObstacle(x, y) {
    const container = this.scene.add.container(x, y)
    const size = this.cellSize * 0.38
    
    const base = this.scene.add.ellipse(0, size * 0.55, size * 1.2, size * 0.35, this.theme.obstacleFill, 0.75)
    base.setStrokeStyle(1.5, this.theme.obstacleStroke, 0.8)
    container.add(base)
    
    const crystalColors = [this.theme.obstacleFill, this.theme.obstacleStroke, this.theme.obstacleSpark, 0xf0abfc, 0xc4b5fd]
    const crystalCount = 5 + Math.floor(Math.random() * 2)
    
    for (let i = 0; i < crystalCount; i++) {
      const angle = (i / crystalCount) * Math.PI - Math.PI / 2
      const offsetX = Math.cos(angle) * size * (0.3 + Math.random() * 0.2)
      const offsetY = Math.sin(angle) * size * 0.25 - size * 0.1
      const crystalHeight = size * (0.7 + Math.random() * 0.6)
      const crystalWidth = size * (0.16 + Math.random() * 0.12)
      const rotation = angle + (Math.random() - 0.5) * 0.4
      const colorIdx = i % crystalColors.length
      
      const crystal = this.scene.add.graphics()
      crystal.fillStyle(crystalColors[colorIdx], 0.92)
      crystal.lineStyle(1.5, crystalColors[(colorIdx + 2) % crystalColors.length], 0.85)
      crystal.translateCanvas(offsetX, offsetY)
      crystal.rotate(rotation)
      
      crystal.beginPath()
      crystal.moveTo(0, -crystalHeight)
      crystal.lineTo(crystalWidth, -crystalHeight * 0.25)
      crystal.lineTo(crystalWidth * 0.7, crystalHeight * 0.35)
      crystal.lineTo(0, crystalHeight * 0.45)
      crystal.lineTo(-crystalWidth * 0.7, crystalHeight * 0.35)
      crystal.lineTo(-crystalWidth, -crystalHeight * 0.25)
      crystal.closePath()
      crystal.fillPath()
      crystal.strokePath()
      
      crystal.fillStyle(0xffffff, 0.55)
      crystal.beginPath()
      crystal.moveTo(-crystalWidth * 0.25, -crystalHeight * 0.85)
      crystal.lineTo(crystalWidth * 0.1, -crystalHeight * 0.45)
      crystal.lineTo(0, -crystalHeight * 0.1)
      crystal.lineTo(-crystalWidth * 0.5, -crystalHeight * 0.35)
      crystal.closePath()
      crystal.fillPath()
      container.add(crystal)
    }
    
    const dust = this.scene.add.particles(x, y - size * 0.3, 'sparkle', {
      speed: { min: 5, max: 15 },
      angle: { min: -110, max: -70 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 1500,
      frequency: 1200,
      tint: [this.theme.obstacleSpark, 0xf0abfc, 0xffffff],
      quantity: 2
    })
    dust.setDepth(container.depth + 1)
    container.dustEmitter = dust
    
    return container
  }

  createFrostDecoration(x, y) {
    const size = this.cellSize * 0.18
    if (Math.random() > 0.5) return null
    
    const decor = this.scene.add.graphics()
    decor.lineStyle(1, 0x93c5fd, 0.35)
    
    const corners = [
      { cx: -this.cellSize * 0.4, cy: -this.cellSize * 0.4 },
      { cx: this.cellSize * 0.4, cy: -this.cellSize * 0.4 },
      { cx: -this.cellSize * 0.4, cy: this.cellSize * 0.4 },
      { cx: this.cellSize * 0.4, cy: this.cellSize * 0.4 }
    ]
    
    const selected = Math.floor(Math.random() * corners.length)
    const corner = corners[selected]
    decor.translateCanvas(x + corner.cx, y + corner.cy)
    
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI / 2 + (selected % 2 === 0 ? 0 : Math.PI / 4)
      decor.beginPath()
      decor.moveTo(0, 0)
      decor.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
      decor.strokePath()
      
      const midX = Math.cos(angle) * size * 0.5
      const midY = Math.sin(angle) * size * 0.5
      decor.lineBetween(midX, midY, midX + Math.cos(angle + 0.5) * size * 0.3, midY + Math.sin(angle + 0.5) * size * 0.3)
      decor.lineBetween(midX, midY, midX + Math.cos(angle - 0.5) * size * 0.3, midY + Math.sin(angle - 0.5) * size * 0.3)
    }
    
    return decor
  }

  createCrackDecoration(x, y) {
    if (Math.random() > 0.45) return null
    
    const size = this.cellSize * 0.3
    const decor = this.scene.add.graphics()
    decor.lineStyle(1.5, 0xef4444, 0.25)
    
    decor.translateCanvas(x + (Math.random() - 0.5) * this.cellSize * 0.3, y + (Math.random() - 0.5) * this.cellSize * 0.3)
    
    const startAngle = Math.random() * Math.PI * 2
    const segments = 2 + Math.floor(Math.random() * 2)
    
    let px = 0, py = 0
    decor.beginPath()
    decor.moveTo(px, py)
    
    for (let i = 0; i < segments; i++) {
      const angle = startAngle + (Math.random() - 0.5) * 1.2
      const len = size * (0.4 + Math.random() * 0.6)
      px += Math.cos(angle) * len
      py += Math.sin(angle) * len
      decor.lineTo(px, py)
      
      if (Math.random() > 0.5 && i < segments - 1) {
        const branchAngle = angle + (Math.random() > 0.5 ? 0.8 : -0.8)
        const branchLen = size * (0.2 + Math.random() * 0.3)
        decor.moveTo(px, py)
        decor.lineTo(px + Math.cos(branchAngle) * branchLen, py + Math.sin(branchAngle) * branchLen)
      }
    }
    decor.strokePath()
    
    return decor
  }

  createPrismDecoration(x, y) {
    if (Math.random() > 0.55) return null
    
    const size = this.cellSize * 0.1
    const decor = this.scene.add.graphics()
    decor.fillStyle(0xc4b5fd, 0.22)
    decor.lineStyle(1, 0xa78bfa, 0.35)
    
    const offsetX = (Math.random() - 0.5) * this.cellSize * 0.5
    const offsetY = (Math.random() - 0.5) * this.cellSize * 0.5
    const rotation = Math.random() * Math.PI
    
    decor.translateCanvas(x + offsetX, y + offsetY)
    decor.rotate(rotation)
    
    decor.beginPath()
    decor.moveTo(0, -size)
    decor.lineTo(size * 0.87, size * 0.5)
    decor.lineTo(-size * 0.87, size * 0.5)
    decor.closePath()
    decor.fillPath()
    decor.strokePath()
    
    return decor
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
    
    this.renderedElements.startMarker = startMarker
    this.renderedElements.startText = startText
    
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
    
    this.renderedElements.endMarker = endMarker
    this.renderedElements.endText = endText
  }

  applyTheme(theme) {
    const gridTheme = theme.grid
    this.theme = {
      gridBg: gridTheme.bg,
      gridBgStroke: gridTheme.bgStroke,
      gridCell: gridTheme.cell,
      gridCellStroke: gridTheme.cellStroke,
      obstacleFill: gridTheme.obstacleFill,
      obstacleStroke: gridTheme.obstacleStroke,
      obstacleSpark: gridTheme.obstacleSpark,
      startFill: gridTheme.startFill,
      startStroke: gridTheme.startStroke,
      endFill: gridTheme.endFill,
      endStroke: gridTheme.endStroke
    }
    
    if (this.renderedElements.bg) {
      this.renderedElements.bg.setFillStyle(this.theme.gridBg, 0.8)
      this.renderedElements.bg.setStrokeStyle(2, this.theme.gridBgStroke, 1)
    }
    
    this.renderedElements.cells.forEach(cellBg => {
      const cell = cellBg.getData('cell')
      if (!cell.isOnPath) {
        cellBg.setFillStyle(this.theme.gridCell, 0.6)
      }
      cellBg.setStrokeStyle(1, this.theme.gridCellStroke, 0.5)
    })
    
    this.renderedElements.cellDecorations.forEach(decor => {
      if (decor && decor.destroy) decor.destroy()
    })
    this.renderedElements.cellDecorations = []
    
    this.renderedElements.obstacles.forEach(obs => {
      if (obs.dustEmitter) obs.dustEmitter.destroy()
      if (obs.destroy) obs.destroy()
    })
    this.renderedElements.obstacles = []
    
    this.renderedElements.obstacleParticles.forEach(ps => {
      if (ps.destroy) ps.destroy()
    })
    this.renderedElements.obstacleParticles = []
    
    this.renderObstacles()
    
    if (this.renderedElements.startMarker) {
      this.renderedElements.startMarker.setFillStyle(this.theme.startFill, 0.8)
      this.renderedElements.startMarker.setStrokeStyle(3, this.theme.startStroke, 1)
    }
    
    if (this.renderedElements.endMarker) {
      this.renderedElements.endMarker.setFillStyle(this.theme.endFill, 0.8)
      this.renderedElements.endMarker.setStrokeStyle(3, this.theme.endStroke, 1)
    }
    
    this.playThemeTransitionEffect()
  }

  playThemeTransitionEffect() {
    const { rows, cols } = this.currentLevel.gridSize
    const centerX = this.offsetX + (cols * this.cellSize) / 2
    const centerY = this.offsetY + (rows * this.cellSize) / 2
    
    const particles = this.scene.add.particles(centerX, centerY, 'sparkle', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 800 },
      tint: [this.theme.endFill, this.theme.startFill, this.theme.gridBgStroke],
      quantity: 40,
      duration: 600,
      blendMode: 'ADD'
    })
    
    this.scene.tweens.add({
      targets: [this.renderedElements.startMarker, this.renderedElements.endMarker],
      scale: { from: 1.5, to: 1 },
      alpha: { from: 1, to: 0.8 },
      duration: 500,
      ease: 'Back.out'
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

  destroy() {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe()
    }
  }
}
