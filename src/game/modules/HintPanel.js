import { LEVELS } from '../data/levels.js'

export class HintPanel {
  constructor(scene) {
    this.scene = scene
    this.panel = null
    this.hintText = null
    this.levelInfo = null
    this.scoreText = null
    this.attemptsText = null
    this.isVisible = false
    this.attempts = 0
    this.score = 0
    this.isDailyChallengeMode = false
    this.isStoryMode = false
    this.isRandomMode = false
    this.currentRandomLevel = null
    this.randomButtons = []
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
    }
  }

  init(preserveScore = false) {
    this.attempts = 0
    if (!preserveScore) {
      this.score = 0
    }
    this.createTopBar()
    this.createHintPanel()
    this.createControlButtons()
    this.updateScoreDisplay()
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
    
    this.scoreText = this.scene.add.text(width - 20, 25, '', {
      fontSize: '16px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    this.scoreText.setOrigin(1, 0.5)
    this.scoreText.setDepth(101)
    
    this.attemptsText = this.scene.add.text(width - 20, 50, '', {
      fontSize: '14px',
      fill: '#9ca3af'
    })
    this.attemptsText.setOrigin(1, 0.5)
    this.attemptsText.setDepth(101)
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

  showLevelComplete(levelIndex, score, onNext, isStoryMode = false, isRandomMode = false) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    
    const panel = this.scene.add.container(0, 0)
    panel.setDepth(300)
    
    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.7, 250,
      0x0d1117, 0.95
    )
    let strokeColor = 0x22c55e
    if (isStoryMode) strokeColor = 0xa78bfa
    if (isRandomMode) strokeColor = 0xec4899
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
    const title = this.scene.add.text(width / 2, height / 2 - 80, titleText, {
      fontSize: '24px',
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
    const levelName = this.scene.add.text(width / 2, height / 2 - 40, levelLabel, {
      fontSize: '18px',
      fill: levelFill
    })
    levelName.setOrigin(0.5)
    panel.add(levelName)
    
    const scoreInfo = this.scene.add.text(width / 2, height / 2, `获得 ${score} 分`, {
      fontSize: '20px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)
    
    const attemptsInfo = this.scene.add.text(width / 2, height / 2 + 35, `尝试 ${this.attempts} 次`, {
      fontSize: '14px',
      fill: '#9ca3af'
    })
    attemptsInfo.setOrigin(0.5)
    panel.add(attemptsInfo)
    
    let nextBtnLabel = '下一关 →'
    let btnFill = '#22c55e'
    let btnBg = '#166534'
    let btnBgHover = '#15803d'
    
    if (isStoryMode) {
      nextBtnLabel = levelIndex < LEVELS.length - 1 ? '继续剧情 →' : '再玩一次'
      btnFill = '#a78bfa'
      btnBg = '#4c1d95'
      btnBgHover = '#6d28d9'
    } else if (!isStoryMode && !isRandomMode && levelIndex >= LEVELS.length - 1) {
      nextBtnLabel = '再玩一次'
    }
    
    if (isRandomMode) {
      nextBtnLabel = '🎲 再来一个'
      btnFill = '#ec4899'
      btnBg = '#831843'
      btnBgHover = '#9d174d'
    }
    
    const nextBtn = this.scene.add.text(width / 2, height / 2 + 80, nextBtnLabel, {
      fontSize: '18px',
      fill: btnFill,
      fontStyle: 'bold',
      backgroundColor: btnBg,
      padding: { x: 25, y: 10 }
    })
    nextBtn.setOrigin(0.5)
    nextBtn.setInteractive({ useHandCursor: true })
    
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
    
    panel.add(nextBtn)
    
    panel.setAlpha(0)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
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

  getScore() {
    return this.score
  }

  getAttempts() {
    return this.attempts
  }

  reset() {
    this.attempts = 0
    if (this.attemptsText) {
      this.attemptsText.setText('尝试: 0 次')
    }
  }

  destroy() {
    if (this.panel) {
      this.panel.destroy()
    }
  }
}
