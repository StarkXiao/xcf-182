import { ThemeManager } from './ThemeManager.js'

const TUTORIAL_KEY = 'moss_cave_tutorial_completed'

export class Tutorial {
  constructor(scene, levelMap, pathJudge, plantState, effects) {
    this.scene = scene
    this.levelMap = levelMap
    this.pathJudge = pathJudge
    this.plantState = plantState
    this.effects = effects
    
    this.themeManager = ThemeManager.getInstance()
    
    this.currentStep = 0
    this.isRunning = false
    this.isCompleted = false
    this.onComplete = null
    
    this.overlay = null
    this.highlightRect = null
    this.tipPanel = null
    this.tipText = null
    this.highlightElements = []
    
    this.demoPath = []
    this.demoGraphics = null
    this.demoFinger = null
    
    this.steps = [
      {
        id: 'welcome',
        title: '🌟 欢迎来到苔藓洞穴',
        content: '你将扮演一位引路人，帮助迷路的小生物找到回家的路。让我来教你怎么玩！',
        highlight: null,
        position: 'center',
        autoNext: true,
        delay: 3000
      },
      {
        id: 'start',
        title: '🟢 起点',
        content: '这是起点，绿色标记的位置。你需要从这里开始，按住鼠标或手指拖动。',
        highlight: 'start',
        position: 'bottom',
        autoNext: true,
        delay: 3500
      },
      {
        id: 'obstacle',
        title: '🪨 障碍物',
        content: '这些灰色的岩石是障碍物，你的路径不能穿过它们，要绕道而行。',
        highlight: 'obstacle',
        position: 'bottom',
        autoNext: true,
        delay: 3500
      },
      {
        id: 'plant',
        title: '🌿 荧光植物',
        content: '沿途经过这些植物时，它们会被点亮。点亮越多植物，得分越高！',
        highlight: 'plant',
        position: 'bottom',
        autoNext: true,
        delay: 4000
      },
      {
        id: 'end',
        title: '🟣 终点',
        content: '这是终点，紫色标记的位置。你需要把路径一直画到这里才能过关。',
        highlight: 'end',
        position: 'bottom',
        autoNext: true,
        delay: 3500
      },
      {
        id: 'demo',
        title: '👆 看我演示',
        content: '现在看我完整演示一遍：从起点拖动到终点，经过所有植物！',
        highlight: null,
        position: 'top',
        autoNext: false,
        action: 'demo'
      },
      {
        id: 'try',
        title: '🎯 轮到你了',
        content: '太棒了！现在轮到你试试了。记住：从绿色起点拖动到紫色终点！',
        highlight: null,
        position: 'center',
        autoNext: false,
        action: 'enableInput'
      }
    ]
  }

  static shouldShowTutorial() {
    try {
      return localStorage.getItem(TUTORIAL_KEY) !== 'true'
    } catch (e) {
      return true
    }
  }

  static markTutorialCompleted() {
    try {
      localStorage.setItem(TUTORIAL_KEY, 'true')
    } catch (e) {
      console.warn('Failed to save tutorial state:', e)
    }
  }

  static resetTutorial() {
    try {
      localStorage.removeItem(TUTORIAL_KEY)
    } catch (e) {
      console.warn('Failed to reset tutorial state:', e)
    }
  }

  start(onComplete) {
    if (this.isRunning) return
    
    this.onComplete = onComplete
    this.isRunning = true
    this.currentStep = 0
    this.isCompleted = false
    
    this.blockInput()
    this.createOverlay()
    this.showStep(0)
  }

  blockInput() {
    if (this.pathJudge) {
      this.pathJudge.removeInputHandlers()
    }
  }

  unblockInput() {
    if (this.pathJudge) {
      this.pathJudge.setupInputHandlers()
    }
  }

  createOverlay() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    this.overlay = this.scene.add.container(0, 0)
    this.overlay.setDepth(800)
    
