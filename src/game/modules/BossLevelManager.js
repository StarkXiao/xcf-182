import { BossObstacle } from './BossObstacle.js'

export class BossLevelManager {
  constructor(scene, levelMap) {
    this.scene = scene
    this.levelMap = levelMap
    this.obstacles = []
    this.hp = 3
    this.maxHp = 3
    this.isActive = false
    this.isPaused = false
    this.creature = null
    this.damageCooldown = false
    this.gracePeriod = false
    this.hpContainer = null
    this.bossLabel = null
    this.warningText = null
    this.onDamage = null
    this.onGameOver = null
  }

  static isBossLevel(levelIndex, level = null) {
    if (level && level.isBossLevel) return true
    return (levelIndex + 1) % 5 === 0
  }

  activate(level, levelIndex, creature) {
    this.isActive = true
    this.hp = this.maxHp
    this.creature = creature
    this.obstacles = []
    this.damageCooldown = false
    this.gracePeriod = true

    const bossData = level.bossObstacles || this.generateBossObstacles(level)

    bossData.forEach(data => {
      const obstacle = new BossObstacle(
        this.scene,
        this.levelMap,
        data.route,
        data.speed || 1.5
      )
      obstacle.create()
      this.obstacles.push(obstacle)
    })

    this.createHPDisplay()
    this.createBossLabel()

    this.scene.time.delayedCall(2000, () => {
      this.gracePeriod = false
    })
  }

  generateBossObstacles(level) {
    const { rows, cols } = level.gridSize
    const obstacles = []
    const numObstacles = Math.min(4, Math.max(2, Math.floor(rows / 3)))

    for (let i = 0; i < numObstacles; i++) {
      const patrolRow = Math.floor((i + 1) * rows / (numObstacles + 1))
      const leftCol = 0
      const rightCol = cols - 1

      if (i % 2 === 0) {
        obstacles.push({
          route: [
            { row: patrolRow, col: leftCol },
            { row: patrolRow, col: rightCol }
          ],
          speed: 1.2 + i * 0.3
        })
      } else {
        const midCol = Math.floor(cols / 2)
        obstacles.push({
          route: [
            { row: patrolRow, col: rightCol },
            { row: patrolRow, col: midCol },
            { row: patrolRow - 1, col: midCol },
            { row: patrolRow - 1, col: leftCol },
            { row: patrolRow, col: leftCol },
            { row: patrolRow, col: rightCol }
          ],
          speed: 1.0 + i * 0.2
        })
      }
    }

    return obstacles
  }

  createHPDisplay() {
    this.destroyHPDisplay()

    const width = this.scene.game.config.width
    this.hpContainer = this.scene.add.container(width / 2, 60)
    this.hpContainer.setDepth(300)

    const bg = this.scene.add.rectangle(0, 0, 130, 36, 0x0d1117, 0.9)
    bg.setStrokeStyle(2, 0xef4444, 0.8)
    this.hpContainer.add(bg)

    this.hpHearts = []
    for (let i = 0; i < this.maxHp; i++) {
      const heart = this.scene.add.text(-40 + i * 40, 0, '❤️', {
        fontSize: '20px'
      })
      heart.setOrigin(0.5, 0.5)
      this.hpHearts.push(heart)
      this.hpContainer.add(heart)
    }

    this.hpContainer.setAlpha(0)
    this.scene.tweens.add({
      targets: this.hpContainer,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.Out'
    })
  }

  updateHPDisplay() {
    if (!this.hpHearts) return

    for (let i = 0; i < this.maxHp; i++) {
      if (i < this.hp) {
        this.hpHearts[i].setText('❤️')
        this.hpHearts[i].setAlpha(1)
      } else {
        this.hpHearts[i].setText('💀')
        this.hpHearts[i].setAlpha(0.5)
      }
    }

    if (this.hpContainer) {
      this.scene.tweens.add({
        targets: this.hpContainer,
        scale: { from: 1.2, to: 1 },
        duration: 200,
        ease: 'Back.out'
      })
    }
  }

