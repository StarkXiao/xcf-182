import { LEVELS } from '../data/levels.js'
import { ThemeManager } from './ThemeManager.js'
import { getLeaderboardService } from './LeaderboardService.js'

export class HintPanel {
  constructor(scene) {
    this.scene = scene
    this.panel = null
    this.hintText = null
    this.levelInfo = null
    this.scoreText = null
    this.attemptsText = null
    this.timerText = null
    this.isVisible = false
    this.attempts = 0
    this.score = 0
    this.currentTime = 0
    this.isDailyChallengeMode = false
    this.isStoryMode = false
    this.isRandomMode = false
    this.isWorkshopMode = false
    this.currentRandomLevel = null
    this.currentWorkshopLevel = null
    this.randomButtons = []
    this.themePanel = null
    this.themeButtons = []
    this.leaderboardService = null
    this.onUndo = null
    this.onRedo = null
    this.undoBtn = null
    this.redoBtn = null
    this.stepsText = null
    this.steps = 0
    
    this.themeManager = ThemeManager.getInstance()
    this.themeManager.loadThemeFromStorage()
  }

  setDailyChallengeMode(enabled) {
    this.isDailyChallengeMode = enabled
    if (enabled) this.isRandomMode = false
  }

  setStoryMode(enabled) {
    this.isStoryMode = enabled
    if (enabled) this.isRandomMode = false
  }

  setRandomMode(enabled, level = null) {
    this.isRandomMode = enabled
    this.currentRandomLevel = level
    if (enabled) {
      this.isDailyChallengeMode = false
      this.isStoryMode = false
      this.isWorkshopMode = false
    }
  }

  setWorkshopMode(enabled, level = null) {
    this.isWorkshopMode = enabled
    this.currentWorkshopLevel = level
    if (enabled) {
      this.isDailyChallengeMode = false
      this.isStoryMode = false
      this.isRandomMode = false
    }
  }

  init(preserveScore = false) {
    this.attempts = 0
    this.currentTime = 0
    this.steps = 0
    if (!preserveScore) {
      this.score = 0
    }
    this.leaderboardService = getLeaderboardService()
    this.createTopBar()
    this.createHintPanel()
    this.createControlButtons()
    this.createThemePanel()
    this.updateScoreDisplay()
    this.updateTimer(0)
    this.updateSteps(0)
  }

  updateScoreDisplay() {
    if (this.scoreText) {
      this.scoreText.setText(`⭐ ${this.score} 分`)
    }
    if (this.attemptsText) {
      this.attemptsText.setText(`尝试: ${this.attempts} 次`)
    }
  }

