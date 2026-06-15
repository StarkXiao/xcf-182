import Phaser from 'phaser'
import { LevelMap } from '../modules/LevelMap.js'
import { PlantState } from '../modules/PlantState.js'
import { PathJudge } from '../modules/PathJudge.js'
import { Effects } from '../modules/Effects.js'
import { HintPanel } from '../modules/HintPanel.js'
import { Tutorial } from '../modules/Tutorial.js'
import { LEVELS, PLANT_TYPES } from '../data/levels.js'
import { getDialogueForLevel, STORY_DIALOGUES } from '../data/story.js'
import { getLeaderboardService } from '../modules/LeaderboardService.js'
import { BossLevelManager } from '../modules/BossLevelManager.js'
import { getLevelProgressManager } from '../modules/LevelProgress.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.currentLevelIndex = 0
    this.levelMap = null
    this.plantState = null
    this.pathJudge = null
    this.effects = null
    this.hintPanel = null
    this.creature = null
    this.isAnimating = false
    this.totalScore = 0
    this.isDailyChallenge = false
    this.dailyLevel = null
    this.onDailyComplete = null
    this.onBackToStart = null
    this.dailyCompleted = false
    this.themeColors = null
    this.isStoryMode = false
    this.onStoryComplete = null
    this.storyCompleted = false
    this.levelStartTime = 0
    this.levelElapsedTime = 0
    this.timerEvent = null
    this.isLevelActive = false
    this.leaderboardService = null
    this.tutorial = null
    this.isTutorialMode = false
    this.bossLevelManager = null
    this.isBossLevel = false
    this.levelProgressManager = null
    this.currentLevelSteps = 0
    this.currentCombo = 0
    this.maxCombo = 0
    this.lastPlantType = null
    this.comboScore = 0
    this.thornDamage = 0
  }

  setDailyChallengeConfig(config) {
    this.isDailyChallenge = config.isDailyChallenge || false
    this.dailyLevel = config.dailyLevel || null
    this.onDailyComplete = config.onDailyComplete || null
    this.onBackToStart = config.onBackToStart || null
  }

  setStoryModeConfig(config) {
    this.isStoryMode = config.isStoryMode || false
    this.onStoryComplete = config.onStoryComplete || null
    this.onBackToStart = config.onBackToStart || null
  }

  setRandomModeConfig(config) {
    this.isRandomMode = config.isRandomMode || false
    this.randomDifficulty = config.difficulty || 3
    this.randomSeed = config.seed || null
    this.onBackToStart = config.onBackToStart || null
  }

  setWorkshopConfig(config) {
    this.isWorkshopMode = config.isWorkshopMode || false
    this.workshopLevel = config.workshopLevel || null
    this.onBackToStart = config.onBackToStart || null
  }

  setThemeColors(colors) {
    this.themeColors = colors
  }

  preload() {
  }

  create() {
    this.leaderboardService = getLeaderboardService()
    this.levelProgressManager = getLevelProgressManager()
    
    this.effects = new Effects(this)
    this.effects.init(this.themeColors)
    
    this.levelMap = new LevelMap(this, this.themeColors)
    this.plantState = new PlantState(this, this.levelMap)
    this.pathJudge = new PathJudge(this, this.levelMap, this.plantState)
    this.hintPanel = new HintPanel(this)
    
    this.bossLevelManager = new BossLevelManager(this, this.levelMap)
    
    this.effects.setLevelMap(this.levelMap)
    
    if (this.isDailyChallenge && this.dailyLevel) {
      this.levelMap.setDailyLevel(this.dailyLevel)
    }
    
    if (this.isWorkshopMode && this.workshopLevel) {
      this.levelMap.setWorkshopLevel(this.workshopLevel)
    }
    
    this.hintPanel.onReset = () => this.resetLevel()
    this.hintPanel.onShowHint = () => {
      if (this.pathJudge) {
        this.pathJudge.showHint()
      }
    }
    
    if (this.isDailyChallenge) {
      this.hintPanel.setDailyChallengeMode(true)
    }
    
    if (this.isStoryMode) {
      this.hintPanel.setStoryMode(true)
    }
    
    if (this.isRandomMode) {
      this.loadRandomLevel(this.randomDifficulty, this.randomSeed)
    } else if (this.isWorkshopMode) {
      this.loadWorkshopLevel()
    } else {
      const isNormalMode = !this.isDailyChallenge && !this.isStoryMode
      let startLevel = this.currentLevelIndex
      if (isNormalMode && this.levelProgressManager) {
        const highestUnlocked = this.levelProgressManager.getHighestUnlockedIndex()
        startLevel = Math.min(this.currentLevelIndex, highestUnlocked)
        if (startLevel !== this.currentLevelIndex) {
          this.currentLevelIndex = startLevel
        }
      }
      this.loadLevel(startLevel)
    }
  }

  loadRandomLevel(difficulty = 3, seed = null) {
    this.isAnimating = true
    this.isRandomMode = true
    this.isBossLevel = false
    
    if (this.bossLevelManager) this.bossLevelManager.deactivate()
    
    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }
    
    this.effects.createLevelTransition(() => {
      this.children.removeAll()
      
      this.effects.init()
      
      const level = this.levelMap.loadRandomLevel(difficulty, seed)
      this._setupLevelAfterLoad(level)
    })
  }

  loadWorkshopLevel() {
    this.isAnimating = true
    this.isWorkshopMode = true
    this.isBossLevel = false
    
    if (this.bossLevelManager) this.bossLevelManager.deactivate()
    
    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }
    
    this.effects.createLevelTransition(() => {
      this.children.removeAll()
      
      this.effects.init()
      
      const level = this.levelMap.loadWorkshopLevel()
      if (!level) {
        if (this.onBackToStart) {
          this.onBackToStart()
        }
        return
      }
      
      this._setupLevelAfterLoad(level, -1)
    })
  }

  loadLevel(levelIndex) {
    const isNormalMode = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode && !this.isStoryMode
    
    if (isNormalMode && this.levelProgressManager) {
      if (!this.levelProgressManager.isLevelUnlocked(levelIndex)) {
        this.showLockNotification(levelIndex)
        const fallbackIndex = Math.max(0, this.levelProgressManager.getHighestUnlockedIndex())
        if (fallbackIndex !== levelIndex) {
          this.time.delayedCall(500, () => {
            this.loadLevel(fallbackIndex)
          })
        }
        return
      }
    }
    
    this.isAnimating = true
    this.isRandomMode = false
    
    if (this.bossLevelManager) this.bossLevelManager.deactivate()
    
    if (this.creature) {
      this.creature.destroy()
      this.creature = null
    }
    
    this.effects.createLevelTransition(() => {
      this.children.removeAll()
      
      this.effects.init()
      
      const level = this.levelMap.loadLevel(levelIndex)
      if (!level) {
        this.showGameComplete()
        return
      }
      
      this._setupLevelAfterLoad(level, levelIndex)
    })
  }

  showLockNotification(levelIndex) {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const levelNum = levelIndex + 1
    const prevLevelNum = levelIndex
    let lockMsg = `🔒 第 ${levelNum} 关未解锁`
    let hintMsg = `完成第 ${prevLevelNum} 关并获得至少1星后解锁`
    
    const notify = this.add.container(0, 0)
    notify.setDepth(500)
    
    const bg = this.add.rectangle(
      width / 2, height / 2,
      width * 0.7, 160,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xef4444, 0.9)
    notify.add(bg)
    
    const icon = this.add.text(width / 2, height / 2 - 40, '🔒', {
      fontSize: '36px'
    })
    icon.setOrigin(0.5)
    notify.add(icon)
    
    const title = this.add.text(width / 2, height / 2 + 5, lockMsg, {
      fontSize: '20px',
      fill: '#ef4444',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    notify.add(title)
    
    const hint = this.add.text(width / 2, height / 2 + 38, hintMsg, {
      fontSize: '14px',
      fill: '#9ca3af',
      align: 'center'
    })
    hint.setOrigin(0.5)
    notify.add(hint)
    
    notify.setAlpha(0)
    notify.setScale(0.8)
    
    this.tweens.add({
      targets: notify,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.out'
    })
    
    this.tweens.add({
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

  _setupLevelAfterLoad(level, levelIndex = -1) {
    this.levelMap.render()
    this.plantState.init()
    this.pathJudge.init()
    
    this.currentLevelSteps = 0
    this.currentCombo = 0
    this.maxCombo = 0
    this.lastPlantType = null
    this.comboScore = 0
    this.thornDamage = 0
    if (this.hintPanel) {
      this.hintPanel.updateCombo(0, 0)
    }
    
    const hasExistingScore = this.hintPanel && this.hintPanel.getScore() > 0
    this.hintPanel.init(hasExistingScore)
    this.hintPanel.setCurrentLevelIndex(levelIndex >= 0 ? levelIndex : this.currentLevelIndex)
    this.hintPanel.reset()
    this.hintPanel.updateSteps(0)
    
    if (this.isDailyChallenge) {
      this.hintPanel.setDailyChallengeMode(true)
    }
    
    if (this.isStoryMode) {
      this.hintPanel.setStoryMode(true)
    }
    
    if (this.isRandomMode) {
      this.hintPanel.setRandomMode(true, level)
    }
    
    if (this.isWorkshopMode) {
      this.hintPanel.setWorkshopMode(true, level)
    }
    
    this.hintPanel.onReset = () => this.resetLevel()
    this.hintPanel.onShowHint = () => {
      if (this.pathJudge) {
        this.pathJudge.showHint()
      }
    }
    
    this.hintPanel.onNextRandom = (diff) => {
      this.loadRandomLevel(diff)
    }
    
    this.hintPanel.onUndo = () => this.handleUndo()
    this.hintPanel.onRedo = () => this.handleRedo()
    
    this.pathJudge.onPathComplete = (path) => this.onPathComplete(path)
    this.pathJudge.onPathInvalid = () => this.onPathInvalid()
    this.pathJudge.onHistoryChange = (canUndo, canRedo) => {
      if (this.hintPanel) {
        this.hintPanel.updateUndoRedoButtons(canUndo, canRedo)
      }
      if (this.pathJudge && this.hintPanel) {
        const pathLen = Math.max(0, this.pathJudge.getPathLength() - 1)
        this.currentLevelSteps = pathLen
        this.hintPanel.updateSteps(pathLen)
      }
    }
    
    this.refreshUndoRedoButtons()
    
    const startPos = this.levelMap.getWorldPosition(level.start.row, level.start.col)
    this.creature = this.effects.createCreatureSprite(startPos.x, startPos.y)
    this.creature.setDepth(100)
    
    this.isBossLevel = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode &&
      BossLevelManager.isBossLevel(levelIndex, level)
    
    if (this.isBossLevel && this.bossLevelManager) {
      this.bossLevelManager.activate(level, levelIndex, this.creature)
      this.bossLevelManager.onDamage = (remainingHp) => this.onBossDamage(remainingHp)
      this.bossLevelManager.onGameOver = () => this.onBossGameOver()
    }
    
    this.startLevelTimer()
    
    const shouldShowTutorial = levelIndex === 0 && 
      !this.isDailyChallenge && 
      !this.isRandomMode && 
      Tutorial.shouldShowTutorial()
    
    if (shouldShowTutorial) {
      this.isTutorialMode = true
      this.pauseLevelTimer()
      
      this.showLevelIntro(level)
      
      this.time.delayedCall(2500, () => {
        this.startTutorial()
      })
    } else if (this.isStoryMode && levelIndex >= 0) {
      const beforeDialogue = getDialogueForLevel(levelIndex, true)
      if (beforeDialogue) {
        this.showDialogue(beforeDialogue, () => {
          this.showLevelIntro(level)
          this.isAnimating = false
        })
      } else {
        this.showLevelIntro(level)
        this.isAnimating = false
      }
    } else if (this.isBossLevel && this.bossLevelManager) {
      this.isAnimating = true
      this.showLevelIntro(level)
      this.bossLevelManager.showBossIntro(() => {
        this.isAnimating = false
      })
    } else {
      this.showLevelIntro(level)
      this.isAnimating = false
    }
  }

  startTutorial() {
    if (!this.tutorial) {
      this.tutorial = new Tutorial(
        this,
        this.levelMap,
        this.pathJudge,
        this.plantState,
        this.effects
      )
    }
    
    this.tutorial.start(() => {
      this.isTutorialMode = false
      this.isAnimating = false
      this.startLevelTimer()
    })
  }

  showDialogue(dialogues, onComplete) {
    this.scene.pause()
    this.scene.launch('DialogueScene', {
      dialogues: dialogues,
      onComplete: onComplete
    })
  }

  showLevelIntro(level) {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const levelLabel = this.isStoryMode ? `第 ${level.id} 章` : ''
    const titleText = this.isDailyChallenge 
      ? `${level.name} 🔥` 
      : this.isStoryMode 
        ? `${levelLabel} · ${level.name}` 
        : this.isBossLevel
          ? `👹 BOSS · ${level.name}`
          : level.name
    const titleFill = this.isDailyChallenge 
      ? '#fbbf24' 
      : this.isStoryMode 
        ? '#a78bfa' 
        : this.isBossLevel
          ? '#ef4444'
          : '#60a5fa'
    
    const intro = this.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '32px',
      fill: titleFill,
      fontStyle: 'bold'
    })
    intro.setOrigin(0.5)
    intro.setDepth(200)
    intro.setAlpha(0)
    
    const desc = this.add.text(width / 2, height / 2 - 50, level.description, {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    desc.setOrigin(0.5)
    desc.setDepth(200)
    desc.setAlpha(0)
    
    let challengeLabel = '从起点拖动到终点，点亮沿途的植物'
    if (this.isDailyChallenge) {
      challengeLabel = '🔥 每日挑战 · 完成后不可重玩'
    } else if (this.isStoryMode) {
      challengeLabel = '📖 故事模式 · 点亮植物，推动剧情发展'
    } else if (this.isBossLevel) {
      challengeLabel = '👹 BOSS 关 · 小心移动障碍物，三次机会通关'
    }
    
    const instructionFill = this.isDailyChallenge 
      ? '#fbbf24' 
      : this.isStoryMode 
        ? '#a78bfa' 
        : this.isBossLevel
          ? '#ef4444'
          : '#9ca3af'
    
    const instruction = this.add.text(width / 2, height / 2, challengeLabel, {
      fontSize: '14px',
      fill: instructionFill
    })
    instruction.setOrigin(0.5)
    instruction.setDepth(200)
    instruction.setAlpha(0)
    
    this.tweens.add({
      targets: [intro, desc, instruction],
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Cubic.out',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
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

  updatePlantCombo(plantType) {
    if (plantType === null) {
      return
    }
    
    if (this.lastPlantType === null) {
      this.currentCombo = 1
    } else if (plantType === this.lastPlantType) {
      this.currentCombo++
    } else {
      this.currentCombo = 1
    }
    
    this.lastPlantType = plantType
    
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo
    }
    
    const baseScore = 10
    let plantScore = baseScore
    if (this.currentCombo > 1) {
      plantScore = baseScore * 2
    }
    this.comboScore += plantScore
    
    if (this.hintPanel) {
      this.hintPanel.updateCombo(this.currentCombo, this.maxCombo)
    }
    
    return plantScore
  }

  resetCombo() {
    this.currentCombo = 0
    this.lastPlantType = null
    if (this.hintPanel) {
      this.hintPanel.updateCombo(0, this.maxCombo)
    }
  }

  applyThornDamage() {
    const damage = 20
    this.thornDamage += damage
    if (this.hintPanel) {
      this.hintPanel.showThornDamage(damage)
    }
  }

  onPathComplete(path) {
    if (this.isAnimating || this.isTutorialMode) return
    
    this.isAnimating = true
    if (this.isDailyChallenge) {
      this.dailyCompleted = true
    }
    this.hintPanel.incrementAttempts()
    
    const completionTime = this.stopLevelTimer()
    const completionSteps = Math.max(0, path.length - 1)
    const currentAttempts = this.hintPanel.getAttempts()
    
    if (this.isBossLevel && this.bossLevelManager) {
      this.bossLevelManager.pause()
    }
    
    const litCount = this.plantState.getLitCount()
    const levelScore = Math.max(0, this.comboScore + 50 - this.thornDamage)
    this.hintPanel.updateScore(levelScore)
    this.totalScore += levelScore
    
    const endPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.end.row,
      this.levelMap.currentLevel.end.col
    )
    this.effects.createSuccessEffect(endPos.x, endPos.y)
    
    let stars = 1
    let canNext = true
    const isNormalMode = !this.isDailyChallenge && !this.isStoryMode && !this.isRandomMode && !this.isWorkshopMode
    
    if (isNormalMode && this.levelMap.currentLevel && this.levelProgressManager) {
      stars = this.calculateStars(
        this.levelMap.currentLevel,
        completionTime,
        completionSteps,
        currentAttempts
      )
      canNext = this.canUnlockNextLevel(this.currentLevelIndex, stars)
      
      const levelId = this.levelMap.currentLevel.id
      this.levelProgressManager.saveLevelResult(levelId, {
        time: completionTime,
        steps: completionSteps,
        attempts: currentAttempts,
        stars: stars
      })
    }
    
    this.submitToLeaderboard(levelScore, completionTime)
    
    this.effects.animateCreatureAlongPath(this.creature, path, () => {
      this.time.delayedCall(500, () => {
        if (this.isDailyChallenge) {
          this.showDailyChallengeComplete(levelScore)
        } else if (this.isStoryMode) {
          this.handleStoryLevelComplete(levelScore)
        } else if (this.isRandomMode) {
          const curDiff = this.levelMap.currentLevel?.difficulty || 3
          this.hintPanel.showLevelComplete(
            this.currentLevelIndex,
            levelScore,
            () => this.loadRandomLevel(curDiff),
            false,
            true,
            completionTime,
            false,
            stars,
            completionSteps,
            true,
            this.maxCombo
          )
        } else if (this.isWorkshopMode) {
          this.hintPanel.showLevelComplete(
            -1,
            levelScore,
            () => {
              if (this.onBackToStart) {
                this.onBackToStart()
              }
            },
            false,
            false,
            completionTime,
            true,
            stars,
            completionSteps,
            true,
            this.maxCombo
          )
        } else {
          this.hintPanel.showLevelComplete(
            this.currentLevelIndex,
            levelScore,
            () => this.nextLevel(),
            false,
            false,
            completionTime,
            false,
            stars,
            completionSteps,
            canNext,
            this.maxCombo
          )
        }
        this.isAnimating = false
      })
    })
  }

  async submitToLeaderboard(score, time) {
    if (!this.leaderboardService) return
    
    let levelId = null
    if (this.isDailyChallenge) {
      const today = new Date().toISOString().split('T')[0]
      levelId = `daily_${today}`
    } else if (this.isRandomMode && this.levelMap.currentLevel) {
      const seed = this.levelMap.currentLevel.seed || 'random'
      const diff = this.levelMap.currentLevel.difficulty || 3
      levelId = `random_${diff}_${seed}`
    } else if (this.isWorkshopMode && this.levelMap.currentLevel) {
      levelId = `workshop_${this.levelMap.currentLevel.workshopId || this.levelMap.currentLevel.id}`
    } else if (this.currentLevelIndex >= 0 && this.currentLevelIndex < LEVELS.length) {
      levelId = LEVELS[this.currentLevelIndex].id
    }
    
    if (levelId !== null) {
      try {
        const result = await this.leaderboardService.submitScore(levelId, score, time)
        console.log('Leaderboard submit result:', result)
      } catch (e) {
        console.warn('Failed to submit to leaderboard:', e)
      }
    }
  }

  startLevelTimer() {
    this.levelStartTime = this.time.now
    this.levelElapsedTime = 0
    this.isLevelActive = true
    
    if (this.timerEvent) {
      this.timerEvent.remove()
    }
    
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.isLevelActive) {
          this.levelElapsedTime = (this.time.now - this.levelStartTime) / 1000
          if (this.hintPanel) {
            this.hintPanel.updateTimer(this.levelElapsedTime)
          }
        }
      }
    })
  }

  stopLevelTimer() {
    this.isLevelActive = false
    if (this.timerEvent) {
      this.timerEvent.remove()
      this.timerEvent = null
    }
    this.levelElapsedTime = (this.time.now - this.levelStartTime) / 1000
    return this.levelElapsedTime
  }

  pauseLevelTimer() {
    this.isLevelActive = false
  }

  resumeLevelTimer() {
    if (!this.isLevelActive) {
      this.levelStartTime = this.time.now - this.levelElapsedTime * 1000
      this.isLevelActive = true
    }
  }

  calculateStars(level, time, steps, attempts) {
    let stars = 1
    
    const parTime2 = level.parTime2Star || 60
    const parTime3 = level.parTime3Star || 30
    const parSteps2 = level.parSteps2Star || 20
    const parSteps3 = level.parSteps3Star || 10
    const parAttempts2 = level.parAttempts2Star || 3
    const parAttempts3 = level.parAttempts3Star || 1
    
    const meetTime2 = time <= parTime2
    const meetTime3 = time <= parTime3
    const meetSteps2 = steps <= parSteps2
    const meetSteps3 = steps <= parSteps3
    const meetAttempts2 = attempts <= parAttempts2
    const meetAttempts3 = attempts <= parAttempts3
    
    if (meetTime3 && meetSteps3 && meetAttempts3) {
      stars = 3
    } else if ((meetTime2 || meetTime3) && (meetSteps2 || meetSteps3) && (meetAttempts2 || meetAttempts3)) {
      const twoStarConditions = [meetTime2, meetSteps2, meetAttempts2].filter(Boolean).length
      if (twoStarConditions >= 2) {
        stars = 2
      } else {
        stars = 1
      }
    } else {
      stars = 1
    }
    
    return stars
  }

  canUnlockNextLevel(currentLevelIndex, stars) {
    return stars >= 1 && currentLevelIndex < LEVELS.length - 1
  }

  handleStoryLevelComplete(levelScore) {
    const isLastLevel = this.currentLevelIndex >= LEVELS.length - 1
    const afterDialogue = getDialogueForLevel(this.currentLevelIndex, false)
    
    const completionTime = this.levelElapsedTime
    const completionSteps = this.currentLevelSteps
    const currentAttempts = this.hintPanel.getAttempts()
    
    let stars = 1
    if (this.levelMap.currentLevel && this.levelProgressManager) {
      stars = this.calculateStars(
        this.levelMap.currentLevel,
        completionTime,
        completionSteps,
        currentAttempts
      )
      
      const levelId = this.levelMap.currentLevel.id
      this.levelProgressManager.saveLevelResult(levelId, {
        time: completionTime,
        steps: completionSteps,
        attempts: currentAttempts,
        stars: stars
      })
    }
    
    const proceedToNext = () => {
      if (isLastLevel) {
        this.storyCompleted = true
        this.showStoryComplete()
      } else {
        this.hintPanel.showLevelComplete(
          this.currentLevelIndex,
          levelScore,
          () => this.nextLevel(),
          true,
          false,
          completionTime,
          false,
          stars,
          completionSteps,
          true,
          this.maxCombo
        )
      }
    }
    
    if (afterDialogue) {
      this.showDialogue(afterDialogue, proceedToNext)
    } else if (isLastLevel) {
      this.showDialogue(STORY_DIALOGUES.epilogue, () => {
        this.storyCompleted = true
        this.showStoryComplete()
      })
    } else {
      proceedToNext()
    }
  }

  showStoryComplete() {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const panel = this.add.container(0, 0)
    panel.setDepth(400)
    
    const bg = this.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 420,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xa78bfa, 0.8)
    panel.add(bg)
    
    const title = this.add.text(width / 2, height / 2 - 170, '✨ 故事模式通关！', {
      fontSize: '30px',
      fill: '#a78bfa',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    const subtitle = this.add.text(width / 2, height / 2 - 130, '生命之源已经苏醒', {
      fontSize: '18px',
      fill: '#f472b6'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)
    
    const scoreInfo = this.add.text(width / 2, height / 2 - 85, `总得分：${this.totalScore} 分`, {
      fontSize: '24px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)
    
    const thanks = this.add.text(width / 2, height / 2 - 40, '感谢你陪伴洞穴的朋友们度过这段旅程', {
      fontSize: '15px',
      fill: '#e2e8f0',
      align: 'center'
    })
    thanks.setOrigin(0.5)
    panel.add(thanks)
    
    const lore1 = this.add.text(width / 2, height / 2 - 5, '🌿 苔藓长老 · 🦋 月光萤 · 🗿 小石灵 · 🌸 花之灵', {
      fontSize: '14px',
      fill: '#60a5fa',
      align: 'center'
    })
    lore1.setOrigin(0.5)
    panel.add(lore1)
    
    const lore2 = this.add.text(width / 2, height / 2 + 25, '星辰洞穴将永远铭记你的名字——引路人', {
      fontSize: '15px',
      fill: '#fbbf24',
      align: 'center'
    })
    lore2.setOrigin(0.5)
    panel.add(lore2)
    
    const restartBtn = this.add.text(width / 2 - 100, height / 2 + 85, '🔄 重玩故事', {
      fontSize: '16px',
      fill: '#60a5fa',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 20, y: 12 }
    })
    restartBtn.setOrigin(0.5)
    restartBtn.setInteractive({ useHandCursor: true })
    restartBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          this.currentLevelIndex = 0
          this.totalScore = 0
          this.hintPanel.score = 0
          this.storyCompleted = false
          this.loadLevel(0)
        }
      })
    })
    restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#2d4a6f'))
    restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#1e3a5f'))
    panel.add(restartBtn)
    
    const backBtn = this.add.text(width / 2 + 100, height / 2 + 85, '🏠 返回首页', {
      fontSize: '16px',
      fill: '#a78bfa',
      fontStyle: 'bold',
      backgroundColor: '#3b1f5f',
      padding: { x: 20, y: 12 }
    })
    backBtn.setOrigin(0.5)
    backBtn.setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (this.onStoryComplete) {
            this.onStoryComplete(this.totalScore)
          }
          if (this.onBackToStart) {
            this.time.delayedCall(300, () => {
              this.onBackToStart()
            })
          }
        }
      })
    })
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#4a2d7f'))
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#3b1f5f'))
    panel.add(backBtn)
    
    panel.setAlpha(0)
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    for (let i = 0; i < 30; i++) {
      this.time.delayedCall(i * 60, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xa78bfa, 0xf472b6, 0x60a5fa, 0x22c55e, 0xfbbf24][Math.floor(Math.random() * 5)]
        
        this.add.particles(x, y, 'sparkle', {
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

  onPathInvalid() {
    this.hintPanel.incrementAttempts()
  }

  nextLevel() {
    const nextIndex = this.currentLevelIndex + 1
    const isNormalMode = !this.isDailyChallenge && !this.isRandomMode && !this.isWorkshopMode
    
    if (isNormalMode && this.levelProgressManager && nextIndex < LEVELS.length) {
      if (!this.levelProgressManager.isLevelUnlocked(nextIndex)) {
        this.showLockNotification(nextIndex)
        return
      }
    }
    
    this.currentLevelIndex = nextIndex
    if (this.currentLevelIndex >= LEVELS.length) {
      if (this.isStoryMode) {
        this.storyCompleted = true
        this.showStoryComplete()
      } else {
        this.showGameComplete()
      }
    } else {
      this.loadLevel(this.currentLevelIndex)
    }
  }

  handleUndo() {
    if (this.isAnimating || this.isTutorialMode) return
    if (this.pathJudge && this.pathJudge.undo()) {
      this.refreshUndoRedoButtons()
    }
  }

  handleRedo() {
    if (this.isAnimating || this.isTutorialMode) return
    if (this.pathJudge && this.pathJudge.redo()) {
      this.refreshUndoRedoButtons()
    }
  }

  refreshUndoRedoButtons() {
    if (this.hintPanel && this.pathJudge) {
      this.hintPanel.updateUndoRedoButtons(
        this.pathJudge.canUndo(),
        this.pathJudge.canRedo()
      )
    }
  }

  resetLevel() {
    if (this.isAnimating || this.isTutorialMode) return
    if (this.isDailyChallenge && this.dailyCompleted) return
    if (this.isStoryMode && this.storyCompleted) return
    
    this.pathJudge.resetPath()
    this.refreshUndoRedoButtons()
    
    this.currentLevelSteps = 0
    this.currentCombo = 0
    this.maxCombo = 0
    this.lastPlantType = null
    this.comboScore = 0
    this.thornDamage = 0
    if (this.hintPanel) {
      this.hintPanel.updateSteps(0)
      this.hintPanel.updateCombo(0, 0)
    }
    
    const startPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.start.row,
      this.levelMap.currentLevel.start.col
    )
    
    if (this.creature) {
      this.tweens.add({
        targets: this.creature,
        x: startPos.x,
        y: startPos.y,
        angle: 0,
        duration: 300,
        ease: 'Cubic.out'
      })
    }
  }

  showDailyChallengeComplete(score) {
    const width = this.game.config.width
    const height = this.game.config.height
    
    const panel = this.add.container(0, 0)
    panel.setDepth(400)
    
    const bg = this.add.rectangle(
      width / 2, height / 2,
      width * 0.85, 380,
      0x0d1117, 0.95
    )
    bg.setStrokeStyle(3, 0xfbbf24, 0.8)
    panel.add(bg)
    
    const title = this.add.text(width / 2, height / 2 - 145, '🔥 每日挑战完成！', {
      fontSize: '28px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    panel.add(title)
    
    const scoreInfo = this.add.text(width / 2, height / 2 - 90, `获得 ${score} 分`, {
      fontSize: '22px',
      fill: '#22c55e',
      fontStyle: 'bold'
    })
    scoreInfo.setOrigin(0.5)
    panel.add(scoreInfo)
    
    const maxComboInfo = this.add.text(width / 2, height / 2 - 55, `🔥 最高连击: ${this.maxCombo} 连`, {
      fontSize: '16px',
      fill: '#f97316',
      fontStyle: 'bold'
    })
    maxComboInfo.setOrigin(0.5)
    panel.add(maxComboInfo)
    
    const subtitle = this.add.text(width / 2, height / 2 - 20, '今日挑战已完成，明天再来！', {
      fontSize: '16px',
      fill: '#e2e8f0',
      align: 'center'
    })
    subtitle.setOrigin(0.5)
    panel.add(subtitle)
    
    const noReplay = this.add.text(width / 2, height / 2 + 15, '每日挑战仅可完成一次，不可重玩', {
      fontSize: '13px',
      fill: '#f87171'
    })
    noReplay.setOrigin(0.5)
    panel.add(noReplay)
    
    const streakInfo = this.add.text(width / 2, height / 2 + 50, '保持连续打卡，解锁更多奖励！', {
      fontSize: '14px',
      fill: '#fbbf24'
    })
    streakInfo.setOrigin(0.5)
    panel.add(streakInfo)
    
    const rewardHint = this.add.text(width / 2, height / 2 + 80, '🌟 连续7天 · 特殊徽章 + 主题皮肤', {
      fontSize: '13px',
      fill: '#a78bfa'
    })
    rewardHint.setOrigin(0.5)
    panel.add(rewardHint)
    
    const closeBtn = this.add.text(width / 2, height / 2 + 125, '✓ 确认', {
      fontSize: '18px',
      fill: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#92400e',
      padding: { x: 30, y: 12 }
    })
    closeBtn.setOrigin(0.5)
    closeBtn.setInteractive({ useHandCursor: true })
    
    closeBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          panel.destroy()
          if (this.onDailyComplete) {
            this.onDailyComplete(score)
          }
          if (this.onBackToStart) {
            this.time.delayedCall(300, () => {
              this.onBackToStart()
            })
          }
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
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })
    
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 80, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const color = [0xfbbf24, 0xf97316, 0xef4444, 0xa78bfa][Math.floor(Math.random() * 4)]
        
        this.add.particles(x, y, 'sparkle', {
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

  showGameComplete() {
    this.hintPanel.showGameComplete(this.totalScore, () => {
      this.currentLevelIndex = 0
      this.totalScore = 0
      this.hintPanel.score = 0
      this.loadLevel(0)
    })
  }

  update(time, delta) {
    if (this.bossLevelManager && this.bossLevelManager.isActive) {
      this.bossLevelManager.update(delta)
    }
  }

  onBossDamage(remainingHp) {
    this.isAnimating = false
    
    if (this.pathJudge) {
      this.pathJudge.resetPath()
    }
    
    this.tweens.killAllTweensOf(this.creature)
    
    const startPos = this.levelMap.getWorldPosition(
      this.levelMap.currentLevel.start.row,
      this.levelMap.currentLevel.start.col
    )
    
    if (this.creature) {
      this.tweens.add({
        targets: this.creature,
        x: startPos.x,
        y: startPos.y,
        angle: 0,
        alpha: 1,
        duration: 400,
        ease: 'Cubic.out',
        onComplete: () => {
          this.bossLevelManager.setCreature(this.creature)
        }
      })
    }
  }

  onBossGameOver() {
    this.isAnimating = true
    
    if (this.pathJudge) {
      this.pathJudge.resetPath()
    }
    
    this.tweens.killAllTweensOf(this.creature)
    
    if (this.bossLevelManager) {
      this.bossLevelManager.pause()
      this.bossLevelManager.showBossGameOver(
        () => {
          this.bossLevelManager.deactivate()
          this.loadLevel(this.currentLevelIndex)
        },
        () => {
          this.bossLevelManager.deactivate()
          this.isBossLevel = false
          if (this.onBackToStart) {
            this.onBackToStart()
          }
        }
      )
    }
  }

  destroy() {
    if (this.bossLevelManager) this.bossLevelManager.destroy()
    if (this.levelMap) this.levelMap = null
    if (this.plantState) this.plantState.destroy()
    if (this.pathJudge) this.pathJudge.destroy()
    if (this.effects) this.effects.destroy()
    if (this.hintPanel) this.hintPanel.destroy()
    if (this.tutorial) this.tutorial.destroy()
  }
}