    const overlayBg = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.7
    )
    overlayBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains)
    this.overlay.add(overlayBg)
    
    this.highlightRect = this.scene.add.graphics()
    this.highlightRect.setDepth(801)
    this.overlay.add(this.highlightRect)
  }

  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.completeTutorial()
      return
    }
    
    this.currentStep = stepIndex
    const step = this.steps[stepIndex]
    
    this.clearHighlights()
    this.hideTipPanel()
    
    if (step.highlight) {
      this.showHighlight(step.highlight)
    }
    
    if (step.action === 'demo') {
      this.startDemo()
    } else if (step.action === 'enableInput') {
      this.unblockInput()
    }
    
    this.showTipPanel(step, () => {
      if (step.autoNext && step.delay) {
        this.scene.time.delayedCall(step.delay, () => {
          this.nextStep()
        })
      }
    })
  }

  showHighlight(type) {
    this.highlightRect.clear()
    
    const level = this.levelMap.currentLevel
    if (!level) return
    
    const highlightColor = 0xfbbf24
    const highlightAlpha = 0.4
    
    if (type === 'start') {
      this.highlightCell(level.start.row, level.start.col, highlightColor, highlightAlpha)
      this.pulseHighlight(level.start.row, level.start.col, highlightColor)
    } else if (type === 'end') {
      this.highlightCell(level.end.row, level.end.col, 0xa78bfa, highlightAlpha)
      this.pulseHighlight(level.end.row, level.end.col, 0xa78bfa)
    } else if (type === 'obstacle') {
      level.obstacles.forEach(obs => {
        this.highlightCell(obs.row, obs.col, 0xef4444, highlightAlpha * 0.6)
      })
      if (level.obstacles.length > 0) {
        const firstObs = level.obstacles[0]
        this.pulseHighlight(firstObs.row, firstObs.col, 0xef4444)
      }
    } else if (type === 'plant') {
      level.plants.forEach(plant => {
        const cell = this.levelMap.getCellAt(plant.row, plant.col)
        if (cell && cell.plantSprite) {
          this.plantState.pulsePlant(cell.plantSprite)
          this.highlightElements.push(cell.plantSprite)
        }
        this.highlightCell(plant.row, plant.col, 0x22c55e, highlightAlpha * 0.5)
      })
      if (level.plants.length > 0) {
        const firstPlant = level.plants[0]
        this.pulseHighlight(firstPlant.row, firstPlant.col, 0x22c55e)
      }
    }
  }

  highlightCell(row, col, color, alpha) {
    const pos = this.levelMap.getWorldPosition(row, col)
    const size = this.levelMap.cellSize
    
    this.highlightRect.fillStyle(color, alpha)
    this.highlightRect.strokeStyle(color, 0.9)
    this.highlightRect.lineStyle(3, color, 0.9)
    
    this.highlightRect.beginPath()
    this.highlightRect.arc(pos.x, pos.y, size * 0.45, 0, Math.PI * 2)
    this.highlightRect.fillPath()
    this.highlightRect.strokePath()
    
    const rect = this.scene.add.rectangle(
      pos.x, pos.y,
      size, size,
      color, 0
    )
    rect.setStrokeStyle(3, color, 0.8)
    rect.setDepth(802)
    this.highlightElements.push(rect)
    
    this.scene.tweens.add({
      targets: rect,
      scale: { from: 0.8, to: 1.05 },
      alpha: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
  }

  pulseHighlight(row, col, color) {
    const pos = this.levelMap.getWorldPosition(row, col)
    
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 600, () => {
        const pulse = this.scene.add.circle(pos.x, pos.y, 10, color, 0)
        pulse.setStrokeStyle(2, color, 0.8)
        pulse.setDepth(803)
        this.highlightElements.push(pulse)
        
        this.scene.tweens.add({
          targets: pulse,
          scale: { from: 0.5, to: 2.5 },
          alpha: { from: 1, to: 0 },
          duration: 800,
          ease: 'Cubic.out',
          onComplete: () => pulse.destroy()
        })
      })
    }
  }

  clearHighlights() {
    this.highlightRect.clear()
    this.highlightElements.forEach(el => {
      if (el && el.destroy) el.destroy()
    })
    this.highlightElements = []
    
    if (this.plantState) {
      this.plantState.stopAllPulses()
    }
  }

  showTipPanel(step, onShowComplete) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    this.tipPanel = this.scene.add.container(0, 0)
    this.tipPanel.setDepth(810)
    
    const panelWidth = Math.min(500, width - 60)
    const panelHeight = 160
    
    let panelY
    if (step.position === 'top') {
      panelY = 120
    } else if (step.position === 'bottom') {
      panelY = height - 120
    } else {
      panelY = height / 2
    }
    
    const bg = this.scene.add.rectangle(
      width / 2, panelY,
      panelWidth, panelHeight,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.9)
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, panelWidth, panelHeight), Phaser.Geom.Rectangle.Contains)
    bg.on('pointerdown', () => {
      if (step.autoNext && step.action !== 'demo') {
        this.nextStep()
      }
    })
    this.tipPanel.add(bg)
    
    const title = this.scene.add.text(
      width / 2, panelY - panelHeight / 2 + 30,
      step.title,
      {
        fontSize: '22px',
        fill: '#fbbf24',
        fontStyle: 'bold'
      }
    )
    title.setOrigin(0.5)
    this.tipPanel.add(title)
    
    this.tipText = this.scene.add.text(
      width / 2, panelY + 10,
      step.content,
      {
        fontSize: '16px',
        fill: '#e2e8f0',
        align: 'center',
        wordWrap: { width: panelWidth - 60 }
      }
    )
    this.tipText.setOrigin(0.5)
    this.tipPanel.add(this.tipText)
    
    if (!step.autoNext || step.action === 'demo') {
      const nextBtn = this.scene.add.text(
        width / 2 + panelWidth / 2 - 60, panelY + panelHeight / 2 - 25,
        step.action === 'demo' ? '跳过演示 →' : '我知道了 →',
        {
          fontSize: '15px',
          fill: '#60a5fa',
          fontStyle: 'bold'
        }
      )
      nextBtn.setOrigin(1, 0.5)
      nextBtn.setInteractive({ useHandCursor: true })
      nextBtn.on('pointerdown', () => this.nextStep())
      nextBtn.on('pointerover', () => nextBtn.setFill('#93c5fd'))
      nextBtn.on('pointerout', () => nextBtn.setFill('#60a5fa'))
      this.tipPanel.add(nextBtn)
    }
    
    const skipBtn = this.scene.add.text(
      width / 2 - panelWidth / 2 + 60, panelY + panelHeight / 2 - 25,
      '跳过引导',
      {
        fontSize: '14px',
        fill: '#6b7280'
      }
    )
    skipBtn.setOrigin(0, 0.5)
    skipBtn.setInteractive({ useHandCursor: true })
    skipBtn.on('pointerdown', () => this.completeTutorial())
    skipBtn.on('pointerover', () => skipBtn.setFill('#9ca3af'))
    skipBtn.on('pointerout', () => skipBtn.setFill('#6b7280'))
    this.tipPanel.add(skipBtn)
    
    const progress = this.scene.add.text(
      width / 2, panelY + panelHeight / 2 - 25,
      `${this.currentStep + 1} / ${this.steps.length}`,
      {
        fontSize: '13px',
        fill: '#9ca3af'
      }
    )
    progress.setOrigin(0.5)
    this.tipPanel.add(progress)
    
    this.tipPanel.setAlpha(0)
    this.tipPanel.setScale(0.8)
    this.scene.tweens.add({
      targets: this.tipPanel,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.out',
      onComplete: () => {
        if (onShowComplete) {
          onShowComplete()
        }
      }
    })
  }

  hideTipPanel() {
    if (this.tipPanel) {
      this.scene.tweens.add({
        targets: this.tipPanel,
        alpha: 0,
        scale: 0.8,
        duration: 200,
        ease: 'Cubic.in',
        onComplete: () => {
          if (this.tipPanel) {
            this.tipPanel.destroy()
            this.tipPanel = null
          }
        }
      })
    }
  }

  nextStep() {
    this.showStep(this.currentStep + 1)
  }

  startDemo() {
    const level = this.levelMap.currentLevel
    if (!level || !level.correctPath) {
      this.nextStep()
      return
    }
    
    this.demoPath = [...level.correctPath]
    
    if (this.demoGraphics) {
      this.demoGraphics.destroy()
    }
    this.demoGraphics = this.scene.add.graphics()
    this.demoGraphics.setDepth(850)
    this.overlay.add(this.demoGraphics)
    
    const startPos = this.levelMap.getWorldPosition(
      this.demoPath[0].row,
      this.demoPath[0].col
    )
    
    this.demoFinger = this.scene.add.container(startPos.x, startPos.y)
    this.demoFinger.setDepth(860)
    this.overlay.add(this.demoFinger)
    
    const fingerCircle = this.scene.add.circle(0, 0, 25, 0xffffff, 0.2)
    fingerCircle.setStrokeStyle(3, 0xffffff, 0.8)
    this.demoFinger.add(fingerCircle)
    
    const fingerInner = this.scene.add.circle(0, 0, 12, 0xffffff, 0.6)
    this.demoFinger.add(fingerInner)
    
    this.scene.tweens.add({
      targets: fingerCircle,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.3, to: 0.6 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    this.animateDemoPath()
  }

  animateDemoPath() {
    if (this.demoPath.length < 2) {
      this.nextStep()
      return
    }
    
    const timeline = this.scene.tweens.createTimeline()
    
    for (let i = 1; i < this.demoPath.length; i++) {
      const fromPos = this.levelMap.getWorldPosition(
        this.demoPath[i - 1].row,
        this.demoPath[i - 1].col
      )
      const toPos = this.levelMap.getWorldPosition(
        this.demoPath[i].row,
        this.demoPath[i].col
      )
      
      timeline.add({
        targets: this.demoFinger,
        x: toPos.x,
        y: toPos.y,
        duration: 500,
        ease: 'Cubic.inOut',
        onStart: () => {
          this.drawDemoLine(fromPos, toPos)
          this.highlightDemoCell(this.demoPath[i])
          this.lightUpDemoPlant(this.demoPath[i])
        }
      })
    }
    
    timeline.setCallback('onComplete', () => {
      this.scene.time.delayedCall(800, () => {
        this.clearDemo()
        this.nextStep()
      })
    })
    
    timeline.play()
  }

  drawDemoLine(from, to) {
    if (!this.demoGraphics) return
    
    this.demoGraphics.lineStyle(6, 0xfbbf24, 0.9)
    this.demoGraphics.beginPath()
    this.demoGraphics.moveTo(from.x, from.y)
    this.demoGraphics.lineTo(to.x, to.y)
    this.demoGraphics.strokePath()
    
    this.demoGraphics.lineStyle(3, 0xfef3c7, 0.7)
    this.demoGraphics.beginPath()
    this.demoGraphics.moveTo(from.x, from.y)
    this.demoGraphics.lineTo(to.x, to.y)
    this.demoGraphics.strokePath()
  }

  highlightDemoCell(pathPoint) {
    const pos = this.levelMap.getWorldPosition(pathPoint.row, pathPoint.col)
    
    const highlight = this.scene.add.circle(pos.x, pos.y, 20, 0xfbbf24, 0.3)
    highlight.setStrokeStyle(2, 0xfbbf24, 0.8)
    highlight.setDepth(849)
    this.highlightElements.push(highlight)
    
    this.scene.tweens.add({
      targets: highlight,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0.8, to: 0.4 },
      duration: 300,
      ease: 'Cubic.out'
    })
    
    const burst = this.scene.add.particles(pos.x, pos.y, 'sparkle', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: 0xfbbf24,
      quantity: 8,
      duration: 200
    })
    burst.setDepth(851)
    this.overlay.add(burst)
  }

  lightUpDemoPlant(pathPoint) {
    const cell = this.levelMap.getCellAt(pathPoint.row, pathPoint.col)
    if (cell && cell.plant && cell.plantSprite) {
      this.plantState.lightUp(cell.plantSprite)
      this.plantState.pulsePlant(cell.plantSprite)
    }
  }

  clearDemo() {
    if (this.demoFinger) {
      this.demoFinger.destroy()
      this.demoFinger = null
    }
    if (this.demoGraphics) {
      this.demoGraphics.destroy()
      this.demoGraphics = null
    }
    if (this.plantState) {
      this.plantState.resetAll()
    }
  }

  completeTutorial() {
    this.isRunning = false
    this.isCompleted = true
    
    Tutorial.markTutorialCompleted()
    
    this.unblockInput()
    this.clearHighlights()
    this.clearDemo()
    this.hideTipPanel()
    
    if (this.overlay) {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.in',
        onComplete: () => {
          if (this.overlay) {
            this.overlay.destroy()
            this.overlay = null
          }
        }
      })
    }
    
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 40, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0x22c55e, 0x60a5fa, 0xa78bfa, 0xf472b6][Math.floor(Math.random() * 5)]
        
        const burst = this.scene.add.particles(x, y, 'sparkle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 800,
          tint: color,
          quantity: 10,
          duration: 300
        })
        burst.setDepth(900)
      })
    }
    
    if (this.onComplete) {
      this.onComplete()
    }
  }

  destroy() {
    this.unblockInput()
    this.clearHighlights()
    this.clearDemo()
    
    if (this.tipPanel) {
      this.tipPanel.destroy()
      this.tipPanel = null
    }
    if (this.overlay) {
      this.overlay.destroy()
      this.overlay = null
    }
    if (this.highlightRect) {
      this.highlightRect.destroy()
      this.highlightRect = null
    }
  }
}
