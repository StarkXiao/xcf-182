<template>
  <div class="app-root">
    <LevelEditor 
      v-if="mode === 'editor'" 
      @back="mode = 'start'" 
      @uploadSuccess="onLevelUploadSuccess"
    />
    <DailyChallenge
      v-else-if="mode === 'daily'"
      @back="mode = 'start'"
      @startChallenge="onStartDailyChallenge"
    />
    <Leaderboard
      v-else-if="mode === 'leaderboard'"
      @back="mode = 'start'"
    />
    <Workshop
      v-else-if="mode === 'workshop'"
      @back="mode = 'start'"
      @playLevel="startWorkshopLevel"
      @openEditor="openEditorFromWorkshop"
      :refresh-trigger="workshopRefreshTrigger"
      :upload-success="uploadSuccessFlag"
      :play-level-id="workshopPlayedLevelId"
    />
    <div v-else class="game-container">
      <div ref="gameContainer" id="phaser-game"></div>
      <div class="ui-layer">
        <div v-if="showStartScreen" class="start-screen">
          <div class="start-content">
            <h1 class="game-title">🍄 苔藓洞穴引路人</h1>
            <p class="game-subtitle">点亮荧光植物，为迷路生物指引回家的路</p>
            
            <div class="game-rules">
              <h3>🎮 游戏玩法</h3>
              <ul>
                <li>✨ 从起点（绿色）拖动到终点（紫色）</li>
                <li>🌿 沿途的荧光植物会被点亮</li>
                <li>🪨 避开灰色的岩石障碍物</li>
                <li>⭐ 点亮越多植物，得分越高</li>
              </ul>
            </div>
            
            <div class="plant-legend">
              <h3>🌱 植物图鉴</h3>
              <div class="legend-items">
                <div class="legend-item">
                  <span class="plant-icon moss"></span>
                  <span>苔藓 (10分)</span>
                </div>
                <div class="legend-item">
                  <span class="plant-icon mushroom"></span>
                  <span>荧光蘑菇 (20分)</span>
                </div>
                <div class="legend-item">
                  <span class="plant-icon flower"></span>
                  <span>夜光花 (30分)</span>
                </div>
              </div>
            </div>
            
            <div class="button-group">
              <button @click="startStoryMode" class="story-btn">
                📖 故事模式
              </button>
              <button @click="startGame" class="start-btn">
                🚀 自由冒险
              </button>
              <button @click="openDailyChallenge" class="daily-btn">
                🔥 每日挑战
              </button>
              <div class="random-section">
                <button @click="startRandomMode" class="random-btn">
                  🎲 随机挑战
                </button>
                <div class="difficulty-selector">
                  <span class="diff-label">难度：</span>
                  <button 
                    v-for="n in 5" 
                    :key="n" 
                    class="diff-btn"
                    :class="{ active: randomDifficulty === n }"
                    @click="randomDifficulty = n"
                  >
                    {{ ['入门','简单','普通','困难','专家'][n-1] }}
                  </button>
                </div>
              </div>
              <button @click="startVersusMode" class="versus-btn">
                ⚔️ 双人对战
              </button>
              <button @click="openEditor" class="editor-btn">
                🎨 关卡编辑器
              </button>
              <button @click="openLeaderboard" class="leaderboard-btn">
                🏆 排行榜
              </button>
              <button @click="openWorkshop" class="workshop-btn">
                🎨 创意工坊
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Game } from './game/Game.js'
import LevelEditor from './components/LevelEditor.vue'
import DailyChallenge from './components/DailyChallenge.vue'
import Leaderboard from './components/Leaderboard.vue'
import Workshop from './components/Workshop.vue'
import { generateDailyLevel, isTodayCompleted, markTodayCompleted } from './game/data/dailyChallenge.js'
import { getWorkshopService } from './game/modules/WorkshopService.js'

const mode = ref('start')
const gameContainer = ref(null)
const showStartScreen = ref(true)
const randomDifficulty = ref(3)
const workshopRefreshTrigger = ref(0)
const uploadSuccessFlag = ref(false)
const workshopPlayedLevelId = ref(null)
let gameInstance = null
let dailyChallengeLevel = null
let currentWorkshopLevel = null

const workshopService = getWorkshopService()

const startGame = () => {
  showStartScreen.value = false
  mode.value = 'game'
  dailyChallengeLevel = null
  
  setTimeout(() => {
    if (gameContainer.value) {
      gameInstance = new Game(gameContainer.value, { 
        isDailyChallenge: false,
        isStoryMode: false 
      })
    }
  }, 100)
}

