import { ThemeManager } from './ThemeManager.js'

export class Effects {
  constructor(scene) {
    this.scene = scene
    this.levelMap = null
    this.bgParticles = null
    this.winTweens = []
    this.creature = null
    this.creatureTweens = []
    this.ambientGlow = null
    
    this.themeManager = ThemeManager.getInstance()
    
    this.themeUnsubscribe = this.themeManager.onThemeChange((theme) => {
      this.applyTheme(theme)
    })
  }

  setLevelMap(levelMap) {
    this.levelMap = levelMap
  }

  createSparkleTexture() {
    if (this.scene.textures.exists('sparkle')) return
    
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0xffffff, 1)
    graphics.beginPath()
    graphics.arc(16, 16, 4, 0, Math.PI * 2)
    graphics.fill()
    
    graphics.fillStyle(0xffffff, 0.8)
    graphics.fillTriangle(16, 6, 18, 16, 14, 16)
    graphics.fillTriangle(16, 26, 18, 16, 14, 16)
    graphics.fillTriangle(6, 16, 16, 14, 16, 18)
    graphics.fillTriangle(26, 16, 16, 14, 16, 18)
    
    graphics.generateTexture('sparkle', 32, 32)
    graphics.destroy()
  }

  createThemeParticleTexture() {
    const particleShape = this.themeManager.getParticleColors().particleShape || 'star'
    
    if (this.scene.textures.exists('theme_particle_' + particleShape)) return
    
    const graphics = this.scene.add.graphics()
    
    switch (particleShape) {
      case 'snowflake':
        graphics.fillStyle(0xffffff, 1)
        graphics.lineStyle(1.5, 0xffffff, 0.9)
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const endX = 16 + Math.cos(angle) * 10
          const endY = 16 + Math.sin(angle) * 10
          graphics.lineBetween(16, 16, endX, endY)
          
          const midX = 16 + Math.cos(angle) * 6
          const midY = 16 + Math.sin(angle) * 6
          const branchAngle1 = angle + Math.PI / 4
          const branchAngle2 = angle - Math.PI / 4
          graphics.lineBetween(midX, midY, midX + Math.cos(branchAngle1) * 4, midY + Math.sin(branchAngle1) * 4)
          graphics.lineBetween(midX, midY, midX + Math.cos(branchAngle2) * 4, midY + Math.sin(branchAngle2) * 4)
        }
        break
      case 'ember':
        graphics.fillStyle(0xffaa00, 1)
        graphics.beginPath()
        graphics.arc(16, 16, 5, 0, Math.PI * 2)
        graphics.fill()
        graphics.fillStyle(0xff6600, 0.8)
        graphics.beginPath()
        graphics.arc(16, 16, 3, 0, Math.PI * 2)
        graphics.fill()
        graphics.fillStyle(0xffff88, 1)
        graphics.beginPath()
        graphics.arc(16, 16, 1.5, 0, Math.PI * 2)
        graphics.fill()
        break
      case 'diamond':
        graphics.fillStyle(0xffffff, 1)
        graphics.lineStyle(1, 0xffffff, 0.95)
        graphics.beginPath()
        graphics.moveTo(16, 4)
        graphics.lineTo(26, 16)
        graphics.lineTo(16, 28)
        graphics.lineTo(6, 16)
        graphics.closePath()
        graphics.fillPath()
        graphics.strokePath()
        graphics.fillStyle(0xffffff, 0.6)
        graphics.beginPath()
        graphics.moveTo(16, 7)
        graphics.lineTo(21, 16)
        graphics.lineTo(16, 13)
        graphics.lineTo(11, 16)
        graphics.closePath()
        graphics.fillPath()
        break
      case 'star':
      default:
        graphics.fillStyle(0xffffff, 1)
        const spikes = 5
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? 10 : 4
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
          const x = 16 + Math.cos(angle) * radius
          const y = 16 + Math.sin(angle) * radius
          if (i === 0) graphics.beginPath(), graphics.moveTo(x, y)
          else graphics.lineTo(x, y)
        }
        graphics.closePath()
        graphics.fill()
        graphics.fillStyle(0xffffff, 0.9)
        graphics.beginPath()
        graphics.arc(16, 16, 3, 0, Math.PI * 2)
        graphics.fill()
    }
    
    graphics.generateTexture('theme_particle_' + particleShape, 32, 32)
    graphics.destroy()
  }

  init() {
    this.createSparkleTexture()
    this.createThemeParticleTexture()
    this.createBackgroundParticles()
    this.createAmbientGlow()
    
    if (this.levelMap && this.levelMap.currentLevel) {
      const startPos = this.levelMap.currentLevel.start
      const worldPos = this.levelMap.getWorldPosition(startPos.row, startPos.col)
      this.creature = this.createCreatureSprite(worldPos.x, worldPos.y)
    }
  }

  createLevelTransition(onComplete) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    const mask = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0
    )
    mask.setDepth(1000)
    
    this.scene.tweens.add({
      targets: mask,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.In',
      onComplete: () => {
        if (onComplete) onComplete()
        
        this.scene.tweens.add({
          targets: mask,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.Out',
          delay: 100,
          onComplete: () => {
            mask.destroy()
          }
        })
      }
    })
  }

  createBackgroundParticles() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    const particleConfig = this.themeManager.getParticleColors()
    const tints = particleConfig.bgTints || [0x60a5fa, 0xa78bfa, 0xf472b6]
    const speedRange = particleConfig.speedRange || [5, 20]
    const floatDirection = particleConfig.floatDirection || 'random'
    const particleShape = particleConfig.particleShape || 'star'
    const textureKey = 'theme_particle_' + particleShape
    
    if (!this.scene.textures.exists(textureKey)) {
      this.createThemeParticleTexture()
    }
    
    let velocityX, velocityY, moveToX, moveToY
    
    switch (floatDirection) {
      case 'down':
        velocityX = { min: -20, max: 20 }
        velocityY = { min: speedRange[0], max: speedRange[1] }
        break
      case 'up':
        velocityX = { min: -30, max: 30 }
        velocityY = { min: -speedRange[1], max: -speedRange[0] }
        break
      case 'radial':
        velocityX = { min: -speedRange[0], max: speedRange[0] }
        velocityY = { min: -speedRange[0], max: speedRange[0] }
        break
      case 'random':
      default:
        velocityX = { min: -speedRange[1], max: speedRange[1] }
        velocityY = { min: -speedRange[1], max: speedRange[1] }
    }
    
    if (this.bgParticles) {
      this.bgParticles.destroy()
    }
    
    this.bgParticles = this.scene.add.particles(width / 2, height / 2, textureKey, {
      lifespan: { min: 4000, max: 9000 },
      speed: { min: 5, max: 25 },
      scale: { min: 0.15, max: 0.45 },
      alpha: { min: 0.25, max: 0.7 },
      tint: tints,
      quantity: 1,
      blendMode: Phaser.BlendModes.SCREEN,
      gravityX: velocityX,
      gravityY: velocityY,
      bounds: { x: 0, y: -100, w: width, h: height + 200 },
      collideBottom: false,
      collideTop: false,
      collideLeft: false,
      collideRight: false,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(-width / 2, -height / 2, width * 2, height * 2)
      }
    })
    
    this.bgParticles.setDepth(0)
    this.bgParticles.start()
    
    if (this.bgLoopTimer) this.bgLoopTimer.remove()
    this.bgLoopTimer = this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (!this.bgParticles || !this.bgParticles.alive) return
        if (this.bgParticles.getParticleCount() > 120) return
        const w = this.scene.game.config.width
        const h = this.scene.game.config.height
        this.bgParticles.emitParticleAt(
          Phaser.Math.Between(-50, w + 50),
          Phaser.Math.Between(-50, h + 50)
        )
      }
    })
  }

  createAmbientGlow() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    const particleConfig = this.themeManager.getParticleColors()
    
    if (this.ambientGlow) {
      this.ambientGlow.destroy()
    }
    
    this.ambientGlow = this.scene.add.graphics()
    this.ambientGlow.fillStyle(particleConfig.ambientGlow, 0.35)
    this.ambientGlow.fillCircle(width / 2, height / 2 - 20, width * 0.45)
    this.ambientGlow.setDepth(-1)
    this.ambientGlow.setAlpha(0.25)
    
    this.scene.tweens.add({
      targets: this.ambientGlow,
      alpha: 0.45,
      duration: 3500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createCreatureSprite(x, y) {
    const container = this.scene.add.container(x, y)
    const creatureConfig = this.themeManager.getCreatureColors()
    const shape = creatureConfig.shape || 'round_larva'
    const themeId = this.themeManager.getThemeId()
    
    const glow = this.scene.add.circle(0, 0, 38, creatureConfig.glow, 0.12)
    container.add(glow)
    
    let bodyParts
    switch (shape) {
      case 'crystal_fish':
        bodyParts = this.createCrystalFishCreature(creatureConfig)
        break
      case 'fire_salamander':
        bodyParts = this.createFireSalamanderCreature(creatureConfig)
        break
      case 'fairy_gem':
        bodyParts = this.createFairyGemCreature(creatureConfig)
        break
      case 'round_larva':
      default:
        bodyParts = this.createRoundLarvaCreature(creatureConfig)
    }
    
    bodyParts.forEach(part => container.add(part))
    
    container.glow = glow
    container.bodyParts = bodyParts
    container.config = creatureConfig
    container.shape = shape
    container.themeId = themeId
    
    container.setDepth(30)
    
    this.startCreatureIdleAnimation(container, creatureConfig)
    
    return container
  }

  createRoundLarvaCreature(config) {
    const parts = []
    
    const body = this.scene.add.ellipse(0, 0, 25, 20, config.body, 0.9)
    body.setStrokeStyle(2, config.bodyStroke, 1)
    parts.push(body)
    
    const segment1 = this.scene.add.ellipse(0, -4, 16, 12, config.body, 0.75)
    parts.push(segment1)
    
    const antennaLeft = this.scene.add.line(-8, -14, -8, -14, -12, -22, 2, config.bodyStroke, 0.9)
    parts.push(antennaLeft)
    const antennaRight = this.scene.add.line(8, -14, 8, -14, 12, -22, 2, config.bodyStroke, 0.9)
    parts.push(antennaRight)
    
    const antennaBallLeft = this.scene.add.circle(-12, -22, 2.5, config.glow, 0.95)
    parts.push(antennaBallLeft)
    const antennaBallRight = this.scene.add.circle(12, -22, 2.5, config.glow, 0.95)
    parts.push(antennaBallRight)
    
    const eyeWhiteLeft = this.scene.add.circle(-6, -4, 4.5, 0xffffff, 1)
    parts.push(eyeWhiteLeft)
    const eyeWhiteRight = this.scene.add.circle(6, -4, 4.5, 0xffffff, 1)
    parts.push(eyeWhiteRight)
    
    const eyeLeft = this.scene.add.circle(-5.5, -3.5, 2.5, 0x1f2937, 1)
    parts.push(eyeLeft)
    const eyeRight = this.scene.add.circle(6.5, -3.5, 2.5, 0x1f2937, 1)
    parts.push(eyeRight)
    
    const eyeShineLeft = this.scene.add.circle(-6.5, -5, 1, 0xffffff, 1)
    parts.push(eyeShineLeft)
    const eyeShineRight = this.scene.add.circle(5.5, -5, 1, 0xffffff, 1)
    parts.push(eyeShineRight)
    
    const cheekLeft = this.scene.add.ellipse(-10, 3, 3.5, 2.5, 0xfda4af, 0.5)
    parts.push(cheekLeft)
    const cheekRight = this.scene.add.ellipse(10, 3, 3.5, 2.5, 0xfda4af, 0.5)
    parts.push(cheekRight)
    
    return parts
  }

  createCrystalFishCreature(config) {
    const parts = []
    
    const body = this.scene.add.graphics()
    body.fillStyle(config.body, 0.92)
    body.lineStyle(2, config.bodyStroke, 1)
    body.beginPath()
    body.moveTo(-18, 0)
    body.quadraticCurveTo(-12, -14, 0, -12)
    body.quadraticCurveTo(14, -10, 18, 0)
    body.quadraticCurveTo(14, 10, 0, 12)
    body.quadraticCurveTo(-12, 14, -18, 0)
    body.closePath()
    body.fillPath()
    body.strokePath()
    
    body.fillStyle(0xe0f2fe, 0.5)
    body.beginPath()
    body.moveTo(-10, -6)
    body.quadraticCurveTo(-4, -10, 2, -6)
    body.quadraticCurveTo(-2, -2, -10, -6)
    body.fillPath()
    parts.push(body)
    
    const tail = this.scene.add.graphics()
    tail.fillStyle(config.body, 0.88)
    tail.lineStyle(1.5, config.glow, 0.9)
    tail.beginPath()
    tail.moveTo(18, 0)
    tail.lineTo(30, -10)
    tail.lineTo(26, 0)
    tail.lineTo(30, 10)
    tail.closePath()
    tail.fillPath()
    tail.strokePath()
    parts.push(tail)
    
    const finTop = this.scene.add.triangle(-2, -12, -6, -20, 2, -18, -4, -12, config.glow, 0.75)
    finTop.setStrokeStyle(1, config.bodyStroke, 0.85)
    parts.push(finTop)
    
    const finBottom = this.scene.add.triangle(-2, 12, -6, 20, 2, 18, -4, 12, config.glow, 0.75)
    finBottom.setStrokeStyle(1, config.bodyStroke, 0.85)
    parts.push(finBottom)
    
    const wingLeft = this.scene.add.ellipse(-6, -2, 10, 5, 0xffffff, 0.35)
    wingLeft.rotation = -0.5
    parts.push(wingLeft)
    
    const wingRight = this.scene.add.ellipse(-6, 2, 10, 5, 0xffffff, 0.35)
    wingRight.rotation = 0.5
    parts.push(wingRight)
    
    const eyeWhite = this.scene.add.circle(5, -2, 5, 0xffffff, 1)
    parts.push(eyeWhite)
    
    const eye = this.scene.add.circle(6, -2, 2.8, 0x0c4a6e, 1)
    parts.push(eye)
    
    const eyeShine = this.scene.add.circle(5, -4, 1.2, 0xffffff, 1)
    parts.push(eyeShine)
    
    const cheek = this.scene.add.ellipse(-2, 5, 4, 2.5, 0x67e8f9, 0.5)
    parts.push(cheek)
    
    const iceSpike = this.scene.add.triangle(-18, -2, -24, -8, -16, -2, -18, 4, config.glow, 0.9)
    iceSpike.setStrokeStyle(1, 0xffffff, 0.7)
    parts.push(iceSpike)
    
    return parts
  }

  createFireSalamanderCreature(config) {
    const parts = []
    
    const body = this.scene.add.ellipse(0, 1, 27, 18, config.body, 0.92)
    body.setStrokeStyle(2, config.bodyStroke, 1)
    parts.push(body)
    
    const scales = this.scene.add.graphics()
    scales.fillStyle(config.glow, 0.35)
    for (let i = 0; i < 5; i++) {
      scales.beginPath()
      scales.arc(-10 + i * 5, -2, 3, 0, Math.PI * 2)
      scales.fill()
    }
    parts.push(scales)
    
    const tail = this.scene.add.graphics()
    tail.fillStyle(config.body, 0.9)
    tail.lineStyle(2, config.bodyStroke, 1)
    tail.beginPath()
    tail.moveTo(10, 4)
    tail.quadraticCurveTo(22, 8, 30, 14)
    tail.quadraticCurveTo(26, 18, 18, 14)
    tail.quadraticCurveTo(12, 12, 10, 4)
    tail.fillPath()
    tail.strokePath()
    
    tail.fillStyle(config.glow, 0.75)
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 4
      const y = 8 + i * 1.5
      tail.beginPath()
      tail.moveTo(x, y)
      tail.quadraticCurveTo(x + 2, y - 4, x + 4, y)
      tail.quadraticCurveTo(x + 2, y + 2, x, y)
      tail.fillPath()
    }
    parts.push(tail)
    
    const flameCrest = this.scene.add.graphics()
    const flames = 6
    for (let i = 0; i < flames; i++) {
      const x = -12 + i * 5
      const height = 8 + (i === 2 || i === 3 ? 4 : 0)
      const flameColor = i % 2 === 0 ? config.glow : 0xfbbf24
      flameCrest.fillStyle(flameColor, 0.95)
      flameCrest.beginPath()
      flameCrest.moveTo(x - 2, -8)
      flameCrest.quadraticCurveTo(x, -8 - height, x + 2, -8)
      flameCrest.quadraticCurveTo(x, -6, x - 2, -8)
      flameCrest.fillPath()
    }
    parts.push(flameCrest)
    
    const legFL = this.scene.add.ellipse(-10, 9, 4, 6, config.bodyStroke, 0.9)
    parts.push(legFL)
    const legFR = this.scene.add.ellipse(10, 9, 4, 6, config.bodyStroke, 0.9)
    parts.push(legFR)
    const legBL = this.scene.add.ellipse(-14, 8, 3.5, 5, config.bodyStroke, 0.85)
    parts.push(legBL)
    const legBR = this.scene.add.ellipse(14, 8, 3.5, 5, config.bodyStroke, 0.85)
    parts.push(legBR)
    
    const antennaLeft = this.scene.add.graphics()
    antennaLeft.fillStyle(0xfbbf24, 1)
    antennaLeft.beginPath()
    antennaLeft.moveTo(-9, -8)
    antennaLeft.quadraticCurveTo(-14, -18, -10, -22)
    antennaLeft.quadraticCurveTo(-6, -20, -6, -14)
    antennaLeft.quadraticCurveTo(-8, -10, -9, -8)
    antennaLeft.fillPath()
    parts.push(antennaLeft)
    
    const antennaRight = this.scene.add.graphics()
    antennaRight.fillStyle(config.glow, 1)
    antennaRight.beginPath()
    antennaRight.moveTo(9, -8)
    antennaRight.quadraticCurveTo(14, -18, 10, -22)
    antennaRight.quadraticCurveTo(6, -20, 6, -14)
    antennaRight.quadraticCurveTo(8, -10, 9, -8)
    antennaRight.fillPath()
    parts.push(antennaRight)
    
    const eyeWhiteLeft = this.scene.add.circle(-6, -2, 5, 0xffffff, 1)
    parts.push(eyeWhiteLeft)
    const eyeWhiteRight = this.scene.add.circle(6, -2, 5, 0xffffff, 1)
    parts.push(eyeWhiteRight)
    
    const eyeLeft = this.scene.add.circle(-5, -1, 3, 0x7c2d12, 1)
    parts.push(eyeLeft)
    const eyeRight = this.scene.add.circle(7, -1, 3, 0x7c2d12, 1)
    parts.push(eyeRight)
    
    const eyeShineLeft = this.scene.add.circle(-6, -3.5, 1.3, 0xfef3c7, 1)
    parts.push(eyeShineLeft)
    const eyeShineRight = this.scene.add.circle(6, -3.5, 1.3, 0xfef3c7, 1)
    parts.push(eyeShineRight)
    
    const cheekLeft = this.scene.add.ellipse(-12, 4, 4.5, 3, 0xfbbf24, 0.45)
    parts.push(cheekLeft)
    const cheekRight = this.scene.add.ellipse(12, 4, 4.5, 3, 0xfbbf24, 0.45)
    parts.push(cheekRight)
    
    return parts
  }

  createFairyGemCreature(config) {
    const parts = []
    
    const wingLeft = this.scene.add.graphics()
    wingLeft.fillStyle(0xffffff, 0.3)
    wingLeft.lineStyle(1.5, config.glow, 0.75)
    wingLeft.beginPath()
    wingLeft.ellipse(-16, -6, 14, 18, -0.4, 0, Math.PI * 2)
    wingLeft.fillPath()
    wingLeft.strokePath()
    wingLeft.fillStyle(config.glow, 0.18)
    wingLeft.beginPath()
    wingLeft.ellipse(-16, -6, 8, 11, -0.4, 0, Math.PI * 2)
    wingLeft.fillPath()
    parts.push(wingLeft)
    
    const wingRight = this.scene.add.graphics()
    wingRight.fillStyle(0xffffff, 0.3)
    wingRight.lineStyle(1.5, config.glow, 0.75)
    wingRight.beginPath()
    wingRight.ellipse(16, -6, 14, 18, 0.4, 0, Math.PI * 2)
    wingRight.fillPath()
    wingRight.strokePath()
    wingRight.fillStyle(config.glow, 0.18)
    wingRight.beginPath()
    wingRight.ellipse(16, -6, 8, 11, 0.4, 0, Math.PI * 2)
    wingRight.fillPath()
    parts.push(wingRight)
    
    const body = this.scene.add.graphics()
    body.fillStyle(config.body, 0.95)
    body.lineStyle(2, config.bodyStroke, 1)
    body.beginPath()
    body.moveTo(0, -16)
    body.lineTo(10, -4)
    body.lineTo(8, 12)
    body.lineTo(0, 16)
    body.lineTo(-8, 12)
    body.lineTo(-10, -4)
    body.closePath()
    body.fillPath()
    body.strokePath()
    
    body.fillStyle(0xffffff, 0.5)
    body.beginPath()
    body.moveTo(-3, -12)
    body.lineTo(3, -10)
    body.lineTo(1, -2)
    body.lineTo(-4, -4)
    body.closePath()
    body.fillPath()
    parts.push(body)
    
    const shardLeft = this.scene.add.triangle(-10, -10, -14, -18, -8, -8, -10, -4, config.glow, 0.95)
    shardLeft.setStrokeStyle(1, 0xf0abfc, 0.9)
    parts.push(shardLeft)
    
    const shardRight = this.scene.add.triangle(10, -10, 14, -18, 8, -8, 10, -4, 0xf0abfc, 0.95)
    shardRight.setStrokeStyle(1, 0xfce7f3, 0.9)
    parts.push(shardRight)
    
    const crownShard = this.scene.add.triangle(0, -16, -6, -24, 0, -20, 6, -24, 0xfbbf24, 1)
    crownShard.setStrokeStyle(1, 0xfde68a, 0.9)
    parts.push(crownShard)
    
    const eyeWhiteLeft = this.scene.add.circle(-4, -2, 4.5, 0xffffff, 1)
    parts.push(eyeWhiteLeft)
    const eyeWhiteRight = this.scene.add.circle(4, -2, 4.5, 0xffffff, 1)
    parts.push(eyeWhiteRight)
    
    const eyeLeft = this.scene.add.circle(-3.5, -1.5, 2.5, 0x6d28d9, 1)
    parts.push(eyeLeft)
    const eyeRight = this.scene.add.circle(4.5, -1.5, 2.5, 0x6d28d9, 1)
    parts.push(eyeRight)
    
    const eyeShineLeft = this.scene.add.circle(-4.5, -4, 1, 0xfef3c7, 1)
    parts.push(eyeShineLeft)
    const eyeShineRight = this.scene.add.circle(3.5, -4, 1, 0xfef3c7, 1)
    parts.push(eyeShineRight)
    
    const irisColors = [0xfbbf24, 0xf472b6, 0x60a5fa]
    irisColors.forEach((color, i) => {
      const dot = this.scene.add.circle(-3.5 + i * 0.2, -1.5, 0.7, color, 0.8)
      parts.push(dot)
    })
    irisColors.forEach((color, i) => {
      const dot = this.scene.add.circle(4.5 + i * 0.2, -1.5, 0.7, color, 0.8)
      parts.push(dot)
    })
    
    const cheekLeft = this.scene.add.ellipse(-7, 4, 3.5, 2.5, 0xf472b6, 0.55)
    parts.push(cheekLeft)
    const cheekRight = this.scene.add.ellipse(7, 4, 3.5, 2.5, 0xf472b6, 0.55)
    parts.push(cheekRight)
    
    return parts
  }

  startCreatureIdleAnimation(creature, config) {
    const floatY = this.scene.tweens.add({
      targets: creature,
      y: creature.y + 6,
      duration: 1600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    this.creatureTweens.push(floatY)
    
    const rotate = this.scene.tweens.add({
      targets: creature,
      rotation: 0.08,
      duration: 1900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 300
    })
    this.creatureTweens.push(rotate)
    
    const glowPulse = this.scene.tweens.add({
      targets: creature.glow,
      alpha: 0.08,
      scale: 1.3,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    this.creatureTweens.push(glowPulse)
  }

  moveCreature(path, onComplete) {
    if (!this.creature || !path || path.length === 0) {
      if (onComplete) onComplete()
      return
    }
    
    const positions = path.map((cell) => {
      const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
      return { x: pos.x, y: pos.y }
    })
    
    const timeline = this.scene.tweens.createTimeline()
    
    positions.forEach((pos, index) => {
      if (index === 0) return
      
      const prevPos = positions[index - 1]
      const distance = Math.sqrt(Math.pow(pos.x - prevPos.x, 2) + Math.pow(pos.y - prevPos.y, 2))
      const duration = distance * 8
      
      timeline.add({
        targets: this.creature,
        x: pos.x,
        y: pos.y,
        duration: duration,
        ease: 'Sine.easeInOut',
        onStart: () => {
          this.scene.tweens.add({
            targets: this.creature,
            scale: { from: 1, to: 1.15, to: 1 },
            duration: duration,
            ease: 'Sine.easeInOut'
          })
          
          this.createWalkParticles(pos.x, pos.y)
        }
      })
    })
    
    if (onComplete) {
      timeline.setCallback('onComplete', onComplete)
    }
    
    timeline.play()
  }

  animateCreatureAlongPath(creature, path, onComplete) {
    if (!creature || !path || path.length === 0) {
      if (onComplete) onComplete()
      return
    }
    
    this.creature = creature
    this.creatureTweens.forEach(tween => tween.stop())
    this.creatureTweens = []
    
    const positions = path.map((cell) => {
      const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
      return { x: pos.x, y: pos.y }
    })
    
    const timeline = this.scene.tweens.createTimeline()
    
    positions.forEach((pos, index) => {
      if (index === 0) return
      
      const prevPos = positions[index - 1]
      const distance = Math.sqrt(Math.pow(pos.x - prevPos.x, 2) + Math.pow(pos.y - prevPos.y, 2))
      const moveDuration = distance * 8
      
      const dx = pos.x - prevPos.x
      const dy = pos.y - prevPos.y
      const targetAngle = Math.atan2(dy, dx)
      
      const currentRotation = creature.rotation
      let normalizedTarget = targetAngle
      
      while (normalizedTarget - currentRotation > Math.PI) normalizedTarget -= Math.PI * 2
      while (normalizedTarget - currentRotation < -Math.PI) normalizedTarget += Math.PI * 2
      
      const rotationDiff = Math.abs(normalizedTarget - currentRotation)
      
      if (rotationDiff > 0.2 && index > 1) {
        const headTurnDuration = Math.min(120, moveDuration * 0.3)
        timeline.add({
          targets: creature,
          x: prevPos.x,
          y: prevPos.y,
          duration: 0
        })
        
        timeline.add({
          targets: creature,
          rotation: normalizedTarget,
          scaleX: 1.08,
          scaleY: 0.94,
          duration: headTurnDuration,
          ease: 'Cubic.Out'
        })
        
        timeline.add({
          targets: creature,
          scaleX: 1,
          scaleY: 1,
          duration: 60,
          ease: 'Back.Out'
        })
      } else if (index === 1) {
        timeline.add({
          targets: creature,
          rotation: normalizedTarget,
          duration: 150,
          ease: 'Cubic.Out'
        })
      }
      
      timeline.add({
        targets: creature,
        x: pos.x,
        y: pos.y,
        duration: moveDuration,
        ease: 'Sine.easeInOut',
        onStart: () => {
          const bounceY = this.scene.tweens.add({
            targets: creature,
            scaleY: { from: 1, to: 0.88, to: 1.05, to: 1 },
            scaleX: { from: 1, to: 1.08, to: 0.96, to: 1 },
            duration: moveDuration,
            ease: 'Sine.easeInOut'
          })
          this.creatureTweens.push(bounceY)
          
          this.createWalkParticles(pos.x, pos.y)
        }
      })
      
      if (index < positions.length - 1) {
        const nextPos = positions[index + 1]
        const nextDx = nextPos.x - pos.x
        const nextDy = nextPos.y - pos.y
        const nextAngle = Math.atan2(nextDy, nextDx)
        
        let normalizedNext = nextAngle
        while (normalizedNext - normalizedTarget > Math.PI) normalizedNext -= Math.PI * 2
        while (normalizedNext - normalizedTarget < -Math.PI) normalizedNext += Math.PI * 2
        
        const nextRotationDiff = Math.abs(normalizedNext - normalizedTarget)
        
        if (nextRotationDiff > 0.3) {
          timeline.add({
            targets: creature,
            x: pos.x,
            y: pos.y,
            duration: 40
          })
        }
      }
    })
    
    timeline.setCallback('onComplete', () => {
      this.playVictoryDance(creature, onComplete)
    })
    
    timeline.play()
  }

  playVictoryDance(creature, onComplete) {
    const victoryTimeline = this.scene.tweens.createTimeline()
    
    victoryTimeline.add({
      targets: creature,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Cubic.Out'
    })
    
    victoryTimeline.add({
      targets: creature,
      y: creature.y - 35,
      scaleX: 0.9,
      scaleY: 1.2,
      duration: 250,
      ease: 'Cubic.Out'
    })
    
    victoryTimeline.add({
      targets: creature,
      y: creature.y,
      scaleX: 1.15,
      scaleY: 0.85,
      duration: 150,
      ease: 'Bounce.Out'
    })
    
    victoryTimeline.add({
      targets: creature,
      y: creature.y - 25,
      scaleX: 0.95,
      scaleY: 1.15,
      duration: 200,
      ease: 'Cubic.Out'
    })
    
    victoryTimeline.add({
      targets: creature,
      y: creature.y,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 130,
      ease: 'Bounce.Out'
    })
    
    victoryTimeline.add({
      targets: creature,
      rotation: -0.3,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: 'Cubic.Out'
    })
    
    victoryTimeline.add({
      targets: creature,
      rotation: 0.3,
      duration: 120,
      ease: 'Cubic.InOut',
      yoyo: true,
      repeat: 2
    })
    
    victoryTimeline.add({
      targets: creature,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Elastic.Out'
    })
    
    if (onComplete) {
      victoryTimeline.setCallback('onComplete', onComplete)
    }
    
    victoryTimeline.play()
    
    const endX = creature.x
    const endY = creature.y
    
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(150 + i * 250, () => {
        const colors = this.themeManager.getParticleColors().bgTints
        this.scene.add.particles(endX, endY - 20, 'sparkle', {
          speed: { min: 60, max: 180 },
          angle: { min: 200, max: 340 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 800,
          tint: [...colors, 0xfbbf24, 0x22c55e],
          quantity: 15,
          duration: 300
        })
      })
    }
  }

  playShakeHead(creature, onComplete) {
    if (!creature) {
      if (onComplete) onComplete()
      return
    }
    
    this.creatureTweens.forEach(tween => tween.stop())
    this.creatureTweens = []
    
    const originalX = creature.x
    const originalY = creature.y
    const originalRotation = creature.rotation
    const originalScaleX = creature.scaleX
    const originalScaleY = creature.scaleY
    
    const shakeTimeline = this.scene.tweens.createTimeline()
    
    shakeTimeline.add({
      targets: creature,
      scaleX: 1.1,
      scaleY: 0.92,
      duration: 80,
      ease: 'Cubic.Out'
    })
    
    shakeTimeline.add({
      targets: creature,
      rotation: originalRotation - 0.35,
      x: originalX - 6,
      duration: 90,
      ease: 'Cubic.InOut'
    })
    
    shakeTimeline.add({
      targets: creature,
      rotation: originalRotation + 0.35,
      x: originalX + 6,
      duration: 110,
      ease: 'Cubic.InOut'
    })
    
    shakeTimeline.add({
      targets: creature,
      rotation: originalRotation - 0.25,
      x: originalX - 4,
      duration: 90,
      ease: 'Cubic.InOut'
    })
    
    shakeTimeline.add({
      targets: creature,
      rotation: originalRotation + 0.25,
      x: originalX + 4,
      duration: 90,
      ease: 'Cubic.InOut'
    })
    
    shakeTimeline.add({
      targets: creature,
      rotation: originalRotation - 0.15,
      x: originalX - 2,
      duration: 70,
      ease: 'Cubic.InOut'
    })
    
    shakeTimeline.add({
      targets: creature,
      x: originalX,
      rotation: originalRotation,
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      duration: 200,
      ease: 'Elastic.Out'
    })
    
    this.scene.time.delayedCall(100, () => {
      const colors = this.themeManager.getParticleColors().bgTints
      this.scene.add.particles(creature.x, creature.y - 15, 'sparkle', {
        speed: { min: 40, max: 100 },
        angle: { min: 160, max: 200 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 500,
        tint: [0xef4444, 0xf97316],
        quantity: 8,
        duration: 200
      })
    })
    
    if (onComplete) {
      shakeTimeline.setCallback('onComplete', onComplete)
    }
    
    shakeTimeline.play()
  }

  createWalkParticles(x, y) {
    const colors = this.themeManager.getParticleColors().bgTints
    this.scene.add.particles(x, y, 'sparkle', {
      speed: { min: 25, max: 65 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 450,
      tint: colors,
      quantity: 3,
      duration: 200
    })
  }

  showWinEffect(winCell, onComplete) {
    const pos = this.levelMap.getWorldPosition(winCell.row, winCell.col)
    
    const glowRing = this.scene.add.circle(pos.x, pos.y, 15, 0xffffff, 0)
    glowRing.setStrokeStyle(4, 0xfbbf24, 0.9)
    glowRing.setDepth(100)
    
    const scaleOut = this.scene.tweens.add({
      targets: glowRing,
      scale: { from: 0.5, to: 4 },
      alpha: { from: 0.9, to: 0 },
      duration: 1200,
      ease: 'Cubic.Out',
      onComplete: () => {
        glowRing.destroy()
      }
    })
    this.winTweens.push(scaleOut)
    
    const colors = this.themeManager.getParticleColors().bgTints
    const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
      speed: { min: 90, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1400,
      tint: [...colors, 0xffffff, 0xfbbf24],
      quantity: 40,
      duration: 550,
      emitZone: { type: 'point' }
    })
    
    setTimeout(() => {
      if (this.creature) {
        this.creatureTweens.forEach(tween => tween.stop())
        this.creatureTweens = []
        
        const bounce = this.scene.tweens.add({
          targets: this.creature,
          scale: { from: 1, to: 1.6, to: 1, to: 1.4, to: 1 },
          rotation: { from: 0, to: Math.PI * 2.2, to: -Math.PI * 0.6, to: 0 },
          duration: 1500,
          ease: 'Elastic.Out',
          onComplete: () => {
            setTimeout(() => {
              if (onComplete) onComplete()
            }, 300)
          }
        })
        this.winTweens.push(bounce)
      } else {
        if (onComplete) onComplete()
      }
    }, 600)
  }

  showFailEffect(startCell, onComplete) {
    const pos = this.levelMap.getWorldPosition(startCell.row, startCell.col)
    
    if (this.creature) {
      this.creatureTweens.forEach(tween => tween.stop())
      this.creatureTweens = []
      
      const shake = this.scene.tweens.add({
        targets: this.creature,
        x: pos.x,
        duration: 70,
        yoyo: true,
        repeat: 9,
        ease: 'Stepped',
        offset: {
          x: { start: pos.x - 5, to: pos.x + 5 },
          y: { start: pos.y - 3, to: pos.y + 3 }
        },
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.creature,
            y: pos.y + 20,
            alpha: 0.5,
            duration: 800,
            ease: 'Cubic.In',
            onComplete: () => {
              if (onComplete) onComplete()
            }
          })
        }
      })
      this.winTweens.push(shake)
    } else {
      if (onComplete) onComplete()
    }
  }

  createObstacleBurst(x, y, obstacleColor, sparkColor) {
    this.scene.add.particles(x, y, 'sparkle', {
      speed: { min: 55, max: 130 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 750,
      tint: [obstacleColor, sparkColor, 0xffffff],
      quantity: 14,
      duration: 300
    })
  }

  applyTheme(theme) {
    this.createAmbientGlow()
    this.createThemeParticleTexture()
    this.createBackgroundParticles()
    
    if (this.creature) {
      const oldX = this.creature.x
      const oldY = this.creature.y
      const oldScale = this.creature.scale
      const oldRotation = this.creature.rotation
      
      this.creatureTweens.forEach(tween => tween.stop())
      this.creatureTweens = []
      
      this.creature.destroy()
      
      this.creature = this.createCreatureSprite(oldX, oldY)
      this.creature.setScale(oldScale)
      this.creature.rotation = oldRotation
      
      const centerX = this.scene.game.config.width / 2
      const centerY = this.scene.game.config.height / 2
      const burstColors = theme.particles.bgTints
      
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const bx = Phaser.Math.Between(centerX - 200, centerX + 200)
          const by = Phaser.Math.Between(centerY - 150, centerY + 150)
          
          this.scene.add.particles(bx, by, 'sparkle', {
            speed: { min: 60, max: 180 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 900,
            tint: burstColors,
            quantity: 20,
            duration: 400
          })
        }, i * 120)
      }
    }
  }

  destroy() {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe()
    }
    if (this.bgLoopTimer) this.bgLoopTimer.remove()
    if (this.bgParticles) this.bgParticles.destroy()
    if (this.ambientGlow) this.ambientGlow.destroy()
    if (this.creature) this.creature.destroy()
    this.winTweens.forEach(tween => tween.stop())
    this.creatureTweens.forEach(tween => tween.stop())
    this.winTweens = []
    this.creatureTweens = []
  }
}