  createBossLabel() {
    this.destroyBossLabel()

    const width = this.scene.game.config.width

    this.bossLabel = this.scene.add.text(20, 60, '👹 BOSS', {
      fontSize: '16px',
      fill: '#ef4444',
      fontStyle: 'bold',
      backgroundColor: '#450a0a',
      padding: { x: 10, y: 5 }
    })
    this.bossLabel.setOrigin(0, 0.5)
    this.bossLabel.setDepth(301)

    this.scene.tweens.add({
      targets: this.bossLabel,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.warningText = this.scene.add.text(width / 2, 95, '⚠ 小心移动障碍物！', {
      fontSize: '13px',
      fill: '#fbbf24',
      backgroundColor: '#451a03',
      padding: { x: 8, y: 4 }
    })
    this.warningText.setOrigin(0.5, 0.5)
    this.warningText.setDepth(301)
    this.warningText.setAlpha(0)

    this.scene.tweens.add({
      targets: this.warningText,
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.scene.time.delayedCall(3000, () => {
          if (this.warningText) {
            this.scene.tweens.add({
              targets: this.warningText,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                if (this.warningText) {
                  this.warningText.destroy()
                  this.warningText = null
                }
              }
            })
          }
        })
      }
    })
  }

  update(delta) {
    if (!this.isActive || this.isPaused) return

    this.obstacles.forEach(obs => obs.update(delta))

    if (this.creature && !this.damageCooldown && !this.gracePeriod) {
      this.checkCollisions()
    }
  }

  checkCollisions() {
    if (!this.creature) return

    const threshold = this.levelMap.cellSize * 0.45

    for (const obstacle of this.obstacles) {
      if (obstacle.checkCollision(this.creature.x, this.creature.y, threshold)) {
        this.takeDamage()
        return
      }
    }
  }

  takeDamage() {
    this.hp--
    this.damageCooldown = true
    this.updateHPDisplay()
    this.playDamageEffect()

    if (this.hp <= 0) {
      this.scene.time.delayedCall(800, () => {
        if (this.onGameOver) this.onGameOver()
      })
    } else {
      if (this.onDamage) this.onDamage(this.hp)

      this.scene.time.delayedCall(1500, () => {
        this.damageCooldown = false
      })
    }
  }

  playDamageEffect() {
    if (!this.creature) return

    this.scene.tweens.killAllTweensOf(this.creature)

    const flashTween = this.scene.tweens.add({
      targets: this.creature,
      alpha: { from: 1, to: 0.2 },
      duration: 100,
      yoyo: true,
      repeat: 5
    })

    const shakeX = this.creature.x
    const shakeY = this.creature.y
    this.scene.tweens.add({
      targets: this.creature,
      x: shakeX + 5,
      duration: 50,
      yoyo: true,
      repeat: 5
    })

    const width = this.scene.game.config.width
    const height = this.scene.game.config.height
    const damageOverlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0xef4444, 0.3
    )
    damageOverlay.setDepth(500)
    damageOverlay.setAlpha(0)

    this.scene.tweens.add({
      targets: damageOverlay,
      alpha: { from: 0.3, to: 0 },
      duration: 400,
      ease: 'Cubic.Out',
      onComplete: () => {
        damageOverlay.destroy()
      }
    })