const startStoryMode = () => {
  showStartScreen.value = false
  mode.value = 'game'
  dailyChallengeLevel = null
  
  setTimeout(() => {
    if (gameContainer.value) {
      gameInstance = new Game(gameContainer.value, { 
        isDailyChallenge: false,
        isStoryMode: true,
        onStoryComplete: (score) => {
          console.log('故事模式完成，得分:', score)
        },
        onBackToStart: () => {
          backToStart()
        }
      })
    }
  }, 100)
}

const startRandomMode = () => {
  showStartScreen.value = false
  mode.value = 'game'
  dailyChallengeLevel = null
  
  setTimeout(() => {
    if (gameContainer.value) {
      gameInstance = new Game(gameContainer.value, { 
        isDailyChallenge: false,
        isStoryMode: false,
        isRandomMode: true,
        difficulty: randomDifficulty.value,
        onBackToStart: () => {
          backToStart()
        }
      })
    }
  }, 100)
}

const openDailyChallenge = () => {
  mode.value = 'daily'
}

const onStartDailyChallenge = (levelData) => {
  if (isTodayCompleted()) {
    return
  }

  dailyChallengeLevel = levelData
  showStartScreen.value = false
  mode.value = 'game'
  
  setTimeout(() => {
    if (gameContainer.value) {
      gameInstance = new Game(gameContainer.value, {
        isDailyChallenge: true,
        isStoryMode: false,
        dailyLevel: levelData,
        onDailyComplete: (score) => {
          markTodayCompleted(score)
        },
        onBackToStart: () => {
          backToStart()
        }
      })
    }
  }, 100)
}

const backToStart = () => {
  if (gameInstance) {
    gameInstance.destroy()
    gameInstance = null
  }
  mode.value = 'start'
  showStartScreen.value = true
}

const startVersusMode = () => {
  showStartScreen.value = false
  mode.value = 'game'
  dailyChallengeLevel = null
  
  setTimeout(() => {
    if (gameContainer.value) {
      gameInstance = new Game(gameContainer.value, { 
        isVersusMode: true,
        maxTime: 120,
        onBackToStart: () => {
          backToStart()
        }
      })
    }
  }, 100)
}

const openEditor = () => {
  mode.value = 'editor'
}

const openLeaderboard = () => {
  mode.value = 'leaderboard'
}

const openWorkshop = () => {
  mode.value = 'workshop'
}

const openEditorFromWorkshop = () => {
  mode.value = 'editor'
}

async function startWorkshopLevel(workshopLevel) {
  if (!workshopLevel) return
  
  currentWorkshopLevel = workshopLevel
  
  await workshopService.incrementPlayCount(workshopLevel.id)
  
  workshopPlayedLevelId.value = workshopLevel.id
  setTimeout(() => { workshopPlayedLevelId.value = null }, 0)
  
  const gameLevel = workshopService.convertToGameLevel(workshopLevel)
  
  showStartScreen.value = false
  mode.value = 'game'
  
  setTimeout(() => {
    if (gameContainer.value) {
      gameInstance = new Game(gameContainer.value, {
        isDailyChallenge: false,
        isStoryMode: false,
        isWorkshopMode: true,
        workshopLevel: gameLevel,
        onBackToStart: () => {
          backToStart()
        }
      })
    }
  }, 100)
}

function onLevelUploadSuccess() {
  uploadSuccessFlag.value = true
  setTimeout(() => {
    uploadSuccessFlag.value = false
  }, 100)
  workshopRefreshTrigger.value++
}

onMounted(() => {
})

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy()
    gameInstance = null
  }
})
</script>

<style scoped>
.start-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
  z-index: 1000;
  overflow-y: auto;
}

.start-content {
  text-align: center;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.game-title {
  font-size: 2.5rem;
  color: #60a5fa;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(96, 165, 250, 0.5);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px rgba(96, 165, 250, 0.5),
                 0 0 20px rgba(96, 165, 250, 0.3);
  }
  to {
    text-shadow: 0 0 20px rgba(96, 165, 250, 0.8),
                 0 0 40px rgba(96, 165, 250, 0.5),
                 0 0 60px rgba(147, 197, 253, 0.3);
  }
}

.game-subtitle {
  font-size: 1.1rem;
  color: #a78bfa;
  margin-bottom: 30px;
  opacity: 0.9;
}

.game-rules, .plant-legend {
  background: rgba(13, 17, 23, 0.8);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  text-align: left;
}

.game-rules h3, .plant-legend h3 {
  color: #fbbf24;
  margin-bottom: 15px;
  font-size: 1.2rem;
  text-align: center;
}

.game-rules ul {
  list-style: none;
  padding: 0;
}

