import { AudioManager } from './AudioManager.js'

export class PopupManager {
  constructor(scene) {
    this.scene = scene
    this.audioManager = AudioManager.getInstance()
  }

  showLockNotification(levelIndex) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const levelNum = levelIndex + 1
    const prevLevelNum = levelIndex
    const lockMsg = `🔒 第 ${levelNum} 关未解锁`
    const hintMsg = `完成第 ${prevLevelNum} 关并获得至少1星后解锁`

    const notify = this.scene.add.container(0, 0)
    notify.setDepth(500)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.7, 160,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xef4444, 0.9)
    notify.add(bg)

    const icon = this.scene.add.text(width / 2, height / 2 - 40, '🔒', {
      fontSize: '36px'
    })
    icon.setOrigin(0.5)
    notify.add(icon)

    const title = this.scene.add.text(width / 2, height / 2 + 5, lockMsg, {
      fontSize: '20px',
      fill: '#ef4444',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    notify.add(title)

    const hint = this.scene.add.text(width / 2, height / 2 + 38, hintMsg, {
      fontSize: '14px',
      fill: '#9ca3af',
      align: 'center'
    })
    hint.setOrigin(0.5)
    notify.add(hint)

    notify.setAlpha(0)
    notify.setScale(0.8)

    this.scene.tweens.add({
      targets: notify,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.out'
    })

    this.scene.tweens.add({
      targets: notify,
      alpha: 0,
      scale: 0.9,
      duration: 300,
      ease: 'Cubic.In',
      delay: 2200,
      onComplete: () => {
        notify.destroy()
      }
    })
  }

  showLevelIntro(level, modeConfig) {
    const { isDailyChallenge, isStoryMode, isBossLevel } = modeConfig
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const levelLabel = isStoryMode ? `第 ${level.id} 章` : ''
    const titleText = isDailyChallenge
      ? `${level.name} 🔥`
      : isStoryMode
        ? `${levelLabel} · ${level.name}`
        : isBossLevel
          ? `👹 BOSS · ${level.name}`
          : level.name
    const titleFill = isDailyChallenge
      ? '#fbbf24'
      : isStoryMode
        ? '#a78bfa'
        : isBossLevel
          ? '#ef4444'
          : '#60a5fa'

    const intro = this.scene.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '32px',
      fill: titleFill,
      fontStyle: 'bold'
    })
    intro.setOrigin(0.5)
    intro.setDepth(200)
    intro.setAlpha(0)

    const desc = this.scene.add.text(width / 2, height / 2 - 50, level.description, {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    desc.setOrigin(0.5)
    desc.setDepth(200)
    desc.setAlpha(0)

    let challengeLabel = '从起点拖动到终点，点亮沿途的植物'
    if (isDailyChallenge) {
      challengeLabel = '🔥 每日挑战 · 完成后不可重玩'
    } else if (isStoryMode) {
      challengeLabel = '📖 故事模式 · 点亮植物，推动剧情发展'
    } else if (isBossLevel) {
      challengeLabel = '👹 BOSS 关 · 小心移动障碍物，三次机会通关'
    }

    const instructionFill = isDailyChallenge
      ? '#fbbf24'
      : isStoryMode
        ? '#a78bfa'
        : isBossLevel
          ? '#ef4444'
          : '#9ca3af'

    const instruction = this.scene.add.text(width / 2, height / 2, challengeLabel, {
      fontSize: '14px',
      fill: instructionFill
    })
    instruction.setOrigin(0.5)
    instruction.setDepth(200)
    instruction.setAlpha(0)

    this.scene.tweens.add({
      targets: [intro, desc, instruction],
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Cubic.out',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: [intro, desc, instruction],
            alpha: 0,
            duration: 300,
            ease: 'Cubic.in',
            onComplete: () => {
              intro.destroy()
              desc.destroy()
              instruction.destroy()
            }
          })
        })
      }
    })
  }

  showItemUseNotification(title, message) {
    const width = this.scene.game.config.width

    const notify = this.scene.add.container(0, 0)
    notify.setDepth(400)

    const bg = this.scene.add.rectangle(
      width / 2, 100,
      280, 70,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(2, 0x22c55e, 0.9)
    notify.add(bg)

    const titleText = this.scene.add.text(width / 2, 88, `✨ ${title}`, {
      fontSize: '16px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    titleText.setOrigin(0.5)
    notify.add(titleText)

    const msgText = this.scene.add.text(width / 2, 112, message, {
      fontSize: '13px',
      fill: '#9ca3af',
      align: 'center'
    })
    msgText.setOrigin(0.5)
    notify.add(msgText)

    notify.setAlpha(0)
    notify.setScale(0.8)

    this.scene.tweens.add({
      targets: notify,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.out'
    })

    this.scene.tweens.add({
      targets: notify,
      alpha: 0,
      scale: 0.9,
      duration: 300,
      ease: 'Cubic.In',
      delay: 2000,
      onComplete: () => {
        notify.destroy()
      }
    })
  }

  showStoryComplete(totalScore, callbacks) {
    const { onRestart, onBack } = callbacks
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(400)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 420,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xa78bfa, 0.8)
    panel.add(bg)

    const title = this.scene.add.text(width / 2, height / 2 - 170, '✨ 故事模式通关！', {
      fontSize: '30px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const subtitle = this.scene.add.text(width / 2, height / 2 - 130, '生命之源已经苏醒', {
      fontSize: '18px',
      fill: '#f472b6'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)

    const scoreInfo = this.scene.add.text(width / 2, height / 2 - 85, `总得分：${totalScore} 分`, {
      fontSize: '24px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)

    const thanks = this.scene.add.text(width / 2, height / 2 - 40, '感谢你陪伴洞穴的朋友们度过这段旅程', {
      fontSize: '15px',
      fill: '#e2e8f0',
      align: 'center'
    })
    thanks.setOrigin(0.5)
    panel.add(thanks)

    const lore1 = this.scene.add.text(width / 2, height / 2 - 5, '🌿 苔藓长老 · 🦋 月光萤 · 🗿 小石灵 · 🌸 花之灵', {
      fontSize: '14px',
      fill: '#60a5fa',
      align: 'center'
    })
    lore1.setOrigin(0.5)
    panel.add(lore1)

    const lore2 = this.scene.add.text(width / 2, height / 2 + 25, '星辰洞穴将永远铭记你的名字——引路人', {
      fontSize: '15px',
      fill: '#fbbf24',
      align: 'center'
    })
    lore2.setOrigin(0.5)
    panel.add(lore2)

    const restartBtn = this.scene.add.text(width / 2 - 100, height / 2 + 85, '🔄 重玩故事', {
      fontSize: '16px',
      fill: '#60a5fa',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 20, y: 12 }
    })
    restartBtn.setOrigin(0.5)
    restartBtn.setInteractive({ useHandCursor: true })
    restartBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (onRestart) onRestart()
        }
      })
    })
    restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#2d4a6f'))
    restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#1e3a5f'))
    panel.add(restartBtn)

    const backBtn = this.scene.add.text(width / 2 + 100, height / 2 + 85, '🏠 返回首页', {
      fontSize: '16px',
      fill: '#a78bfa',
      fontStyle: 'bold',
      backgroundColor: '#3b1f5f',
      padding: { x: 20, y: 12 }
    })
    backBtn.setOrigin(0.5)
    backBtn.setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (onBack) onBack()
        }
      })
    })
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#4a2d7f'))
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#3b1f5f'))
    panel.add(backBtn)

    panel.setAlpha(0)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })

    for (let i = 0; i < 30; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xa78bfa, 0xf472b6, 0x60a5fa, 0x22c55e, 0xfbbf24][Math.floor(Math.random() * 5)]

        this.scene.add.particles(x, y, 'sparkle', {
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

  showDailyChallengeComplete(score, maxCombo, callbacks) {
    const { onClose } = callbacks
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(400)

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 380,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.8)
    panel.add(bg)

    const title = this.scene.add.text(width / 2, height / 2 - 145, '🔥 每日挑战完成！', {
      fontSize: '28px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const scoreInfo = this.scene.add.text(width / 2, height / 2 - 90, `获得 ${score} 分`, {
      fontSize: '22px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)

    const maxComboInfo = this.scene.add.text(width / 2, height / 2 - 55, `🔥 最高连击: ${maxCombo} 连`, {
      fontSize: '16px',
      fill: '#f97316',
      fontStyle: 'bold'
    })
    maxComboInfo.setOrigin(0.5)
    panel.add(maxComboInfo)

    const subtitle = this.scene.add.text(width / 2, height / 2 - 20, '今日挑战已完成，明天再来！', {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)

    const noReplay = this.scene.add.text(width / 2, height / 2 + 15, '每日挑战仅可完成一次，不可重玩', {
      fontSize: '13px',
      fill: '#f87171'
    })
    noReplay.setOrigin(0.5)
    panel.add(noReplay)

    const streakInfo = this.scene.add.text(width / 2, height / 2 + 50, '保持连续打卡，解锁更多奖励！', {
      fontSize: '14px',
      fill: '#fbbf24'
    })
    streakInfo.setOrigin(0.5)
    panel.add(streakInfo)

    const rewardHint = this.scene.add.text(width / 2, height / 2 + 80, '🌟 连续7天 · 特殊徽章 + 主题皮肤', {
      fontSize: '13px',
      fill: '#a78bfa'
    })
    rewardHint.setOrigin(0.5)
    panel.add(rewardHint)

    const closeBtn = this.scene.add.text(width / 2, height / 2 + 125, '✓ 确认', {
      fontSize: '18px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 30, y: 12 }
    })
    closeBtn.setOrigin(0.5)
    closeBtn.setInteractive({ useHandCursor: true })

    closeBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (onClose) onClose()
        }
      })
    })

    closeBtn.on('pointerover', () => {
      closeBtn.setBackgroundColor('#b45309')
    })
    closeBtn.on('pointerout', () => {
      closeBtn.setBackgroundColor('#92400e')
    })

    panel.add(closeBtn)

    panel.setAlpha(0)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })

    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0xf97316, 0xef4444, 0xa78bfa][Math.floor(Math.random() * 4)]

        this.scene.add.particles(x, y, 'sparkle', {
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

  showAchievementPopup(achievements, onClose) {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    const panel = this.scene.add.container(0, 0)
    panel.setDepth(600)

    const panelHeight = 260 + achievements.length * 70

    const bg = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 0.75, panelHeight,
      0x0d1117, 0.98
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.9)
    panel.add(bg)

    const title = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 30, '🏆 成就解锁！', {
      fontSize: '24px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)

    const subtitle = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 58, '恭喜你获得了新的成就', {
      fontSize: '13px',
      fill: '#9ca3af'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)

    achievements.forEach((achievement, index) => {
      const itemY = height / 2 - panelHeight / 2 + 100 + index * 70

      const itemBg = this.scene.add.rectangle(
        width / 2, itemY,
        width * 0.62, 58,
        0x1e1b4b, 0.8
      )
      itemBg.setStrokeStyle(2, achievement.color, 0.7)
      panel.add(itemBg)

      const iconText = this.scene.add.text(width / 2 - width * 0.27, itemY, achievement.icon, {
        fontSize: '32px'
      })
      iconText.setOrigin(0, 0.5)
      panel.add(iconText)

      const nameText = this.scene.add.text(width / 2 - width * 0.2 + 10, itemY - 10, achievement.name, {
        fontSize: '17px',
        fill: achievement.color,
        fontStyle: 'bold'
      })
      nameText.setOrigin(0, 0.5)
      panel.add(nameText)

      const descText = this.scene.add.text(width / 2 - width * 0.2 + 10, itemY + 12, achievement.description, {
        fontSize: '12px',
        fill: '#9ca3af'
      })
      descText.setOrigin(0, 0.5)
      panel.add(descText)
    })

    const btnY = height / 2 + panelHeight / 2 - 38
    const continueBtn = this.scene.add.text(width / 2, btnY, '继续', {
      fontSize: '17px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 35, y: 12 }
    })
    continueBtn.setOrigin(0.5)
    continueBtn.setInteractive({ useHandCursor: true })
    continueBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0,
        scale: 0.9,
        duration: 250,
        ease: 'Cubic.In',
        onComplete: () => {
          panel.destroy()
          if (onClose) onClose()
        }
      })
    })
    continueBtn.on('pointerover', () => continueBtn.setBackgroundColor('#b45309'))
    continueBtn.on('pointerout', () => continueBtn.setBackgroundColor('#92400e'))
    panel.add(continueBtn)

    panel.setAlpha(0)
    panel.setScale(0.85)
    this.scene.tweens.add({
      targets: panel,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.out'
    })

    if (this.audioManager) {
      this.audioManager.playSuccess(3)
    }

    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0xf59e0b, 0xa78bfa, 0x22c55e, 0x60a5fa][Math.floor(Math.random() * 5)]
        this.scene.add.particles(x, y, 'sparkle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 900,
          tint: color,
          quantity: 8,
          duration: 300
        })
      })
    }
  }

  destroy() {
  }
}
