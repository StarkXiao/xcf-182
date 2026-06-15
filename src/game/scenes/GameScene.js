import Phaser from 'phaser'
import { LevelMap } from '../modules/LevelMap.js'
import { PlantState } from '../modules/PlantState.js'
import { PathJudge } from '../modules/PathJudge.js'
import { Effects } from '../modules/Effects.js'
import { HintPanel } from '../modules/HintPanel.js'
import { BossLevelManager } from '../modules/BossLevelManager.js'
import { AudioManager } from '../modules/AudioManager.js'
import { LevelLoader } from '../modules/LevelLoader.js'
import { ScoreManager } from '../modules/ScoreManager.js'
import { GameStateManager } from '../modules/GameStateManager.js'
import { PopupManager } from '../modules/PopupManager.js'
import { ItemSystem } from '../modules/ItemSystem.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.themeColors = null
    this.levelMap = null
    this.plantState = null
    this.pathJudge = null
    this.effects = null
    this.hintPanel = null
    this.bossLevelManager = null
    this.audioManager = null
    this.popupManager = null
    this.itemSystem = null
    this.levelLoader = null
    this.scoreManager = null
    this.gameStateManager = null
  }

  setDailyChallengeConfig(config) {
    this._dailyConfig = config
  }

  setStoryModeConfig(config) {
    this._storyConfig = config
  }

  setRandomModeConfig(config) {
    this._randomConfig = config
  }

  setWorkshopConfig(config) {
    this._workshopConfig = config
  }

  setThemeColors(colors) {
    this.themeColors = colors
  }

  preload() {
  }

  create() {
    this.audioManager = AudioManager.getInstance()
    this.audioManager.init()
    this.audioManager.fadeInBackgroundNoise(1.5)

    this.effects = new Effects(this)
    this.effects.init(this.themeColors)

    this.levelMap = new LevelMap(this, this.themeColors)
    this.plantState = new PlantState(this, this.levelMap)
    this.pathJudge = new PathJudge(this, this.levelMap, this.plantState)
    this.hintPanel = new HintPanel(this)
    this.bossLevelManager = new BossLevelManager(this, this.levelMap)
    this.popupManager = new PopupManager(this)

    this.effects.setLevelMap(this.levelMap)

    this.input.once('pointerdown', () => {
      if (this.audioManager) {
        this.audioManager.resume()
      }
    })

    const baseDependencies = {
      levelMap: this.levelMap,
      plantState: this.plantState,
      pathJudge: this.pathJudge,
      hintPanel: this.hintPanel,
      effects: this.effects,
      bossLevelManager: this.bossLevelManager
    }

    this.scoreManager = new ScoreManager(this, baseDependencies)

    this.levelLoader = new LevelLoader(this, baseDependencies)

    this.itemSystem = new ItemSystem(this, {
      levelMap: this.levelMap,
      levelLoader: this.levelLoader
    })

    this.gameStateManager = new GameStateManager(this, {
      ...baseDependencies,
      levelLoader: this.levelLoader,
      scoreManager: this.scoreManager,
      popupManager: this.popupManager,
      itemSystem: this.itemSystem
    })

    if (this._dailyConfig) {
      this.levelLoader.setDailyChallengeConfig(this._dailyConfig)
      this.scoreManager.setModeConfig({ isDailyChallenge: true, dailyLevel: this._dailyConfig.dailyLevel })
      this.gameStateManager.setModeConfig({
        onDailyComplete: this._dailyConfig.onDailyComplete,
        onBackToStart: this._dailyConfig.onBackToStart
      })
    }

    if (this._storyConfig) {
      this.levelLoader.setStoryModeConfig(this._storyConfig)
      this.scoreManager.setModeConfig({ isStoryMode: true })
      this.gameStateManager.setModeConfig({
        onStoryComplete: this._storyConfig.onStoryComplete,
        onBackToStart: this._storyConfig.onBackToStart
      })
    }

    if (this._randomConfig) {
      this.levelLoader.setRandomModeConfig(this._randomConfig)
      this.scoreManager.setModeConfig({ isRandomMode: true })
      this.gameStateManager.setModeConfig({
        onBackToStart: this._randomConfig.onBackToStart
      })
    }

    if (this._workshopConfig) {
      this.levelLoader.setWorkshopConfig(this._workshopConfig)
      this.scoreManager.setModeConfig({ isWorkshopMode: true })
      this.gameStateManager.setModeConfig({
        onBackToStart: this._workshopConfig.onBackToStart
      })
    }

    this._connectCallbacks()

    this.levelLoader.init()
  }

  _connectCallbacks() {
    this.levelLoader.onPathComplete = (path, branchId) => {
      this.gameStateManager.onPathComplete(path, branchId)
    }
    this.levelLoader.onPathInvalid = () => {
      this.gameStateManager.onPathInvalid()
    }
    this.levelLoader.onHistoryChange = (pathLen) => {
      this.scoreManager.updateSteps(pathLen)
    }
    this.levelLoader.onStartLevelTimer = () => {
      this.scoreManager.startLevelTimer()
    }
    this.levelLoader.onPauseLevelTimer = () => {
      this.scoreManager.pauseLevelTimer()
    }
    this.levelLoader.onResumeLevelTimer = () => {
      this.scoreManager.resumeLevelTimer()
    }
    this.levelLoader.onBossDamage = (remainingHp) => {
      this.gameStateManager.onBossDamage(remainingHp)
    }
    this.levelLoader.onBossGameOver = () => {
      this.gameStateManager.onBossGameOver()
    }
    this.levelLoader.onGameComplete = () => {
      this.gameStateManager.showGameComplete()
    }
    this.levelLoader.onStoryComplete = () => {
    }
    this.levelLoader.onCreateItemButton = () => {
      this.itemSystem.createItemButton()
    }
    this.levelLoader.onShowItemUseNotification = (title, message) => {
      this.popupManager.showItemUseNotification(title, message)
    }
    this.levelLoader.onShowLockNotification = (levelIndex) => {
      this.popupManager.showLockNotification(levelIndex)
    }
    this.levelLoader.onShowLevelIntro = (level) => {
      this.popupManager.showLevelIntro(level, {
        isDailyChallenge: this.levelLoader.isDailyChallenge,
        isStoryMode: this.levelLoader.isStoryMode,
        isBossLevel: this.levelLoader.isBossLevel
      })
    }
    this.levelLoader.onShowDialogue = (dialogues, onComplete) => {
      this.scene.pause()
      this.scene.launch('DialogueScene', {
        dialogues: dialogues,
        onComplete: onComplete
      })
    }
    this.levelLoader.onLevelLoaded = (level, levelIndex) => {
      this.scoreManager.resetForNewLevel(levelIndex)
    }
    this.levelLoader.onReset = () => {
      this.resetLevel()
    }
  }

  updatePlantCombo(plantType) {
    if (this.scoreManager) {
      return this.scoreManager.updatePlantCombo(plantType)
    }
  }

  applyThornDamage() {
    if (this.scoreManager) {
      this.scoreManager.applyThornDamage()
    }
  }

  get currentLevelIndex() {
    return this.levelLoader ? this.levelLoader.currentLevelIndex : 0
  }

  set currentLevelIndex(val) {
    if (this.levelLoader) {
      this.levelLoader.currentLevelIndex = val
    }
  }

  get totalScore() {
    return this.scoreManager ? this.scoreManager.totalScore : 0
  }

  set totalScore(val) {
    if (this.scoreManager) {
      this.scoreManager.totalScore = val
    }
  }

  get creature() {
    return this.levelLoader ? this.levelLoader.creature : null
  }

  get isAnimating() {
    return this.levelLoader ? this.levelLoader.isAnimating : false
  }

  set isAnimating(val) {
    if (this.levelLoader) {
      this.levelLoader.isAnimating = val
    }
  }

  get isBossLevel() {
    return this.levelLoader ? this.levelLoader.isBossLevel : false
  }

  get isTutorialMode() {
    return this.levelLoader ? this.levelLoader.isTutorialMode : false
  }

  loadLevel(levelIndex) {
    if (this.levelLoader) {
      this.levelLoader.loadLevel(levelIndex)
    }
  }

  loadRandomLevel(difficulty, seed) {
    if (this.levelLoader) {
      this.levelLoader.loadRandomLevel(difficulty, seed)
    }
  }

  nextLevel() {
    if (this.levelLoader) {
      this.levelLoader.nextLevel()
    }
  }

  resetLevel() {
    if (this.levelLoader) {
      this.levelLoader.resetLevel()
    }
    if (this.scoreManager) {
      this.scoreManager.resetCombo()
      this.scoreManager.comboScore = 0
      this.scoreManager.thornDamage = 0
      this.scoreManager.currentLevelSteps = 0
      if (this.hintPanel) {
        this.hintPanel.updateSteps(0)
        this.hintPanel.updateCombo(0, 0)
      }
    }
  }

  update(time, delta) {
    if (this.bossLevelManager && this.bossLevelManager.isActive) {
      this.bossLevelManager.update(delta)
    }
  }

  destroy() {
    if (this.audioManager) {
      this.audioManager.fadeOutBackgroundNoise(0.5)
    }
    if (this.bossLevelManager) this.bossLevelManager.destroy()
    if (this.levelMap) this.levelMap = null
    if (this.plantState) this.plantState.destroy()
    if (this.pathJudge) this.pathJudge.destroy()
    if (this.effects) this.effects.destroy()
    if (this.hintPanel) this.hintPanel.destroy()
    if (this.levelLoader) this.levelLoader.destroy()
    if (this.scoreManager) this.scoreManager.destroy()
    if (this.gameStateManager) this.gameStateManager.destroy()
    if (this.popupManager) this.popupManager.destroy()
    if (this.itemSystem) this.itemSystem.destroy()
  }
}