.game-rules li {
  color: #e2e8f0;
  padding: 8px 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.legend-items {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.plant-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
}

.plant-icon.moss {
  background: #4ade80;
  box-shadow: 0 0 10px #22c55e;
}

.plant-icon.mushroom {
  background: #f472b6;
  box-shadow: 0 0 10px #ec4899;
}

.plant-icon.flower {
  background: #60a5fa;
  box-shadow: 0 0 10px #3b82f6;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
}

.start-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 15px 50px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  min-width: 240px;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(59, 130, 246, 0.6);
}

.start-btn:active {
  transform: translateY(0);
}

.story-btn {
  background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 15px 50px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(167, 139, 250, 0.4);
  min-width: 240px;
  animation: storyGlow 2s ease-in-out infinite alternate;
}

.story-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(167, 139, 250, 0.6);
}

.story-btn:active {
  transform: translateY(0);
}

@keyframes storyGlow {
  from {
    box-shadow: 0 4px 15px rgba(167, 139, 250, 0.4);
  }
  to {
    box-shadow: 0 4px 25px rgba(167, 139, 250, 0.7), 0 0 40px rgba(192, 132, 252, 0.2);
  }
}

.versus-btn {
  background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%);
  color: white;
  border: none;
  padding: 15px 50px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  min-width: 240px;
  animation: versusGlow 2s ease-in-out infinite alternate;
}

.versus-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6);
}

.versus-btn:active {
  transform: translateY(0);
}

@keyframes versusGlow {
  from {
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  }
  to {
    box-shadow: 0 4px 25px rgba(239, 68, 68, 0.7), 0 0 40px rgba(249, 115, 22, 0.3);
  }
}

.editor-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 40px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  min-width: 240px;
}

.editor-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.6);
}

.editor-btn:active {
  transform: translateY(0);
}

.leaderboard-btn {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border: none;
  padding: 12px 40px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
  min-width: 240px;
  animation: leaderboardGlow 2s ease-in-out infinite alternate;
}

.leaderboard-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(251, 191, 36, 0.6);
}

.leaderboard-btn:active {
  transform: translateY(0);
}

@keyframes leaderboardGlow {
  from {
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
  }
  to {
    box-shadow: 0 4px 25px rgba(251, 191, 36, 0.7), 0 0 40px rgba(251, 191, 36, 0.2);
  }
}

.workshop-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border: none;
  padding: 12px 40px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  min-width: 240px;
  animation: workshopGlow 2s ease-in-out infinite alternate;
}

.workshop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(139, 92, 246, 0.6);
}

.workshop-btn:active {
  transform: translateY(0);
}

@keyframes workshopGlow {
  from {
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  }
  to {
    box-shadow: 0 4px 25px rgba(139, 92, 246, 0.7), 0 0 40px rgba(236, 72, 153, 0.2);
  }
}

.random-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.random-btn {
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 15px 50px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  min-width: 240px;
  animation: randomGlow 2s ease-in-out infinite alternate;
}

.random-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(236, 72, 153, 0.6);
}

.random-btn:active {
  transform: translateY(0);
}

@keyframes randomGlow {
  from {
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  }
  to {
    box-shadow: 0 4px 25px rgba(236, 72, 153, 0.7), 0 0 40px rgba(167, 139, 250, 0.3);
  }
}

.difficulty-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px 16px;
  background: rgba(13, 17, 23, 0.6);
  border-radius: 25px;
  border: 1px solid rgba(236, 72, 153, 0.2);
}

.diff-label {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-right: 4px;
}

.diff-btn {
  background: transparent;
  color: #9ca3af;
  border: 1px solid rgba(75, 85, 99, 0.5);
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.diff-btn:hover {
  border-color: rgba(236, 72, 153, 0.5);
  color: #e5e7eb;
}

.diff-btn.active {
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
}

.daily-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 15px 50px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
  min-width: 240px;
  animation: fireGlow 2s ease-in-out infinite alternate;
}

.daily-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(245, 158, 11, 0.6);
}

.daily-btn:active {
  transform: translateY(0);
}

@keyframes fireGlow {
  from {
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
  }
  to {
    box-shadow: 0 4px 25px rgba(245, 158, 11, 0.7), 0 0 40px rgba(251, 191, 36, 0.3);
  }
}

@media (max-width: 600px) {
  .game-title {
    font-size: 1.8rem;
  }
  
  .game-subtitle {
    font-size: 1rem;
  }
  
  .start-content {
    padding: 20px;
  }
  
  .game-rules, .plant-legend {
    padding: 15px;
  }
  
  .legend-items {
    flex-direction: column;
    align-items: center;
  }
}
</style>
