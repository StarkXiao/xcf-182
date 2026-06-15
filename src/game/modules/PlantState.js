import { PLANT_TYPES } from '../data/levels.js'
import { ThemeManager } from './ThemeManager.js'
import { AudioManager } from './AudioManager.js'

export class PlantState {
  constructor(scene, levelMap) {
    this.scene = scene
    this.levelMap = levelMap
    this.plants = []
    this.litPlants = new Set()
    this.breathingTweens = []
    this.pulseTweens = []
    this.currentCombo = 0
    
    this.themeManager = ThemeManager.getInstance()
    this.audioManager = AudioManager.getInstance()
    this.audioManager.init()
    
    this.themeUnsubscribe = this.themeManager.onThemeChange((theme) => {
      this.applyTheme(theme)
    })
  }

  init() {
    this.plants = []
    this.litPlants.clear()
    this.breathingTweens.forEach(tween => tween.stop())
    this.breathingTweens = []
    
    const { rows, cols } = this.levelMap.currentLevel.gridSize
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.levelMap.gridCells[row][col]
        if (cell.plant) {
          this.createPlant(cell)
        }
      }
    }
  }

  getPlantColors(type) {
    const themeColors = this.themeManager.getPlantColors(type)
    const baseType = PLANT_TYPES[type]
    return {
      ...baseType,
      color: themeColors.color,
      glowColor: themeColors.glowColor,
      shape: themeColors.shape
    }
  }

  createPlant(cell) {
    const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
    const plantType = this.getPlantColors(cell.plant.type)
    const plant = this.createPlantSprite(pos.x, pos.y, cell.plant.type, plantType)
    
    plant.setData('cell', cell)
    plant.setData('type', cell.plant.type)
    plant.setData('plantType', plantType)
    plant.setData('isLit', false)
    
    const plantSize = plantType.size * 2.5
    plant.setInteractive(new Phaser.Geom.Rectangle(-plantSize / 2, -plantSize / 2, plantSize, plantSize), Phaser.Geom.Rectangle.Contains)
    if (plant.input) plant.input.cursor = 'pointer'
    
    this.startBreathing(plant, plantType)
    
    cell.plantSprite = plant
    this.plants.push(plant)
  }

  createPlantSprite(x, y, type, plantType) {
    const container = this.scene.add.container(x, y)
    const themeId = this.themeManager.getThemeId()
    
    const glow = this.scene.add.circle(0, 0, plantType.size * 0.9, plantType.glowColor, 0.2)
    container.add(glow)
    
    let sprite
    switch (type) {
      case 'moss':
        sprite = this.createMossSprite(plantType, themeId)
        break
      case 'mushroom':
        sprite = this.createMushroomSprite(plantType, themeId)
        break
      case 'flower':
        sprite = this.createFlowerSprite(plantType, themeId)
        break
      default:
        sprite = this.createMossSprite(plantType, themeId)
    }
    container.add(sprite)
    
    container.glow = glow
    container.plantSprite = sprite
    container.type = type
    container.themeId = themeId
    
    return container
  }

  createMossSprite(plantType, themeId) {
    const moss = this.scene.add.graphics()
    const color = plantType.color
    
    switch (themeId) {
      case 'ice':
        return this.createIceCrystalMoss(moss, color)
      case 'lava':
        return this.createFireFernMoss(moss, color)
      case 'crystal':
        return this.createAmethystClusterMoss(moss, color)
      default:
        return this.createMossBlob(moss, color)
    }
  }

  createMossBlob(moss, color) {
    moss.fillStyle(color, 0.85)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const radius = 7 + Math.random() * 3
      const x = Math.cos(angle) * radius * 0.6
      const y = Math.sin(angle) * radius * 0.4
      moss.beginPath()
      moss.arc(x, y, 5 + Math.random() * 2, 0, Math.PI * 2)
      moss.fill()
    }
    moss.beginPath()
    moss.arc(0, 3, 9, 0, Math.PI * 2)
    moss.fill()
    return moss
  }

  createIceCrystalMoss(moss, color) {
    moss.fillStyle(color, 0.9)
    moss.lineStyle(1, 0xffffff, 0.6)
    
    const crystals = 5
    for (let i = 0; i < crystals; i++) {
      const angle = (i / crystals) * Math.PI * 2
      const x = Math.cos(angle) * 8
      const y = Math.sin(angle) * 5
      
      moss.save()
      moss.translateCanvas(x, y)
      moss.rotate(angle + Math.PI / 2)
      
      moss.beginPath()
      moss.moveTo(0, -10)
      moss.lineTo(3, -3)
      moss.lineTo(2, 5)
      moss.lineTo(-2, 5)
      moss.lineTo(-3, -3)
      moss.closePath()
      moss.fillPath()
      moss.strokePath()
      
      moss.restore()
    }
    
    moss.fillStyle(0xe0f2fe, 0.95)
    moss.beginPath()
    moss.moveTo(0, -14)
    moss.lineTo(4, -4)
    moss.lineTo(3, 6)
    moss.lineTo(-3, 6)
    moss.lineTo(-4, -4)
    moss.closePath()
    moss.fillPath()
    moss.strokePath()
    
    return moss
  }

  createFireFernMoss(moss, color) {
    moss.fillStyle(color, 0.9)
    
    const leaves = 7
    for (let i = 0; i < leaves; i++) {
      const angle = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.35
      const leafLen = 10 + Math.random() * 4
      
      moss.save()
      moss.translateCanvas(0, 5)
      moss.rotate(angle)
      
      moss.beginPath()
      moss.moveTo(0, 0)
      moss.quadraticCurveTo(leafLen * 0.5, -5, leafLen, 0)
      moss.quadraticCurveTo(leafLen * 0.5, 3, 0, 0)
      moss.fillPath()
      
      moss.restore()
    }
    
    moss.fillStyle(0xfde68a, 0.95)
    moss.beginPath()
    moss.moveTo(0, -6)
    moss.quadraticCurveTo(5, -2, 6, 4)
    moss.quadraticCurveTo(0, 7, -6, 4)
    moss.quadraticCurveTo(-5, -2, 0, -6)
    moss.fillPath()
    
    return moss
  }

  createAmethystClusterMoss(moss, color) {
    moss.lineStyle(1, 0xf0abfc, 0.7)
    
    const gems = 6
    for (let i = 0; i < gems; i++) {
      const angle = (i / gems) * Math.PI * 2
      const dist = 6 + Math.random() * 3
      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist * 0.7
      const h = 8 + Math.random() * 5
      const w = 4 + Math.random() * 2
      
      const gemColor = i % 2 === 0 ? color : 0xc4b5fd
      moss.fillStyle(gemColor, 0.9)
      
      moss.save()
      moss.translateCanvas(x, y)
      moss.rotate(angle + Math.random() * 0.3 - 0.15)
      
      moss.beginPath()
      moss.moveTo(0, -h)
      moss.lineTo(w, -h * 0.3)
      moss.lineTo(w * 0.6, h * 0.4)
      moss.lineTo(-w * 0.6, h * 0.4)
      moss.lineTo(-w, -h * 0.3)
      moss.closePath()
      moss.fillPath()
      moss.strokePath()
      
      moss.fillStyle(0xffffff, 0.5)
      moss.beginPath()
      moss.moveTo(-w * 0.3, -h * 0.8)
      moss.lineTo(w * 0.1, -h * 0.5)
      moss.lineTo(0, -h * 0.2)
      moss.lineTo(-w * 0.2, -h * 0.4)
      moss.closePath()
      moss.fillPath()
      
      moss.restore()
    }
    
    return moss
  }

  createMushroomSprite(plantType, themeId) {
    const mushroom = this.scene.add.graphics()
    const color = plantType.color
    
    switch (themeId) {
      case 'ice':
        return this.createFrostCapMushroom(mushroom, color)
      case 'lava':
        return this.createFlameCapMushroom(mushroom, color)
      case 'crystal':
        return this.createCrystalCapMushroom(mushroom, color)
      default:
        return this.createCapMushroom(mushroom, color)
    }
  }

  createCapMushroom(mushroom, color) {
    mushroom.fillStyle(0xf5f5f4, 0.9)
    mushroom.fillRect(-4, 0, 8, 12)
    
    mushroom.fillStyle(color, 0.9)
    mushroom.beginPath()
    mushroom.arc(0, -2, 14, Math.PI, 0)
    mushroom.fill()
    
    mushroom.fillStyle(0xffffff, 0.7)
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI + (i / 5) * Math.PI
      const x = Math.cos(angle) * 8
      const y = Math.sin(angle) * 5 - 2
      mushroom.beginPath()
      mushroom.arc(x, y, 2, 0, Math.PI * 2)
      mushroom.fill()
    }
    
    return mushroom
  }

  createFrostCapMushroom(mushroom, color) {
    mushroom.fillStyle(0xe0f2fe, 0.9)
    mushroom.lineStyle(1, 0x7dd3fc, 0.6)
    mushroom.fillRect(-5, 0, 10, 14)
    mushroom.strokeRect(-5, 0, 10, 14)
    
    mushroom.fillStyle(color, 0.9)
    mushroom.beginPath()
    mushroom.moveTo(-18, 2)
    mushroom.quadraticCurveTo(-16, -18, 0, -16)
    mushroom.quadraticCurveTo(16, -18, 18, 2)
    mushroom.quadraticCurveTo(10, 6, 0, 4)
    mushroom.quadraticCurveTo(-10, 6, -18, 2)
    mushroom.fillPath()
    
    mushroom.lineStyle(1, 0xbae6fd, 0.7)
    mushroom.strokePath()
    
    mushroom.fillStyle(0xffffff, 0.85)
    for (let i = 0; i < 6; i++) {
      const x = -12 + i * 5
      const y = -6 - Math.abs(i - 2.5) * 2
      mushroom.beginPath()
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2
        const r = j % 2 === 0 ? 3 : 1.5
        const px = x + Math.cos(a) * r
        const py = y + Math.sin(a) * r
        if (j === 0) mushroom.moveTo(px, py)
        else mushroom.lineTo(px, py)
      }
      mushroom.closePath()
      mushroom.fillPath()
    }
    
    mushroom.fillStyle(0x93c5fd, 0.8)
    mushroom.beginPath()
    mushroom.arc(-6, 8, 2, 0, Math.PI * 2)
    mushroom.arc(5, 10, 1.5, 0, Math.PI * 2)
    mushroom.fill()
    
    return mushroom
  }

  createFlameCapMushroom(mushroom, color) {
    mushroom.fillStyle(0x78350f, 0.9)
    mushroom.lineStyle(1, 0x92400e, 0.8)
    mushroom.fillRect(-5, 0, 10, 13)
    
    mushroom.fillStyle(color, 0.95)
    mushroom.beginPath()
    const flamePoints = [
      { x: -18, y: 3 }, { x: -14, y: -10 }, { x: -8, y: -4 },
      { x: -5, y: -16 }, { x: 0, y: -8 }, { x: 5, y: -18 },
      { x: 10, y: -6 }, { x: 15, y: -12 }, { x: 18, y: 3 }
    ]
    flamePoints.forEach((p, i) => {
      if (i === 0) mushroom.moveTo(p.x, p.y)
      else mushroom.quadraticCurveTo(p.x - 2, p.y - 5, p.x, p.y)
    })
    mushroom.quadraticCurveTo(10, 8, 0, 5)
    mushroom.quadraticCurveTo(-10, 8, -18, 3)
    mushroom.fillPath()
    
    mushroom.fillStyle(0xfbbf24, 0.9)
    mushroom.beginPath()
    mushroom.moveTo(-10, -2)
    mushroom.quadraticCurveTo(-7, -10, -2, -5)
    mushroom.quadraticCurveTo(2, -12, 6, -4)
    mushroom.quadraticCurveTo(10, -10, 12, -2)
    mushroom.quadraticCurveTo(5, 2, 0, 0)
    mushroom.quadraticCurveTo(-5, 2, -10, -2)
    mushroom.fillPath()
    
    mushroom.fillStyle(0xfef3c7, 0.95)
    mushroom.beginPath()
    mushroom.arc(-3, -6, 2.5, 0, Math.PI * 2)
    mushroom.arc(4, -4, 2, 0, Math.PI * 2)
    mushroom.fill()
    
    return mushroom
  }

  createCrystalCapMushroom(mushroom, color) {
    mushroom.fillStyle(0x4c1d95, 0.85)
    mushroom.lineStyle(1, 0x8b5cf6, 0.7)
    mushroom.fillRect(-5, 0, 10, 13)
    
    mushroom.fillStyle(color, 0.9)
    mushroom.lineStyle(1.5, 0xf0abfc, 0.8)
    mushroom.beginPath()
    mushroom.moveTo(-20, 4)
    mushroom.lineTo(-15, -8)
    mushroom.lineTo(-8, -14)
    mushroom.lineTo(0, -18)
    mushroom.lineTo(8, -14)
    mushroom.lineTo(15, -8)
    mushroom.lineTo(20, 4)
    mushroom.lineTo(12, 7)
    mushroom.lineTo(0, 5)
    mushroom.lineTo(-12, 7)
    mushroom.closePath()
    mushroom.fillPath()
    mushroom.strokePath()
    
    mushroom.fillStyle(0xffffff, 0.5)
    mushroom.beginPath()
    mushroom.moveTo(-12, -8)
    mushroom.lineTo(-5, -12)
    mushroom.lineTo(-2, -6)
    mushroom.lineTo(-8, -4)
    mushroom.closePath()
    mushroom.fillPath()
    
    mushroom.fillStyle(0xc4b5fd, 0.85)
    const gems = [[-10, -2, 3], [0, -10, 2.5], [10, -3, 2.5]]
    gems.forEach(g => {
      mushroom.beginPath()
      mushroom.moveTo(g[0], g[1] - g[2] * 1.5)
      mushroom.lineTo(g[0] + g[2], g[1])
      mushroom.lineTo(g[0], g[1] + g[2] * 0.8)
      mushroom.lineTo(g[0] - g[2], g[1])
      mushroom.closePath()
      mushroom.fillPath()
    })
    
    return mushroom
  }

  createFlowerSprite(plantType, themeId) {
    const flower = this.scene.add.graphics()
    const color = plantType.color
    
    switch (themeId) {
      case 'ice':
        return this.createSnowflakeFlower(flower, color)
      case 'lava':
        return this.createEmberBloomFlower(flower, color)
      case 'crystal':
        return this.createGemRoseFlower(flower, color)
      default:
        return this.createRoundPetalFlower(flower, color)
    }
  }

  createRoundPetalFlower(flower, color) {
    flower.fillStyle(0x22c55e, 0.8)
    flower.fillRect(-2, 5, 4, 10)
    
    flower.fillStyle(color, 0.9)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const x = Math.cos(angle) * 8
      const y = Math.sin(angle) * 8 - 2
      flower.fillCircle(x, y, 6)
    }
    
    flower.fillStyle(0xfbbf24, 1)
    flower.fillCircle(0, -2, 5)
    
    return flower
  }

  createSnowflakeFlower(flower, color) {
    flower.fillStyle(0x0e7490, 0.9)
    flower.lineStyle(1, 0x22d3ee, 0.7)
    flower.fillRect(-2, 5, 4, 12)
    
    const arms = 6
    flower.lineStyle(2.5, color, 0.95)
    for (let i = 0; i < arms; i++) {
      const angle = (i / arms) * Math.PI * 2 - Math.PI / 2
      
      flower.save()
      flower.translateCanvas(0, -2)
      flower.rotate(angle)
      
      flower.beginPath()
      flower.moveTo(0, 0)
      flower.lineTo(0, -14)
      flower.strokePath()
      
      flower.lineStyle(2, color, 0.85)
      for (let j = 1; j <= 2; j++) {
        const y = -j * 5
        flower.beginPath()
        flower.moveTo(0, y)
        flower.lineTo(-4, y - 3)
        flower.moveTo(0, y)
        flower.lineTo(4, y - 3)
        flower.strokePath()
      }
      
      flower.fillStyle(color, 0.9)
      flower.beginPath()
      flower.arc(0, -14, 2.5, 0, Math.PI * 2)
      flower.fill()
      
      flower.restore()
    }
    
    flower.fillStyle(0xe0f2fe, 1)
    flower.beginPath()
    flower.arc(0, -2, 5, 0, Math.PI * 2)
    flower.fill()
    
    flower.lineStyle(1.5, 0xffffff, 0.9)
    flower.strokePath()
    
    return flower
  }

  createEmberBloomFlower(flower, color) {
    flower.fillStyle(0x92400e, 0.9)
    flower.lineStyle(1, 0x78350f, 0.8)
    flower.fillRect(-2, 5, 4, 11)
    
    const petals = 8
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 - Math.PI / 2
      const petalColor = i % 2 === 0 ? color : 0xfbbf24
      
      flower.save()
      flower.translateCanvas(0, -2)
      flower.rotate(angle)
      
      flower.fillStyle(petalColor, 0.9)
      flower.beginPath()
      flower.moveTo(0, 0)
      flower.quadraticCurveTo(-3, -7, 0, -12)
      flower.quadraticCurveTo(3, -7, 0, 0)
      flower.fillPath()
      
      flower.fillStyle(0xfef3c7, 0.8)
      flower.beginPath()
      flower.moveTo(0, -2)
      flower.quadraticCurveTo(-1, -6, 0, -9)
      flower.quadraticCurveTo(1, -6, 0, -2)
      flower.fillPath()
      
      flower.restore()
    }
    
    flower.fillStyle(0xfde68a, 1)
    flower.beginPath()
    flower.arc(0, -2, 6, 0, Math.PI * 2)
    flower.fill()
    
    flower.fillStyle(0xf97316, 0.95)
    flower.beginPath()
    flower.arc(-1.5, -3, 1.5, 0, Math.PI * 2)
    flower.arc(1.5, -1, 1.2, 0, Math.PI * 2)
    flower.arc(0, 1, 1, 0, Math.PI * 2)
    flower.fill()
    
    return flower
  }

  createGemRoseFlower(flower, color) {
    flower.fillStyle(0x7c3aed, 0.85)
    flower.lineStyle(1, 0x8b5cf6, 0.7)
    flower.fillRect(-2, 5, 4, 11)
    
    const layers = 3
    const petalsPerLayer = [6, 5, 4]
    
    for (let layer = 0; layer < layers; layer++) {
      const numPetals = petalsPerLayer[layer]
      const scale = 1 - layer * 0.2
      const baseColor = layer === 0 ? color : layer === 1 ? 0xf0abfc : 0xfce7f3
      const yOffset = layer * 1.5
      
      for (let i = 0; i < numPetals; i++) {
        const angle = (i / numPetals) * Math.PI * 2 + layer * 0.4
        
        flower.save()
        flower.translateCanvas(0, -2 + yOffset)
        flower.rotate(angle)
        flower.scaleCanvas(scale, scale)
        
        flower.fillStyle(baseColor, 0.92)
        flower.lineStyle(1, 0xfce7f3, 0.6)
        
        flower.beginPath()
        flower.moveTo(0, 0)
        flower.bezierCurveTo(-5, -3, -7, -9, 0, -11)
        flower.bezierCurveTo(7, -9, 5, -3, 0, 0)
        flower.fillPath()
        flower.strokePath()
        
        flower.fillStyle(0xffffff, 0.35)
        flower.beginPath()
        flower.moveTo(-1, -1)
        flower.quadraticCurveTo(-3, -6, -1, -9)
        flower.quadraticCurveTo(0, -6, -1, -1)
        flower.fillPath()
        
        flower.restore()
      }
    }
    
    flower.fillStyle(0xfbbf24, 0.95)
    const diamondSize = 5
    flower.beginPath()
    flower.moveTo(0, -2 - diamondSize)
    flower.lineTo(diamondSize * 0.7, -2)
    flower.lineTo(0, -2 + diamondSize * 0.7)
    flower.lineTo(-diamondSize * 0.7, -2)
    flower.closePath()
    flower.fillPath()
    
    flower.fillStyle(0xfef3c7, 0.9)
    flower.beginPath()
    flower.moveTo(0, -2 - diamondSize * 0.6)
    flower.lineTo(diamondSize * 0.3, -2)
    flower.lineTo(0, -2 + diamondSize * 0.2)
    flower.lineTo(-diamondSize * 0.1, -2 - diamondSize * 0.1)
    flower.closePath()
    flower.fillPath()
    
    return flower
  }

  startBreathing(plant, plantType) {
    const breatheIn = this.scene.tweens.add({
      targets: plant,
      scale: { from: 0.92, to: 1.08 },
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 1000
    })
    
    const glowPulse = this.scene.tweens.add({
      targets: plant.glow,
      alpha: { from: 0.18, to: 0.38 },
      scale: { from: 0.88, to: 1.18 },
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 1000
    })
    
    this.breathingTweens.push(breatheIn, glowPulse)
  }

  setCombo(combo) {
    this.currentCombo = Math.max(0, combo)
  }

  lightUp(plant) {
    if (plant.getData('isLit')) return false
    
    const cell = plant.getData('cell')
    const plantType = plant.getData('plantType')
    const type = plant.getData('type')
    
    plant.setData('isLit', true)
    cell.isLit = true
    this.litPlants.add(plant)
    
    this.scene.tweens.add({
      targets: plant,
      scale: { from: 1, to: 1.55, to: 1.25 },
      duration: 500,
      ease: 'Back.out'
    })
    
    this.scene.tweens.add({
      targets: plant.glow,
      alpha: { from: 0.3, to: 0.85 },
      scale: { from: 1, to: 2.2 },
      duration: 600,
      ease: 'Cubic.out'
    })
    
    const burst = this.scene.add.particles(plant.x, plant.y, 'sparkle', {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 850,
      frequency: 50,
      tint: plantType.glowColor,
      quantity: 18,
      duration: 350
    })
    
    this.audioManager.playPlantLight(type, this.currentCombo)
    
    return true
  }

  lightOff(plant) {
    if (!plant.getData('isLit')) return
    
    const cell = plant.getData('cell')
    plant.setData('isLit', false)
    cell.isLit = false
    this.litPlants.delete(plant)
    
    this.scene.tweens.add({
      targets: plant,
      scale: 1,
      duration: 320,
      ease: 'Cubic.out'
    })
    
    this.scene.tweens.add({
      targets: plant.glow,
      alpha: 0.3,
      scale: 1,
      duration: 320,
      ease: 'Cubic.out'
    })
  }

  lightAll() {
    this.plants.forEach(plant => this.lightUp(plant))
  }

  resetAll() {
    this.plants.forEach(plant => this.lightOff(plant))
  }

  getLitCount() {
    return this.litPlants.size
  }

  getTotalCount() {
    return this.plants.length
  }

  isPlantLit(cell) {
    return cell.isLit
  }

  applyTheme(theme) {
    const newThemeId = theme.id
    const updatedPlants = []
    
    this.plants.forEach(plant => {
      const type = plant.getData('type')
      const cell = plant.getData('cell')
      const wasLit = plant.getData('isLit')
      const plantScale = plant.scale
      
      const newColors = theme.plants[type]
      if (!newColors) return
      
      const pos = { x: plant.x, y: plant.y }
      const currentPlantType = plant.getData('plantType')
      const newPlantType = {
        ...currentPlantType,
        color: newColors.color,
        glowColor: newColors.glowColor,
        shape: newColors.shape
      }
      
      plant.destroy()
      
      const newPlant = this.createPlantSprite(pos.x, pos.y, type, newPlantType)
      newPlant.setScale(plantScale)
      newPlant.setData('cell', cell)
      newPlant.setData('type', type)
      newPlant.setData('plantType', newPlantType)
      newPlant.setData('isLit', wasLit)
      
      const plantSize = newPlantType.size * 2.5
      newPlant.setInteractive(new Phaser.Geom.Rectangle(-plantSize / 2, -plantSize / 2, plantSize, plantSize), Phaser.Geom.Rectangle.Contains)
      if (newPlant.input) newPlant.input.cursor = 'pointer'
      
      if (wasLit) {
        newPlant.setScale(1.25)
        newPlant.glow.alpha = 0.85
      }
      
      cell.plantSprite = newPlant
      updatedPlants.push(newPlant)
      
      if (wasLit) {
        this.litPlants.delete(plant)
        this.litPlants.add(newPlant)
        cell.isLit = true
      }
      
      this.startBreathing(newPlant, newPlantType)
    })
    
    this.plants = updatedPlants
  }

  redrawPlantSprite(plant, type, plantType) {
    const oldSprite = plant.plantSprite
    if (!oldSprite) return
    
    let newSprite
    const themeId = this.themeManager.getThemeId()
    
    switch (type) {
      case 'moss':
        newSprite = this.createMossSprite(plantType, themeId)
        break
      case 'mushroom':
        newSprite = this.createMushroomSprite(plantType, themeId)
        break
      case 'flower':
        newSprite = this.createFlowerSprite(plantType, themeId)
        break
      default:
        newSprite = this.createMossSprite(plantType, themeId)
    }
    
    const index = plant.getIndex(oldSprite)
    if (index >= 0) {
      plant.addAt(newSprite, index)
      oldSprite.destroy()
      plant.plantSprite = newSprite
    }
  }

  pulsePlant(plant) {
    if (!plant) return
    
    const pulseTween = this.scene.tweens.add({
      targets: plant,
      scale: { from: 1, to: 1.3, to: 1 },
      duration: 800,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    })
    
    const glowPulse = this.scene.tweens.add({
      targets: plant.glow,
      alpha: { from: 0.3, to: 0.7, to: 0.3 },
      scale: { from: 1, to: 1.5, to: 1 },
      duration: 800,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    })
    
    this.pulseTweens.push(pulseTween, glowPulse)
  }

  stopAllPulses() {
    this.pulseTweens.forEach(tween => tween.stop())
    this.pulseTweens = []
    
    this.plants.forEach(plant => {
      if (!plant.getData('isLit')) {
        plant.setScale(1)
        if (plant.glow) {
          plant.glow.alpha = 0.3
          plant.glow.scale = 1
        }
      }
    })
  }

  destroy() {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe()
    }
    this.breathingTweens.forEach(tween => tween.stop())
    this.breathingTweens = []
    this.pulseTweens.forEach(tween => tween.stop())
    this.pulseTweens = []
    this.plants = []
    this.litPlants.clear()
  }
}
