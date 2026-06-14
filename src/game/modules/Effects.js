import { ThemeManager } from './ThemeManager.js'

const DEFAULT_EFFECTS_THEME = {
  bgTints: [0x60a5fa, 0xa78bfa, 0xf472b6, 0x4ade80],
  ambientGlow: 0x1e3a5f
}

export class Effects {
  constructor(scene) {
    this.scene = scene
    this.particleSystems = []
    this.backgroundParticles = null
    this.ambientGlow = null
    this.vignette = null
    this.creatures = []
    
    this.themeManager = ThemeManager.getInstance()
    
    const particleTheme = this.themeManager.getParticleColors()
    this.theme = {
      ...DEFAULT_EFFECTS_THEME,
      bgTints: particleTheme.bgTints,
      ambientGlow: particleTheme.ambientGlow
    }
    
    this.themeUnsubscribe = this.themeManager.onThemeChange((theme) => {
      this.applyTheme(theme)
    })
  }

  init(themeColors = null) {
    if (themeColors) {
      this.theme = { ...DEFAULT_EFFECTS_THEME, ...themeColors }
    } else {
      const particleTheme = this.themeManager.getParticleColors()
      this.theme = {
        ...DEFAULT_EFFECTS_THEME,
        bgTints: particleTheme.bgTints,
        ambientGlow: particleTheme.ambientGlow
      }
    }
    this.createSparkleTexture()
    this.createBackgroundParticles()
    this.createAmbientGlow()
  }

