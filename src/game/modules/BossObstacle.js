export class BossObstacle {
  constructor(scene, levelMap, route, speed = 1.5) {
    this.scene = scene
    this.levelMap = levelMap
    this.route = route
    this.speed = speed
    this.currentWaypointIndex = 0
    this.nextWaypointIndex = 1
    this.progress = 0
    this.sprite = null
    this.glowSprite = null
    this.trailEmitter = null
    this.isMoving = true
    this.body = null
    this.inner = null
    this.eyeLeft = null
    this.eyeRight = null
  }

  create() {
    const startPos = this.route[0]
    const worldPos = this.levelMap.getWorldPosition(startPos.row, startPos.col)
    const cellSize = this.levelMap.cellSize

    this.sprite = this.scene.add.container(worldPos.x, worldPos.y)
    this.sprite.setDepth(60)

    const bodySize = cellSize * 0.32
    this.body = this.scene.add.circle(0, 0, bodySize, 0x450a0a, 0.95)
    this.body.setStrokeStyle(3, 0xef4444, 1)
    this.sprite.add(this.body)

    this.inner = this.scene.add.circle(0, 0, bodySize * 0.55, 0xef4444, 0.6)
    this.sprite.add(this.inner)

    const eyeSize = bodySize * 0.22
    this.eyeLeft = this.scene.add.circle(-bodySize * 0.35, -bodySize * 0.15, eyeSize, 0xfbbf24, 1)
    this.sprite.add(this.eyeLeft)

    this.eyeRight = this.scene.add.circle(bodySize * 0.35, -bodySize * 0.15, eyeSize, 0xfbbf24, 1)
    this.sprite.add(this.eyeRight)

    const pupilSize = eyeSize * 0.55
    const pupilLeft = this.scene.add.circle(-bodySize * 0.32, -bodySize * 0.12, pupilSize, 0x1f2937, 1)
    this.sprite.add(pupilLeft)
    const pupilRight = this.scene.add.circle(bodySize * 0.38, -bodySize * 0.12, pupilSize, 0x1f2937, 1)
    this.sprite.add(pupilRight)

    const mouth = this.scene.add.graphics()
    mouth.lineStyle(2, 0xfbbf24, 0.9)
    mouth.beginPath()
    mouth.moveTo(-bodySize * 0.3, bodySize * 0.35)
    mouth.lineTo(-bodySize * 0.1, bodySize * 0.25)
    mouth.lineTo(bodySize * 0.1, bodySize * 0.35)
    mouth.lineTo(bodySize * 0.3, bodySize * 0.25)
    mouth.strokePath()
    this.sprite.add(mouth)

    this.glowSprite = this.scene.add.circle(worldPos.x, worldPos.y, cellSize * 0.5, 0xef4444, 0.12)
    this.glowSprite.setDepth(59)

    this.scene.tweens.add({
      targets: this.glowSprite,
      alpha: { from: 0.08, to: 0.2 },
      scale: { from: 0.9, to: 1.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.scene.tweens.add({
      targets: this.inner,
      alpha: { from: 0.4, to: 0.75 },
      scale: { from: 0.9, to: 1.1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.scene.tweens.add({
      targets: this.sprite,
      rotation: { from: -0.1, to: 0.1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    if (this.scene.textures.exists('sparkle')) {
      this.trailEmitter = this.scene.add.particles(worldPos.x, worldPos.y, 'sparkle', {
        speed: { min: 5, max: 25 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.25, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 600,
        frequency: 150,
        tint: [0xef4444, 0xfbbf24, 0xf97316],
        quantity: 1,
        blendMode: Phaser.BlendModes.SCREEN
      })
      this.trailEmitter.setDepth(58)
    }

    return this
  }

  update(delta) {
    if (!this.isMoving || this.route.length < 2) return

    const from = this.route[this.currentWaypointIndex]
    const to = this.route[this.nextWaypointIndex]
    const fromPos = this.levelMap.getWorldPosition(from.row, from.col)
    const toPos = this.levelMap.getWorldPosition(to.row, to.col)

    const segmentDist = Math.sqrt(
      Math.pow(toPos.x - fromPos.x, 2) + Math.pow(toPos.y - fromPos.y, 2)
    )

    if (segmentDist < 1) {
      this.advanceWaypoint()
      return
    }

    const worldSpeed = this.speed * this.levelMap.cellSize
    const progressIncrement = (worldSpeed * delta / 1000) / segmentDist

    this.progress += progressIncrement

    if (this.progress >= 1) {
      this.progress = 0
      this.advanceWaypoint()
    }

    const curFrom = this.route[this.currentWaypointIndex]
    const curTo = this.route[this.nextWaypointIndex]
    const curFromPos = this.levelMap.getWorldPosition(curFrom.row, curFrom.col)
    const curToPos = this.levelMap.getWorldPosition(curTo.row, curTo.col)

    const x = curFromPos.x + (curToPos.x - curFromPos.x) * this.progress
    const y = curFromPos.y + (curToPos.y - curFromPos.y) * this.progress

    this.sprite.setPosition(x, y)
    this.glowSprite.setPosition(x, y)

    if (this.trailEmitter) {
      this.trailEmitter.setPosition(x, y)
    }
  }

  advanceWaypoint() {
    this.currentWaypointIndex = this.nextWaypointIndex
    this.nextWaypointIndex = (this.nextWaypointIndex + 1) % this.route.length
  }

  checkCollision(creatureX, creatureY, threshold) {
    if (!this.sprite) return false
    const dx = this.sprite.x - creatureX
    const dy = this.sprite.y - creatureY
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < threshold
  }

  pause() {
    this.isMoving = false
  }

  resume() {
    this.isMoving = true
  }

  destroy() {
    if (this.trailEmitter) {
      this.trailEmitter.destroy()
      this.trailEmitter = null
    }
    if (this.glowSprite) {
      this.scene.tweens.killAllTweensOf(this.glowSprite)
      this.glowSprite.destroy()
      this.glowSprite = null
    }
    if (this.sprite) {
      this.scene.tweens.killAllTweensOf(this.sprite)
      this.scene.tweens.killAllTweensOf(this.inner)
      this.sprite.destroy()
      this.sprite = null
    }
  }
}