  createTopBar() {
    const width = this.scene.game.config.width
    
    const topBar = this.scene.add.rectangle(
      width / 2, 35,
      width, 70,
      0x0d1117, 0.9
    )
    topBar.setStrokeStyle(1, 0x1e3a5f, 0.8)
    topBar.setDepth(100)
    
    this.levelInfo = this.scene.add.text(20, 35, '', {
      fontSize: '18px',
      fill: '#60a5fa',
      fontStyle: 'bold'
    })
    this.levelInfo.setOrigin(0, 0.5)
    this.levelInfo.setDepth(101)
    
    this.scoreText = this.scene.add.text(width - 200, 25, '', {
      fontSize: '16px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    this.scoreText.setOrigin(1, 0.5)
    this.scoreText.setDepth(101)
    
    this.attemptsText = this.scene.add.text(width - 200, 50, '', {
      fontSize: '14px',
      fill: '#9ca3af'
    })
    this.attemptsText.setOrigin(1, 0.5)
    this.attemptsText.setDepth(101)
    
    this.timerText = this.scene.add.text(width / 2, 25, '⏱ 00:00.00', {
      fontSize: '16px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    this.timerText.setOrigin(0.5, 0.5)
    this.timerText.setDepth(101)
    
    this.stepsText = this.scene.add.text(width / 2, 50, '👣 步数: 0', {
      fontSize: '14px',
      fill: '#f472b6',
      fontStyle: 'bold'
    })
    this.stepsText.setOrigin(0.5, 0.5)
    this.stepsText.setDepth(101)
    
    const currentTheme = this.themeManager.getCurrentTheme()
    const btnX = width - 40
    const btnY = 35
    const btnW = 60
    const btnH = 44
    
    const themeBtnBg = this.scene.add.rectangle(btnX, btnY, btnW, btnH, 0x1e1b4b, 0.95)
    themeBtnBg.setStrokeStyle(3, 0xa78bfa, 0.9)
    themeBtnBg.setDepth(200)
    themeBtnBg.setInteractive(new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains)
    themeBtnBg.input.cursor = 'pointer'
    console.log('Theme button created at', btnX, btnY, 'size:', btnW, btnH)
    
    const themeBtn = this.scene.add.text(btnX, btnY, `🎨 ${currentTheme.icon}`, {
      fontSize: '18px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    themeBtn.setOrigin(0.5, 0.5)
    themeBtn.setDepth(201)
    
    themeBtnBg.on('pointerdown', (pointer) => {
      console.log('Theme button clicked! pointer:', pointer.x, pointer.y)
      this.toggleThemePanel()
    })
    
    themeBtnBg.on('pointerover', () => {
      console.log('Theme button pointerover')
      themeBtnBg.setFillStyle(0x3b0764, 0.95)
    })
    themeBtnBg.on('pointerout', () => {
      themeBtnBg.setFillStyle(0x1e1b4b, 0.95)
    })
    
    this.themeToggleBtn = themeBtn
    this.themeToggleBtnBg = themeBtnBg
  }

  createThemePanel() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    this.themePanel = this.scene.add.container(0, 0)
    this.themePanel.setDepth(500)
    this.themePanel.setVisible(false)
    
    const panelWidth = 320
    const panelHeight = 340
    
    const panelX = width - panelWidth / 2 - 20
    const panelY = 120
    
    const bg = this.scene.add.rectangle(
      panelX, panelY,
      panelWidth, panelHeight,
      0x0d1117, 0.98
    )
    bg.setStrokeStyle(2, 0xa78bfa, 0.9)
    this.themePanel.add(bg)
    
    const title = this.scene.add.text(panelX, panelY - panelHeight / 2 + 25, '🎨 选择主题', {
      fontSize: '20px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5, 0.5)
    this.themePanel.add(title)
    
    const subtitle = this.scene.add.text(panelX, panelY - panelHeight / 2 + 50, '切换洞穴风格主题', {
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
      
      const btnBg = this.scene.add.rectangle(
        panelX, btnY,
        btnWidth, btnHeight,
        theme.grid.cell, 0.8
      )
      btnBg.setStrokeStyle(2, theme.grid.cellStroke, 0.8)
      btnBg.setInteractive(new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains)
      if (btnBg.input) btnBg.input.cursor = 'pointer'
      this.themePanel.add(btnBg)
      
      const iconText = this.scene.add.text(panelX - btnWidth / 2 + 25, btnY, theme.icon, {
        fontSize: '22px'
      })
      iconText.setOrigin(0, 0.5)
      this.themePanel.add(iconText)
      
      const nameText = this.scene.add.text(panelX - btnWidth / 2 + 60, btnY - 8, theme.name, {
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
        const dot = this.scene.add.circle(
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
        const check = this.scene.add.text(panelX + btnWidth / 2 - 25, btnY, '✓', {
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
    
    const tipText = this.scene.add.text(panelX, panelY + panelHeight / 2 - 20, '主题切换后所有元素将实时更新', {
      fontSize: '11px',
      fill: '#64748b'
    })
    tipText.setOrigin(0.5, 0.5)
    this.themePanel.add(tipText)
    
    const closeTarget = this.scene.add.rectangle(
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
        this.themeToggleBtn.setText(`🎨 ${newTheme.icon}`)
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
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    const currentTheme = this.themeManager.getCurrentTheme()
    
    for (let i = 0; i < 25; i++) {
      this.scene.time.delayedCall(i * 30, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const colors = Object.values(currentTheme.plants).map(p => p.glowColor)
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        this.scene.add.particles(x, y, 'sparkle', {
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
    if (!this.themePanel) {
      console.log('toggleThemePanel: themePanel is null')
      return
    }
    console.log('toggleThemePanel: visible =', this.themePanel.visible)
    if (this.themePanel.visible) {
      this.hideThemePanel()
    } else {
      this.showThemePanel()
    }
  }

  showThemePanel() {
    if (!this.themePanel) {
      console.log('showThemePanel: themePanel is null')
      return
    }
    console.log('showThemePanel: showing')
    
    this.themePanelCloseMask.setVisible(true)
    this.themePanel.setVisible(true)
    this.themePanel.setAlpha(0)
    this.themePanel.setScale(0.8)
    
    this.scene.tweens.add({
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
    
    this.scene.tweens.add({
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

  createHintPanel() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    this.panel = this.scene.add.container(0, 0)
    this.panel.setDepth(200)
    this.panel.setVisible(false)
    
    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.8, 200,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(2, 0x3b82f6, 0.8)
    bg.setScrollFactor(0)
    this.panel.add(bg)
    
    const title = this.scene.add.text(width / 2, height / 2 - 60, '💡 提示', {
      fontSize: '20px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    title.setScrollFactor(0)
    this.panel.add(title)
    
    this.hintText = this.scene.add.text(width / 2, height / 2, '', {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center',
      wordWrap: { width: width * 0.7 }
    })
    this.hintText.setOrigin(0.5)
    this.hintText.setScrollFactor(0)
    this.panel.add(this.hintText)
    
    const closeBtn = this.scene.add.text(width / 2, height / 2 + 60, '知道了', {
      fontSize: '16px',
      fill: '#60a5fa',
      fontStyle: 'bold'
    })
    closeBtn.setOrigin(0.5)
    closeBtn.setScrollFactor(0)
    closeBtn.setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.hide())
    
    closeBtn.on('pointerover', () => {
      closeBtn.setFill('#93c5fd')
    })
    closeBtn.on('pointerout', () => {
      closeBtn.setFill('#60a5fa')
    })
    
    this.panel.add(closeBtn)
  }

  createControlButtons() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    this.randomButtons.forEach(b => b.destroy())
    this.randomButtons = []
    
    const undoBtn = this.scene.add.text(width - 220, height - 40, '↩ 撤回', {
      fontSize: '16px',
      fill: '#9ca3af',
      fontStyle: 'bold',
      backgroundColor: '#1e293b',
      padding: { x: 12, y: 8 }
    })
    undoBtn.setOrigin(1, 0.5)
    undoBtn.setDepth(101)
    undoBtn.setInteractive({ useHandCursor: true })
    
    undoBtn.on('pointerdown', () => {
      if (this.onUndo) {
        this.onUndo()
      }
    })
    
    undoBtn.on('pointerover', () => {
      undoBtn.setBackgroundColor('#334155')
    })
    undoBtn.on('pointerout', () => {
      undoBtn.setBackgroundColor('#1e293b')
    })
    
    this.randomButtons.push(undoBtn)
    this.undoBtn = undoBtn
    
    const redoBtn = this.scene.add.text(width - 160, height - 40, '↪ 重做', {
      fontSize: '16px',
      fill: '#9ca3af',
      fontStyle: 'bold',
      backgroundColor: '#1e293b',
      padding: { x: 12, y: 8 }
    })
    redoBtn.setOrigin(1, 0.5)
    redoBtn.setDepth(101)
    redoBtn.setInteractive({ useHandCursor: true })
    
    redoBtn.on('pointerdown', () => {
      if (this.onRedo) {
        this.onRedo()
      }
    })
    
    redoBtn.on('pointerover', () => {
      redoBtn.setBackgroundColor('#334155')
    })
    redoBtn.on('pointerout', () => {
      redoBtn.setBackgroundColor('#1e293b')
    })
    
    this.randomButtons.push(redoBtn)
    this.redoBtn = redoBtn
    
    const hintBtn = this.scene.add.text(width - 100, height - 40, '💡 提示', {
      fontSize: '16px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 15, y: 8 }
    })
    hintBtn.setOrigin(1, 0.5)
    hintBtn.setDepth(101)
    hintBtn.setInteractive({ useHandCursor: true })
    
    hintBtn.on('pointerdown', () => {
      this.showHint()
    })
    
    hintBtn.on('pointerover', () => {
      hintBtn.setBackgroundColor('#2563eb')
    })
    hintBtn.on('pointerout', () => {
      hintBtn.setBackgroundColor('#1e3a5f')
    })
    
    this.randomButtons.push(hintBtn)
    
    if (this.isRandomMode) {
      const diffLabels = ['入门', '简单', '普通', '困难', '专家']
      const diffColors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']
      const diffBg = ['#14532d', '#3f6212', '#713f12', '#7c2d12', '#7f1d1d']
      const diffHover = ['#166534', '#4d7c0f', '#854d0e', '#9a3412', '#991b1b']
      
      const btnWidth = 70
      const startX = width / 2 - (btnWidth * 5 + 20) / 2
      
      for (let i = 0; i < 5; i++) {
        const diffBtn = this.scene.add.text(
          startX + i * (btnWidth + 5),
          height - 40,
          diffLabels[i],
          {
            fontSize: '13px',
            fill: diffColors[i],
            fontStyle: 'bold',
            backgroundColor: diffBg[i],
            padding: { x: 10, y: 8 }
          }
        )
        diffBtn.setOrigin(0, 0.5)
        diffBtn.setDepth(101)
        diffBtn.setInteractive({ useHandCursor: true })
        
        const diff = i + 1
        diffBtn.on('pointerdown', () => {
          if (this.onNextRandom) {
            this.onNextRandom(diff)
          }
        })
        
        diffBtn.on('pointerover', () => {
          diffBtn.setBackgroundColor(diffHover[i])
        })
        diffBtn.on('pointerout', () => {
          diffBtn.setBackgroundColor(diffBg[i])
        })
        
        this.randomButtons.push(diffBtn)
      }
      
      const nextBtn = this.scene.add.text(100, height - 40, '🎲 新关卡', {
        fontSize: '16px',
        fill: '#60a5fa',
        fontStyle: 'bold',
        backgroundColor: '#1e3a5f',
        padding: { x: 15, y: 8 }
      })
      nextBtn.setOrigin(0, 0.5)
      nextBtn.setDepth(101)
      nextBtn.setInteractive({ useHandCursor: true })
      
      nextBtn.on('pointerdown', () => {
        if (this.onNextRandom) {
          const curDiff = this.currentRandomLevel?.difficulty || 3
          this.onNextRandom(curDiff)
        }
      })
      
      nextBtn.on('pointerover', () => {
        nextBtn.setBackgroundColor('#2563eb')
      })
      nextBtn.on('pointerout', () => {
        nextBtn.setBackgroundColor('#1e3a5f')
      })
      
      this.randomButtons.push(nextBtn)
    } else {
      const resetBtn = this.scene.add.text(100, height - 40, '🔄 重置', {
        fontSize: '16px',
        fill: '#f87171',
        fontStyle: 'bold',
        backgroundColor: '#1e3a5f',
        padding: { x: 15, y: 8 }
      })
      resetBtn.setOrigin(0, 0.5)
      resetBtn.setDepth(101)
      resetBtn.setInteractive({ useHandCursor: true })
      
      resetBtn.on('pointerdown', () => {
        if (this.onReset) {
          this.onReset()
        }
      })
      
      resetBtn.on('pointerover', () => {
        resetBtn.setBackgroundColor('#dc2626')
      })
      resetBtn.on('pointerout', () => {
        resetBtn.setBackgroundColor('#1e3a5f')
      })
      
      this.randomButtons.push(resetBtn)
    }
  }

  updateLevelInfo(levelIndex) {
    if (this.isDailyChallengeMode) {
      if (this.levelInfo) {
        this.levelInfo.setText(`🔥 每日挑战`)
        this.levelInfo.setColor('#fbbf24')
      }
      return
    }

    if (this.isRandomMode && this.currentRandomLevel) {
      const level = this.currentRandomLevel
      const diffNames = ['', '入门', '简单', '普通', '困难', '专家']
      const diffColors = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']
      if (this.levelInfo) {
        const seedStr = level.seed ? `[${level.seed}]` : ''
        this.levelInfo.setText(`🎲 ${diffNames[level.difficulty]} · ${level.name} ${seedStr}`)
        this.levelInfo.setColor(diffColors[level.difficulty] || '#60a5fa')
      }
      return
    }

    if (this.isStoryMode) {
      if (levelIndex >= LEVELS.length) return
      const level = LEVELS[levelIndex]
      if (this.levelInfo) {
        this.levelInfo.setText(`📖 第 ${level.id} 章: ${level.name}`)
        this.levelInfo.setColor('#a78bfa')
      }
      return
    }

    if (levelIndex >= LEVELS.length) return
    
    const level = LEVELS[levelIndex]
    if (this.levelInfo) {
      this.levelInfo.setText(`第 ${level.id} 关: ${level.name}`)
    }
  }

  updateTimer(seconds) {
    this.currentTime = seconds
    if (this.timerText) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 100)
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
      this.timerText.setText(`⏱ ${timeStr}`)
    }
  }

  updateSteps(steps) {
    this.steps = steps
    if (this.stepsText) {
      this.stepsText.setText(`👣 步数: ${steps}`)
    }
  }

  formatTime(seconds) {
    if (this.leaderboardService) {
      return this.leaderboardService.formatTime(seconds)
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  updateScore(points) {
    this.score += points
    if (this.scoreText) {
      this.scoreText.setText(`⭐ ${this.score} 分`)
    }
  }

  incrementAttempts() {
    this.attempts++
    if (this.attemptsText) {
      this.attemptsText.setText(`尝试: ${this.attempts} 次`)
    }
  }

  showHint() {
    if (this.isDailyChallengeMode) {
      if (this.hintText) {
        this.hintText.setText('仔细观察路线，避开障碍物，点亮更多植物获得高分！')
      }
      this.show()
      if (this.onShowHint) {
        this.onShowHint()
      }
      return
    }

    if (this.isRandomMode && this.currentRandomLevel) {
      if (this.hintText) {
        this.hintText.setText(this.currentRandomLevel.hint)
      }
      this.show()
      if (this.onShowHint) {
        this.onShowHint()
      }
      return
    }

    const levelIndex = this.getCurrentLevelIndex()
    if (levelIndex >= LEVELS.length) return
    
    const level = LEVELS[levelIndex]
    if (this.hintText) {
      this.hintText.setText(level.hint)
    }
    
    this.show()
    
    if (this.onShowHint) {
      this.onShowHint()
    }
  }

  getCurrentLevelIndex() {
    return this.currentLevelIndex || 0
  }

  setCurrentLevelIndex(index) {
    this.currentLevelIndex = index
    this.updateLevelInfo(index)
  }

  show() {
    if (this.panel) {
      this.panel.setVisible(true)
      this.isVisible = true
      
      this.scene.tweens.add({
        targets: this.panel,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.8, to: 1 },
        duration: 300,
        ease: 'Back.out'
      })
    }
  }

  hide() {
    if (this.panel) {
      this.scene.tweens.add({
        targets: this.panel,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.8 },
        duration: 200,
        ease: 'Cubic.In',
        onComplete: () => {
          this.panel.setVisible(false)
          this.isVisible = false
        }
      })
    }
  }

  showLevelComplete(levelIndex, score, onNext, isStoryMode = false, isRandomMode = false, completionTime = null, isWorkshopMode = false, stars = 1, steps = 0, canNext = true) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    const panel = this.scene.add.container(0, 0)
    panel.setDepth(300)
    
    const panelHeight = 360
    
    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.72, panelHeight,
      0x0d1117, 0.95
    )
    let strokeColor = 0x22c55e
    if (isStoryMode) strokeColor = 0xa78bfa
    if (isRandomMode) strokeColor = 0xec4899
    if (isWorkshopMode) strokeColor = 0x8b5cf6
    bg.setStrokeStyle(3, strokeColor, 0.8)
    panel.add(bg)
    
    let titleText = '🎉 关卡完成！'
    let titleFill = '#22c55e'
    if (isStoryMode) {
      titleText = '✨ 章节完成！'
      titleFill = '#a78bfa'
    }
    if (isRandomMode) {
      titleText = '🎲 随机挑战完成！'
      titleFill = '#ec4899'
    }
    if (isWorkshopMode) {
      titleText = '🎨 工坊关卡完成！'
      titleFill = '#8b5cf6'
    }
    const title = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 35, titleText, {
      fontSize: '26px',
      fill: titleFill,
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    let levelLabel = `第 ${levelIndex + 1} 关`
    let levelFill = '#60a5fa'
    if (isStoryMode) {
      levelLabel = `第 ${levelIndex + 1} 章`
      levelFill = '#f472b6'
    }
    if (isRandomMode && this.currentRandomLevel) {
      const diffNames = ['', '入门', '简单', '普通', '困难', '专家']
      levelLabel = `${diffNames[this.currentRandomLevel.difficulty] || '随机'} 模式`
      levelFill = '#ec4899'
    }
    if (isWorkshopMode && this.currentWorkshopLevel) {
      levelLabel = this.currentWorkshopLevel.name || '创意工坊'
      levelFill = '#8b5cf6'
    }
    const levelName = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 68, levelLabel, {
      fontSize: '16px',
      fill: levelFill
    })
    levelName.setOrigin(0.5)
    panel.add(levelName)
    
    const starsY = height / 2 - panelHeight / 2 + 108
    for (let i = 0; i < 3; i++) {
      const starX = width / 2 + (i - 1) * 42
      const starChar = i < stars ? '⭐' : '☆'
      const star = this.scene.add.text(starX, starsY, starChar, {
        fontSize: '34px'
      })
      star.setOrigin(0.5)
      star.setAlpha(i < stars ? 1 : 0.3)
      if (i < stars) {
        this.scene.tweens.add({
          targets: star,
          scale: { from: 0, to: 1.2 },
          alpha: { from: 0, to: 1 },
          duration: 400,
          ease: 'Back.out',
          delay: 200 + i * 150
        })
      }
      panel.add(star)
    }
    
    const scoreInfo = this.scene.add.text(width / 2, starsY + 42, `获得 ${score} 分`, {
      fontSize: '20px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)
    
    const statsY = starsY + 78
    const statsSpacing = 90
    const stats = []
    
    if (completionTime !== null) {
      stats.push({
        icon: '⏱',
        label: '用时',
        value: this.formatTime(completionTime),
        color: '#22c55e'
      })
    }
    
    stats.push({
      icon: '👣',
      label: '步数',
      value: `${steps}`,
      color: '#f472b6'
    })
    
    stats.push({
      icon: '🎯',
      label: '尝试',
      value: `${this.attempts} 次`,
      color: '#60a5fa'
    })
    
    const statsStartX = width / 2 - ((stats.length - 1) * statsSpacing) / 2
    stats.forEach((stat, i) => {
      const sx = statsStartX + i * statsSpacing
      const iconText = this.scene.add.text(sx, statsY - 2, stat.icon, {
        fontSize: '18px'
      })
      iconText.setOrigin(0.5, 0)
      panel.add(iconText)
      
      const valText = this.scene.add.text(sx, statsY + 20, stat.value, {
        fontSize: '15px',
        fill: stat.color,
        fontStyle: 'bold'
      })
      valText.setOrigin(0.5, 0)
      panel.add(valText)
      
      const lblText = this.scene.add.text(sx, statsY + 40, stat.label, {
        fontSize: '11px',
        fill: '#9ca3af'
      })
      lblText.setOrigin(0.5, 0)
      panel.add(lblText)
    })
    
    let nextBtnLabel = '下一关 →'
    let btnFill = '#22c55e'
    let btnBg = '#166534'
    let btnBgHover = '#15803d'
    
    if (isStoryMode) {
      nextBtnLabel = levelIndex < (this.scene.currentLevelIndex >= 0 ? 100 : LEVELS.length - 1) ? '继续剧情 →' : '再玩一次'
      btnFill = '#a78bfa'
      btnBg = '#4c1d95'
      btnBgHover = '#6d28d9'
    } else if (!isStoryMode && !isRandomMode && !isWorkshopMode && levelIndex >= LEVELS.length - 1) {
      nextBtnLabel = '再玩一次'
    }
    
    if (isRandomMode) {
      nextBtnLabel = '🎲 再来一个'
      btnFill = '#ec4899'
      btnBg = '#831843'
      btnBgHover = '#9d174d'
    }
    
    if (isWorkshopMode) {
      nextBtnLabel = '🏠 返回工坊'
      btnFill = '#8b5cf6'
      btnBg = '#4c1d95'
      btnBgHover = '#6d28d9'
    }
    
    if (!canNext && !isRandomMode && !isWorkshopMode) {
      nextBtnLabel = '🔒 提升星级解锁'
      btnFill = '#9ca3af'
      btnBg = '#1e293b'
      btnBgHover = '#1e293b'
    }
    
    const btnY = height / 2 + panelHeight / 2 - 46
    const nextBtn = this.scene.add.text(width / 2, btnY, nextBtnLabel, {
      fontSize: '18px',
      fill: btnFill,
      fontStyle: 'bold',
      backgroundColor: btnBg,
      padding: { x: 28, y: 12 }
    })
    nextBtn.setOrigin(0.5)
    nextBtn.setInteractive({ useHandCursor: true })
    
    if (canNext || isRandomMode || isWorkshopMode) {
      nextBtn.on('pointerdown', () => {
        this.scene.tweens.add({
          targets: panel,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            panel.destroy()
            if (onNext) onNext()
          }
        })
      })
      
      nextBtn.on('pointerover', () => {
        nextBtn.setBackgroundColor(btnBgHover)
      })
      nextBtn.on('pointerout', () => {
        nextBtn.setBackgroundColor(btnBg)
      })
    } else {
      if (nextBtn.input) nextBtn.input.enabled = false
    }
    
    panel.add(nextBtn)
    
    panel.setAlpha(0)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.85, to: 1 },
      duration: 400,
      ease: 'Back.out'
    })
  }

  showGameComplete(totalScore, onRestart) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    const panel = this.scene.add.container(0, 0)
    panel.setDepth(400)
    
    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.8, 300,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0x8b5cf6, 0.8)
    panel.add(bg)
    
    const title = this.scene.add.text(width / 2, height / 2 - 100, '🏆 恭喜通关！', {
      fontSize: '28px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    const subtitle = this.scene.add.text(width / 2, height / 2 - 55, '你成功帮助所有迷路的小生物找到了回家的路！', {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center',
      wordWrap: { width: width * 0.7 }
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)
    
    const totalScoreText = this.scene.add.text(width / 2, height / 2, `总分: ${totalScore} 分`, {
      fontSize: '24px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    totalScoreText.setOrigin(0.5)
    panel.add(totalScoreText)
    
    const rating = this.scene.add.text(width / 2, height / 2 + 40, '⭐⭐⭐', {
      fontSize: '32px'
    })
    rating.setOrigin(0.5)
    panel.add(rating)
    
    const restartBtn = this.scene.add.text(width / 2, height / 2 + 90, '🔄 重新开始', {
      fontSize: '18px',
      fill: '#8b5cf6',
      fontStyle: 'bold',
      backgroundColor: '#5b21b6',
      padding: { x: 25, y: 10 }
    })
    restartBtn.setOrigin(0.5)
    restartBtn.setInteractive({ useHandCursor: true })
    
    restartBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          panel.destroy()
          if (onRestart) onRestart()
        }
      })
    })
    
    restartBtn.on('pointerover', () => {
      restartBtn.setBackgroundColor('#7c3aed')
    })
    restartBtn.on('pointerout', () => {
      restartBtn.setBackgroundColor('#5b21b6')
    })
    
    panel.add(restartBtn)
    
    panel.setAlpha(0)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    for (let i = 0; i < 30; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0x22c55e, 0x60a5fa, 0xf472b6][Math.floor(Math.random() * 4)]
        
        const burst = this.scene.add.particles(x, y, 'sparkle', {
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

  updateUndoRedoButtons(canUndo, canRedo) {
    if (this.undoBtn) {
      this.undoBtn.setColor(canUndo ? '#e2e8f0' : '#475569')
      this.undoBtn.setBackgroundColor(canUndo ? '#1e293b' : '#0f172a')
      if (this.undoBtn.input) {
        this.undoBtn.input.enabled = canUndo
      }
    }
    if (this.redoBtn) {
      this.redoBtn.setColor(canRedo ? '#e2e8f0' : '#475569')
      this.redoBtn.setBackgroundColor(canRedo ? '#1e293b' : '#0f172a')
      if (this.redoBtn.input) {
        this.redoBtn.input.enabled = canRedo
      }
    }
  }

  getScore() {
    return this.score
  }

  getAttempts() {
    return this.attempts
  }

  reset() {
    this.attempts = 0
    this.steps = 0
    if (this.attemptsText) {
      this.attemptsText.setText('尝试: 0 次')
    }
    if (this.stepsText) {
      this.stepsText.setText('👣 步数: 0')
    }
  }

  destroy() {
    if (this.panel) {
      this.panel.destroy()
    }
    if (this.themePanel) {
      this.themePanel.destroy()
    }
    if (this.themePanelCloseMask) {
      this.themePanelCloseMask.destroy()
    }
  }
}
