import { getItemManager, ITEM_TYPES, ITEM_CONFIG } from './ItemManager.js'
import { AudioManager } from './AudioManager.js'

export class ItemSystem {
  constructor(scene, dependencies) {
    this.scene = scene
    this.levelMap = dependencies.levelMap
    this.levelLoader = dependencies.levelLoader

    this.itemButton = null
    this.itemManager = getItemManager()
    this.audioManager = AudioManager.getInstance()
  }

  createItemButton() {
    const width = this.scene.game.config.width
    const height = this.scene.game.config.height

    if (this.itemButton) {
      this._destroyItemButton()
    }

    const selectedItem = this.levelLoader.levelCarriedItem
    if (!selectedItem) return

    const itemConfig = ITEM_CONFIG[selectedItem]
    const itemCount = this.itemManager.getItemCount(selectedItem)

    if (itemCount <= 0) return

    const btnX = 70
    const btnY = height - 40
    const btnW = 110
    const btnH = 44

    const itemBtnBg = this.scene.add.rectangle(btnX, btnY, btnW, btnH, 0x1e3a5f, 0.95)
    itemBtnBg.setStrokeStyle(3, itemConfig.color, 0.9)
    itemBtnBg.setDepth(101)
    itemBtnBg.setInteractive(new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains)
    if (itemBtnBg.input) itemBtnBg.input.cursor = 'pointer'

    const iconText = this.scene.add.text(btnX - 30, btnY, itemConfig.icon, {
      fontSize: '20px'
    })
    iconText.setOrigin(0.5)
    iconText.setDepth(102)

    const nameText = this.scene.add.text(btnX + 10, btnY - 6, itemConfig.name, {
      fontSize: '13px',
      fill: itemConfig.color,
      fontStyle: 'bold'
    })
    nameText.setOrigin(0, 0.5)
    nameText.setDepth(102)

    const countText = this.scene.add.text(btnX + 10, btnY + 10, `x${itemCount}`, {
      fontSize: '11px',
      fill: '#9ca3af'
    })
    countText.setOrigin(0, 0.5)
    countText.setDepth(102)

    itemBtnBg.on('pointerdown', () => {
      this.activateItemMode()
    })

    itemBtnBg.on('pointerover', () => {
      itemBtnBg.setFillStyle(0x2563eb, 0.95)
    })
    itemBtnBg.on('pointerout', () => {
      if (this.levelLoader.isItemMode) {
        itemBtnBg.setFillStyle(0x166534, 0.95)
      } else {
        itemBtnBg.setFillStyle(0x1e3a5f, 0.95)
      }
    })

    this.itemButton = {
      bg: itemBtnBg,
      icon: iconText,
      name: nameText,
      count: countText
    }
  }

  activateItemMode() {
    const levelLoader = this.levelLoader
    if (levelLoader.isAnimating || levelLoader.isTutorialMode) return

    const selectedItem = levelLoader.levelCarriedItem
    if (!selectedItem || this.itemManager.getItemCount(selectedItem) <= 0) return

    if (selectedItem === ITEM_TYPES.PATH_HINT) {
      this.usePathHintItem()
    } else if (selectedItem === ITEM_TYPES.OBSTACLE_CLEAR) {
      this.activateObstacleClearMode()
    }
  }