  createSparkleTexture() {
    if (this.scene.textures.exists('sparkle')) return
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false })
    
    graphics.fillStyle(0xffffff, 1)
    graphics.beginPath()
    graphics.arc(4, 4, 2, 0, Math.PI * 2)
    graphics.fill()
    
    graphics.fillStyle(0xffffff, 0.6)
    graphics.beginPath()
    graphics.arc(4, 4, 4, 0, Math.PI * 2)
    graphics.fill()
    
    graphics.generateTexture('sparkle', 8, 8)
    graphics.destroy()
  }

  createBackgroundParticles() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    this.backgroundParticles = this.scene.add.particles(0, 0, 'sparkle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 5, max: 20 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.2, end: 0.5 },
      alpha: { start: 0, end: 0.6 },
      lifespan: { min: 2000, max: 4000 },
      frequency: 200,
      tint: this.theme.bgTints,
      quantity: 1,
      blendMode: 'ADD'
    })
    
    this.backgroundParticles.setDepth(-100)
    this.particleSystems.push(this.backgroundParticles)
  }

  createAmbientGlow() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    const glow = this.scene.add.graphics()
    glow.fillGradientStyle(this.theme.ambientGlow, this.theme.ambientGlow, 0x0f172a, 0x0f172a, 0.3)
    glow.fillRect(0, 0, width, height)
    glow.setDepth(-200)
    this.ambientGlow = glow
    
    const vignette = this.scene.add.graphics()
    const radius = Math.min(width, height) * 0.6
    
    vignette.fillStyle(0x000000, 0.5)
    vignette.fillRect(0, 0, width, height)
    
    const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false })
    maskShape.fillStyle(0xffffff, 1)
    maskShape.beginPath()
    maskShape.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
    maskShape.fill()
    
    const mask = maskShape.createGeometryMask()
    mask.invertAlpha = true
    vignette.setMask(mask)
    vignette.setDepth(-150)
    this.vignette = vignette
  }

  createSuccessEffect(x, y, color = 0x22c55e) {
    const particles = this.scene.add.particles(x, y, 'sparkle', {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 500, max: 1000 },
      tint: color,
      quantity: 30,
      duration: 500,
      blendMode: 'ADD'
    })
    
    this.particleSystems.push(particles)
    
    const ring = this.scene.add.circle(x, y, 10, color, 0)
    ring.setStrokeStyle(3, color, 0.8)
    
    this.scene.tweens.add({
      targets: ring,
      radius: { from: 10, to: 100 },
      alpha: { from: 0.8, to: 0 },
      duration: 600,
      ease: 'Cubic.out',
      onComplete: () => ring.destroy()
    })
  }

  createFailureEffect(x, y) {
    const particles = this.scene.add.particles(x, y, 'sparkle', {
      speed: { min: 30, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      tint: 0xef4444,
      quantity: 20,
      duration: 300,
      blendMode: 'ADD'
    })
    
    this.particleSystems.push(particles)
  }

  createCreatureSprite(x, y) {
    const creatureColors = this.themeManager.getCreatureColors()
    const creature = this.scene.add.container(x, y)
    
    const body = this.scene.add.ellipse(0, 0, 25, 20, creatureColors.body, 0.9)
    body.setStrokeStyle(2, creatureColors.bodyStroke, 1)
    creature.add(body)
    
    const eye1 = this.scene.add.circle(-6, -3, 5, 0xffffff, 1)
    const eye2 = this.scene.add.circle(6, -3, 5, 0xffffff, 1)
    creature.add(eye1, eye2)
    
    const pupil1 = this.scene.add.circle(-5, -3, 2, 0x1e293b, 1)
    const pupil2 = this.scene.add.circle(7, -3, 2, 0x1e293b, 1)
    creature.add(pupil1, pupil2)
    
    const antenna1 = this.scene.add.line(-10, -10, 0, 0, -8, -12, creatureColors.body, 1)
    const antenna2 = this.scene.add.line(10, -10, 0, 0, 8, -12, creatureColors.body, 1)
    antenna1.setLineWidth(2)
    antenna2.setLineWidth(2)
    creature.add(antenna1, antenna2)
    
    const glow = this.scene.add.circle(0, 0, 35, creatureColors.glow, 0.1)
    creature.addAt(glow, 0)
    
    creature.glow = glow
    creature.body = body
    creature.antenna1 = antenna1
    creature.antenna2 = antenna2
    creature.colors = creatureColors
    
    this.scene.tweens.add({
      targets: creature,
      y: '-=5',
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.3 },
      scale: { from: 0.9, to: 1.1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    this.creatures.push(creature)
    
    return creature
  }

  animateCreatureAlongPath(creature, path, onComplete) {
    if (path.length < 2) {
      if (onComplete) onComplete()
      return
    }
    
    const positions = path.map(cell => {
      const pos = this.levelMap.getWorldPosition(cell.row, cell.col)
      return pos
    })
    
    const timeline = this.scene.tweens.createTimeline()
    
    for (let i = 1; i < positions.length; i++) {
      const prevPos = positions[i - 1]
      const currPos = positions[i]
      
      const angle = Math.atan2(currPos.y - prevPos.y, currPos.x - prevPos.x)
      const rotation = angle + Math.PI / 2
      
      timeline.add({
        targets: creature,
        x: currPos.x,
        y: currPos.y,
        angle: rotation,
        duration: 400,
        ease: 'Linear.None',
        onStart: () => {
          this.createTrailEffect(currPos.x, currPos.y)
        }
      })
    }
    
    timeline.setCallback('onComplete', () => {
      if (onComplete) onComplete()
    })
    
    timeline.play()
  }

  createTrailEffect(x, y) {
    const creatureColors = this.themeManager.getCreatureColors()
    const trail = this.scene.add.particles(x, y, 'sparkle', {
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      tint: creatureColors.glow,
      quantity: 5,
      duration: 100
    })
    
    this.particleSystems.push(trail)
  }

  createLevelTransition(onComplete) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    const overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0
    )
    overlay.setDepth(1000)
    
    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.In',
      onComplete: () => {
        if (onComplete) onComplete()
        
        this.scene.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 500,
          ease: 'Cubic.Out',
          delay: 300,
          onComplete: () => overlay.destroy()
        })
      }
    })
  }

  createTextPopup(x, y, text, color = '#ffffff', duration = 1500) {
    const textObj = this.scene.add.text(x, y, text, {
      fontSize: '24px',
      fill: color,
      fontStyle: 'bold'
    })
    textObj.setOrigin(0.5)
    textObj.setDepth(200)
    
    this.scene.tweens.add({
      targets: textObj,
      y: '-=50',
      alpha: { from: 1, to: 0 },
      duration: duration,
      ease: 'Cubic.Out',
      onComplete: () => textObj.destroy()
    })
    
    return textObj
  }

  applyTheme(theme) {
    const particleTheme = theme.particles
    const creatureTheme = theme.creature
    
    this.theme = {
      ...this.theme,
      bgTints: particleTheme.bgTints,
      ambientGlow: particleTheme.ambientGlow
    }
    
    if (this.backgroundParticles) {
      this.backgroundParticles.setTint(particleTheme.bgTints)
    }
    
    if (this.ambientGlow) {
      const width = this.scene.game.config.width
      const height = this.scene.game.config.height
      this.ambientGlow.clear()
      this.ambientGlow.fillGradientStyle(
        particleTheme.ambientGlow, particleTheme.ambientGlow, 
        0x0f172a, 0x0f172a, 0.3
      )
      this.ambientGlow.fillRect(0, 0, width, height)
    }
    
    this.creatures.forEach(creature => {
      if (creature.body) {
        creature.body.setFillStyle(creatureTheme.body, 0.9)
        creature.body.setStrokeStyle(2, creatureTheme.bodyStroke, 1)
      }
      if (creature.glow) {
        creature.glow.setFillStyle(creatureTheme.glow, creature.glow.alpha)
      }
      if (creature.antenna1) {
        creature.antenna1.setStrokeStyle(2, creatureTheme.body, 1)
      }
      if (creature.antenna2) {
        creature.antenna2.setStrokeStyle(2, creatureTheme.body, 1)
      }
      creature.colors = creatureTheme
    })
    
    this.playThemeSwitchEffect()
  }

  playThemeSwitchEffect() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    for (let i = 0; i < 15; i++) {
      this.scene.time.delayedCall(i * 40, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = this.theme.bgTints[Math.floor(Math.random() * this.theme.bgTints.length)]
        
        this.scene.add.particles(x, y, 'sparkle', {
          speed: { min: 60, max: 180 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 500, max: 1000 },
          tint: color,
          quantity: 8,
          duration: 300,
          blendMode: 'ADD'
        })
      })
    }
  }

  setLevelMap(levelMap) {
    this.levelMap = levelMap
  }

  destroy() {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe()
    }
    this.particleSystems.forEach(ps => {
      if (ps && ps.destroy) ps.destroy()
    })
    this.particleSystems = []
    this.creatures = []
  }
}