    if (this.creature) {
      const cx = this.creature.x
      const cy = this.creature.y
      this.scene.add.particles(cx, cy, 'sparkle', {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        tint: [0xef4444, 0xfbbf24, 0xf97316],
        quantity: 20,
        duration: 300
      })
    }
  }

  setCreature(creature) {
    this.creature = creature
  }

  pause() {
    this.isPaused = true
    this.obstacles.forEach(obs => obs.pause())
  }

  resume() {
    this.isPaused = false
    this.obstacles.forEach(obs => obs.resume())
  }

  deactivate() {
    this.isActive = false
    this.isPaused = false
    this.damageCooldown = false
    this.gracePeriod = false
    this.obstacles.forEach(obs => obs.destroy())
    this.obstacles = []
    this.destroyHPDisplay()
    this.destroyBossLabel()
  }

  destroyHPDisplay() {
    if (this.hpContainer) {
      this.scene.tweens.killAllTweensOf(this.hpContainer)
      this.hpContainer.destroy()
      this.hpContainer = null
    }
    this.hpHearts = null
  }

  destroyBossLabel() {
    if (this.bossLabel) {
      this.scene.tweens.killAllTweensOf(this.bossLabel)
      this.bossLabel.destroy()
      this.bossLabel = null
    }
    if (this.warningText) {
      this.scene.tweens.killAllTweensOf(this.warningText)
      this.warningText.destroy()
      this.warningText = null
    }
  }

  showBossIntro(onComplete) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.7
    )
    overlay.setDepth(600)

    const container = this.scene.add.container(width / 2, height / 2)
    container.setDepth(601)
    container.setAlpha(0)
    container.setScale(0.5)

    const bossText = this.scene.add.text(0, -60, '👹 BOSS 关！', {
      fontSize: '36px',
      fill: '#ef4444',
      fontStyle: 'bold',
      stroke: '#450a0a',
      strokeThickness: 4
    })
    bossText.setOrigin(0.5)
    container.add(bossText)

    const descText = this.scene.add.text(0, -10, '移动障碍物按固定路线巡逻', {
      fontSize: '18px',
      fill: '#fbbf24',
      align: 'center'
    })
    descText.setOrigin(0.5)
    container.add(descText)

    const hpText = this.scene.add.text(0, 25, '❤️❤️❤️ 三次机会通关', {
      fontSize: '20px',
      fill: '#f87171',
      fontStyle: 'bold'
    })
    hpText.setOrigin(0.5)
    container.add(hpText)

    const tipText = this.scene.add.text(0, 65, '观察障碍物移动规律，把握时机！', {
      fontSize: '14px',
      fill: '#9ca3af'
    })
    tipText.setOrigin(0.5)
    container.add(tipText)

    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 600,
      ease: 'Back.out',
      onComplete: () => {
        for (let i = 0; i < 20; i++) {
          this.scene.time.delayedCall(i * 40, () => {
            const x = width / 2 + (Math.random() - 0.5) * 300
            const y = height / 2 + (Math.random() - 0.5) * 200
            this.scene.add.particles(x, y, 'sparkle', {
              speed: { min: 40, max: 120 },
              angle: { min: 0, max: 360 },
              scale: { start: 0.4, end: 0 },
              alpha: { start: 1, end: 0 },
              lifespan: 700,
              tint: [0xef4444, 0xfbbf24, 0xf97316],
              quantity: 6,
              duration: 200
            })
          })
        }

        this.scene.time.delayedCall(2500, () => {
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            scale: { from: 1, to: 1.1 },
            duration: 400,
            ease: 'Cubic.In',
            onComplete: () => {
              container.destroy()
              overlay.destroy()
              if (onComplete) onComplete()
            }
          })
        })
      }
    })

    this.scene.tweens.add({
      targets: overlay,
      alpha: { from: 0, to: 0.7 },
      duration: 300
    })
  }

  showBossGameOver(onRetry, onGiveUp) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(500)

    const overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.6
    )
    overlay.setDepth(499)
    panel.add(overlay)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.8, 300,
      0x1a0a0a, 0.98
    )
    bg.setStrokeStyle(3, 0xef4444, 0.9)
    panel.add(bg)

    const title = this.scene.add.text(width / 2, height / 2 - 100, '💀 BOSS 关失败', {
      fontSize: '28px',
      fill: '#ef4444',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const desc = this.scene.add.text(width / 2, height / 2 - 55, '三次机会已用完', {
      fontSize: '18px',
      fill: '#f87171'
    })
    desc.setOrigin(0.5)
    panel.add(desc)

    const tip = this.scene.add.text(width / 2, height / 2 - 20, '观察障碍物巡逻规律，把握通过时机！', {
      fontSize: '14px',
      fill: '#9ca3af'
    })
    tip.setOrigin(0.5)
    panel.add(tip)

    const retryBtn = this.scene.add.text(width / 2 - 90, height / 2 + 50, '🔄 再试一次', {
      fontSize: '18px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 20, y: 12 }
    })
    retryBtn.setOrigin(0.5)
    retryBtn.setInteractive({ useHandCursor: true })
    retryBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (onRetry) onRetry()
        }
      })
    })
    retryBtn.on('pointerover', () => retryBtn.setBackgroundColor('#b45309'))
    retryBtn.on('pointerout', () => retryBtn.setBackgroundColor('#92400e'))
    panel.add(retryBtn)

    const giveUpBtn = this.scene.add.text(width / 2 + 90, height / 2 + 50, '🏠 返回', {
      fontSize: '18px',
      fill: '#9ca3af',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 20, y: 12 }
    })
    giveUpBtn.setOrigin(0.5)
    giveUpBtn.setInteractive({ useHandCursor: true })
    giveUpBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (onGiveUp) onGiveUp()
        }
      })
    })
    giveUpBtn.on('pointerover', () => giveUpBtn.setBackgroundColor('#2563eb'))
    giveUpBtn.on('pointerout', () => giveUpBtn.setBackgroundColor('#1e3a5f'))
    panel.add(giveUpBtn)

    panel.setAlpha(0)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
  }

  destroy() {
    this.deactivate()
  }
}
