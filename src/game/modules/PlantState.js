import { PLANT_TYPES } from '../data/levels.js'

export class PlantState {
  constructor(scene, levelMap) {
    this.scene = scene
    this.levelMap = levelMap
    this.plants = []
    this.litPlants = new Set()
    this.breathingTweens = []
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

  createPlant(cell) {
    const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
    const plantType = PLANT_TYPES[cell.plant.type]
    const plant = this.createPlantSprite(pos.x, pos.y, cell.plant.type, plantType)
    
    plant.setData('cell', cell)
    plant.setData('type', cell.plant.type)
    plant.setData('plantType', plantType)
    plant.setData('isLit', false)
    
    plant.setInteractive({ useHandCursor: true })
    
    this.startBreathing(plant, plantType)
    
    cell.plantSprite = plant
    this.plants.push(plant)
  }

  createPlantSprite(x, y, type, plantType) {
    const container = this.scene.add.container(x, y)
    
    const glow = this.scene.add.circle(0, 0, plantType.size * 0.8, plantType.glowColor, 0.2)
    container.add(glow)
    
    let sprite
    switch (type) {
      case 'moss':
        sprite = this.createMossSprite(plantType)
        break
      case 'mushroom':
        sprite = this.createMushroomSprite(plantType)
        break
      case 'flower':
        sprite = this.createFlowerSprite(plantType)
        break
      default:
        sprite = this.createMossSprite(plantType)
    }
    container.add(sprite)
    
    container.glow = glow
    container.plantSprite = sprite
    container.type = type
    
    return container
  }

  createMossSprite(plantType) {
    const moss = this.scene.add.graphics()
    
    moss.fillStyle(plantType.color, 0.8)
    
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const radius = 8 + Math.random() * 4
      const x = Math.cos(angle) * radius * 0.5
      const y = Math.sin(angle) * radius * 0.3
      
      moss.beginPath()
      moss.arc(x, y, 6 + Math.random() * 3, 0, Math.PI * 2)
      moss.fill()
    }
    
    moss.beginPath()
    moss.arc(0, 2, 10, 0, Math.PI * 2)
    moss.fill()
    
    return moss
  }

  createMushroomSprite(plantType) {
    const mushroom = this.scene.add.graphics()
    
    mushroom.fillStyle(0xf5f5f4, 0.9)
    mushroom.fillRect(-4, 0, 8, 12)
    
    mushroom.fillStyle(plantType.color, 0.9)
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

  createFlowerSprite(plantType) {
    const flower = this.scene.add.graphics()
    
    flower.fillStyle(0x22c55e, 0.8)
    flower.fillRect(-2, 5, 4, 10)
    
    flower.fillStyle(plantType.color, 0.9)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const x = Math.cos(angle) * 8
      const y = Math.sin(angle) * 8 - 2
      
      flower.beginPath()
      flower.ellipse(x, y, 5, 8, angle, 0, Math.PI * 2)
      flower.fill()
    }
    
    flower.fillStyle(0xfbbf24, 1)
    flower.beginPath()
    flower.arc(0, -2, 5, 0, Math.PI * 2)
    flower.fill()
    
    return flower
  }

  startBreathing(plant, plantType) {
    const breatheIn = this.scene.tweens.add({
      targets: plant,
      scale: { from: 0.9, to: 1.1 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 1000
    })
    
    const glowPulse = this.scene.tweens.add({
      targets: plant.glow,
      alpha: { from: 0.15, to: 0.35 },
      scale: { from: 0.9, to: 1.15 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 1000
    })
    
    this.breathingTweens.push(breatheIn, glowPulse)
  }

  lightUp(plant) {
    if (plant.getData('isLit')) return false
    
    const cell = plant.getData('cell')
    const plantType = plant.getData('plantType')
    
    plant.setData('isLit', true)
    cell.isLit = true
    this.litPlants.add(plant)
    
    this.scene.tweens.add({
      targets: plant,
      scale: { from: 1, to: 1.5, to: 1.2 },
      duration: 500,
      ease: 'Back.out'
    })
    
    this.scene.tweens.add({
      targets: plant.glow,
      alpha: { from: 0.3, to: 0.8 },
      scale: { from: 1, to: 2 },
      duration: 600,
      ease: 'Cubic.out'
    })
    
    const burst = this.scene.add.particles(plant.x, plant.y, 'sparkle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      frequency: 50,
      tint: plantType.glowColor,
      quantity: 15,
      duration: 300
    })
    
    this.playLightSound()
    
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
      duration: 300,
      ease: 'Cubic.out'
    })
    
    this.scene.tweens.add({
      targets: plant.glow,
      alpha: 0.3,
      scale: 1,
      duration: 300,
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

  playLightSound() {
    if (!this.scene.sound) return
    
    try {
      const synth = window.AudioContext || window.webkitAudioContext
      if (!synth) return
      
      if (!this.audioContext) {
        this.audioContext = new synth()
      }
      
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(784, this.audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
      
      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.2)
    } catch (e) {
    }
  }

  destroy() {
    this.breathingTweens.forEach(tween => tween.stop())
    this.breathingTweens = []
    this.plants = []
    this.litPlants.clear()
  }
}
