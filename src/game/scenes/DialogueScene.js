import Phaser from 'phaser'
import { NPCS } from '../data/story.js'

export class DialogueScene extends Phaser.Scene {
  constructor() {
    super('DialogueScene')
    this.dialogues = []
    this.currentIndex = 0
    this.onComplete = null
    this.container = null
    this.isAnimating = false
    this.typewriterTimer = null
  }

  init(data) {
    this.dialogues = data.dialogues || []
    this.onComplete = data.onComplete || null
    this.currentIndex = 0
  }

  create() {
    const width = this.game.config.width
    const height = this.game.config.height

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
    overlay.setOrigin(0, 0)
    overlay.setDepth(1000)

    this.container = this.add.container(0, 0)
    this.container.setDepth(1001)

    const panelWidth = Math.min(width * 0.85, 700)
    const panelHeight = 220
    const panelX = width / 2
    const panelY = height - panelHeight / 2 - 40

    const panelBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x0d1117, 0.95)
    panelBg.setStrokeStyle(3, 0x60a5fa, 0.8)
    panelBg.setAlpha(0)
    this.container.add(panelBg)

    const avatarBg = this.add.circle(panelX - panelWidth / 2 + 70, panelY - 40, 50, 0x1a1a3a, 0.9)
    avatarBg.setStrokeStyle(3, 0xa78bfa, 0.8)
    avatarBg.setAlpha(0)
    this.container.add(avatarBg)

    this.avatarText = this.add.text(panelX - panelWidth / 2 + 70, panelY - 40, '', {
      fontSize: '42px'
    })
    this.avatarText.setOrigin(0.5)
    this.avatarText.setAlpha(0)
    this.container.add(this.avatarText)

    this.nameText = this.add.text(panelX - panelWidth / 2 + 140, panelY - 75, '', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    })
    this.nameText.setAlpha(0)
    this.container.add(this.nameText)

    const dialoguePadding = 25
    this.dialogueText = this.add.text(
      panelX - panelWidth / 2 + dialoguePadding,
      panelY - 10,
      '',
      {
        fontSize: '17px',
        color: '#e2e8f0',
        align: 'left',
        wordWrap: { width: panelWidth - dialoguePadding * 2 }
      }
    )
    this.dialogueText.setAlpha(0)
    this.container.add(this.dialogueText)

    this.continueHint = this.add.text(panelX + panelWidth / 2 - 20, panelY + panelHeight / 2 - 25, '▼ 点击继续', {
      fontSize: '13px',
      color: '#9ca3af'
    })
    this.continueHint.setOrigin(1, 0.5)
    this.continueHint.setAlpha(0)
    this.container.add(this.continueHint)

    this.progressText = this.add.text(panelX - panelWidth / 2 + 20, panelY + panelHeight / 2 - 25, '', {
      fontSize: '13px',
      color: '#6b7280'
    })
    this.progressText.setAlpha(0)
    this.container.add(this.progressText)

    this.tweens.add({
      targets: [panelBg, avatarBg, this.avatarText, this.nameText, this.dialogueText, this.continueHint, this.progressText],
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: 'Cubic.out',
      onComplete: () => {
        this.showCurrentDialogue()
      }
    })

    this.input.on('pointerdown', () => {
      this.handleInput()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      this.handleInput()
    })
    this.input.keyboard.on('keydown-ENTER', () => {
      this.handleInput()
    })
  }

  handleInput() {
    if (this.isAnimating) {
      this.skipTypewriter()
    } else {
      this.nextDialogue()
    }
  }

  showCurrentDialogue() {
    if (this.currentIndex >= this.dialogues.length) {
      this.closeDialogue()
      return
    }

    const dialogue = this.dialogues[this.currentIndex]
    const speaker = NPCS[dialogue.speaker] || NPCS.player

    this.avatarText.setText(speaker.emoji)
    this.nameText.setText(speaker.name)
    this.nameText.setColor(speaker.color)
    this.progressText.setText(`${this.currentIndex + 1} / ${this.dialogues.length}`)

    this.typewriteText(dialogue.text)
  }

  typewriteText(text) {
    this.isAnimating = true
    this.dialogueText.setText('')
    this.continueHint.setAlpha(0.3)

    let index = 0
    const speed = 35

    if (this.typewriterTimer) {
      this.typewriterTimer.remove()
    }

    this.typewriterTimer = this.time.addEvent({
      delay: speed,
      repeat: text.length - 1,
      callback: () => {
        index++
        this.dialogueText.setText(text.substring(0, index))
        if (index >= text.length) {
          this.isAnimating = false
          this.continueHint.setAlpha(1)
          this.tweens.add({
            targets: this.continueHint,
            y: this.continueHint.y + 3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
          })
        }
      }
    })
  }

  skipTypewriter() {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove()
      this.typewriterTimer = null
    }
    const dialogue = this.dialogues[this.currentIndex]
    this.dialogueText.setText(dialogue.text)
    this.isAnimating = false
    this.continueHint.setAlpha(1)
    this.tweens.killTweensOf(this.continueHint)
  }

  nextDialogue() {
    this.currentIndex++
    this.tweens.killTweensOf(this.continueHint)

    if (this.currentIndex >= this.dialogues.length) {
      this.closeDialogue()
    } else {
      this.tweens.add({
        targets: [this.avatarText, this.nameText, this.dialogueText],
        alpha: 0,
        duration: 150,
        ease: 'Cubic.in',
        onComplete: () => {
          this.showCurrentDialogue()
          this.tweens.add({
            targets: [this.avatarText, this.nameText, this.dialogueText],
            alpha: 1,
            duration: 150,
            ease: 'Cubic.out'
          })
        }
      })
    }
  }

  closeDialogue() {
    this.tweens.killAll()
    if (this.typewriterTimer) {
      this.typewriterTimer.remove()
    }

    this.tweens.add({
      targets: this.container.list,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.in',
      onComplete: () => {
        if (this.onComplete) {
          const callback = this.onComplete
          this.scene.stop()
          this.scene.resume('GameScene')
          callback()
        } else {
          this.scene.stop()
          this.scene.resume('GameScene')
        }
      }
    })
  }
}