  usePathHintItem() {
    const levelLoader = this.levelLoader
    if (levelLoader.hintUsed) return
    if (levelLoader.levelCarriedItem !== ITEM_TYPES.PATH_HINT) return
    if (this.itemManager.getItemCount(levelLoader.levelCarriedItem) <= 0) return

    this.itemManager.useItem(levelLoader.levelCarriedItem)
    levelLoader.hintUsed = true

    const level = this.levelMap.currentLevel
    const correctPaths = level.correctPaths || [{ path: level.correctPath }]
    const randomPathInfo = correctPaths[Math.floor(Math.random() * correctPaths.length)]
    const correctPath = Array.isArray(randomPathInfo) ? randomPathInfo : randomPathInfo.path

    if (!correctPath || correctPath.length === 0) return

    const midIndex = Math.floor(correctPath.length / 2)
    const hintCell = this.levelMap.getCellAt(correctPath[midIndex].row, correctPath[midIndex].col)

    if (hintCell && hintCell.sprite) {
      const originalFill = hintCell.sprite.fillColor
      const originalStroke = hintCell.sprite.strokeColor

      let flashCount = 0
      const flashInterval = this.scene.time.addEvent({
        delay: 300,
        callback: () => {
          flashCount++
          if (flashCount % 2 === 1) {
            hintCell.sprite.setFillStyle(0xfbbf24, 0.6)
            hintCell.sprite.setStrokeStyle(3, 0xfbbf24, 1)
          } else {
            hintCell.sprite.setFillStyle(originalFill, 0.6)
            hintCell.sprite.setStrokeStyle(1, originalStroke, 0.5)
          }

          if (flashCount >= 6) {
            flashInterval.remove()
            if (!hintCell.isOnPath) {
              hintCell.sprite.setFillStyle(originalFill, 0.6)
              hintCell.sprite.setStrokeStyle(1, originalStroke, 0.5)
            }
          }
        },
        loop: true
      })

      const pos = this.levelMap.getWorldPosition(hintCell.row, hintCell.col)
      this.scene.add.particles(pos.x, pos.y, 'sparkle', {
        speed: { min: 30, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        tint: 0xfbbf24,
        quantity: 15,
        duration: 500
      })
    }

    if (this.audioManager) {
      this.audioManager.playSuccess(1)
    }

    this.updateItemButtonDisplay()

    if (this.onShowItemUseNotification) {
      this.onShowItemUseNotification('路径提示', '已标记正确路径中的一格')
    }
  }

  activateObstacleClearMode() {
    const levelLoader = this.levelLoader
    if (levelLoader.obstacleCleared) return
    if (levelLoader.levelCarriedItem !== ITEM_TYPES.OBSTACLE_CLEAR) return
    if (this.itemManager.getItemCount(levelLoader.levelCarriedItem) <= 0) return

    levelLoader.isItemMode = true

    if (this.itemButton && this.itemButton.bg) {
      this.itemButton.bg.setFillStyle(0x166534, 0.95)
    }

    if (this.onShowItemUseNotification) {
      this.onShowItemUseNotification('障碍消除', '点击一个障碍物来消除它')
    }

    this.scene.input.once('pointerdown', this.handleObstacleClearClick, this)
  }

  handleObstacleClearClick(pointer) {
    const cell = this.levelMap.getCellAtPosition(pointer.x, pointer.y)

    const clearableTypes = ['rock', 'thorn', 'ice']

    if (!cell || !cell.isObstacle || !clearableTypes.includes(cell.obstacleType)) {
      this.levelLoader.isItemMode = false
      if (this.itemButton && this.itemButton.bg) {
        this.itemButton.bg.setFillStyle(0x1e3a5f, 0.95)
      }
      return
    }

    this.clearObstacle(cell)
  }

  clearObstacle(cell) {
    const levelLoader = this.levelLoader
    if (levelLoader.obstacleCleared) return
    if (levelLoader.levelCarriedItem !== ITEM_TYPES.OBSTACLE_CLEAR) return
    if (this.itemManager.getItemCount(levelLoader.levelCarriedItem) <= 0) return

    this.itemManager.useItem(levelLoader.levelCarriedItem)
    levelLoader.obstacleCleared = true
    levelLoader.isItemMode = false

    const result = this.levelMap.removeObstacle(cell.row, cell.col)

    if (!result) return

    const pos = result.worldPosition
    const obsRendered = this.levelMap.renderedElements.obstacles.find(
      obs => obs.getData && obs.getData('obstacle')?.row === cell.row && obs.getData('obstacle')?.col === cell.col
    )

    if (obsRendered) {
      this.scene.tweens.add({
        targets: obsRendered,
        scale: 0,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.In',
        onComplete: () => {
          obsRendered.destroy()
        }
      })
    }

    this.scene.add.particles(pos.x, pos.y, 'sparkle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      tint: [0xf97316, 0xfbbf24, 0xef4444],
      quantity: 25,
      duration: 400,
      blendMode: 'ADD'
    })

    this.scene.cameras.main.shake(200, 0.005)

    if (result.cellSprite) {
      result.cellSprite.setAlpha(0)
      result.cellSprite.setScale(0.5)
      this.scene.tweens.add({
        targets: result.cellSprite,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.out'
      })
    }

    if (this.audioManager) {
      this.audioManager.playSuccess(2)
    }

    this.updateItemButtonDisplay()

    this.scene.time.delayedCall(500, () => {
      if (this.onShowItemUseNotification) {
        this.onShowItemUseNotification('障碍消除成功', '障碍物已被消除')
      }
    })
  }

  updateItemButtonDisplay() {
    if (!this.itemButton) {
      this.createItemButton()
      return
    }

    const selectedItem = this.levelLoader.levelCarriedItem
    if (!selectedItem) {
      this._destroyItemButton()
      return
    }

    const itemCount = this.itemManager.getItemCount(selectedItem)
    if (this.itemButton.count) {
      this.itemButton.count.setText(`x${itemCount}`)
    }

    if (itemCount <= 0) {
      this._destroyItemButton()
    }
  }

  _destroyItemButton() {
    if (this.itemButton) {
      if (this.itemButton.bg) this.itemButton.bg.destroy()
      if (this.itemButton.icon) this.itemButton.icon.destroy()
      if (this.itemButton.name) this.itemButton.name.destroy()
      if (this.itemButton.count) this.itemButton.count.destroy()
      this.itemButton = null
    }
  }

  destroy() {
    this._destroyItemButton()
  }
}
