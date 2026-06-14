<template>
  <div class="leaderboard-page">
    <div class="leaderboard-header">
      <button class="back-btn" @click="$emit('back')">
        ← 返回
      </button>
      <h2 class="leaderboard-title">🏆 排行榜</h2>
      <div class="header-spacer"></div>
    </div>

    <div class="nickname-section">
      <div class="nickname-label">我的昵称：</div>
      <div class="nickname-display">
        <input 
          v-model="nicknameInput" 
          class="nickname-input"
          @blur="updateNickname"
          @keyup.enter="updateNickname"
          maxlength="12"
          placeholder="输入昵称"
        />
        <button class="refresh-nickname-btn" @click="refreshNickname" title="随机一个">
          🎲
        </button>
      </div>
    </div>

    <div class="level-selector">
      <div class="level-scroll">
        <button
          v-for="level in levels"
          :key="level.id"
          class="level-btn"
          :class="{ active: selectedLevel === level.id }"
          @click="selectLevel(level.id)"
        >
          <span class="level-num">第{{ level.id }}关</span>
          <span class="level-name">{{ level.name }}</span>
        </button>
      </div>
    </div>

    <div class="my-best-score" v-if="myBestScore">
      <div class="best-label">我的最佳</div>
      <div class="best-score">{{ myBestScore.score }} 分</div>
      <div class="best-time">⏱ {{ formatTime(myBestScore.time) }}</div>
      <div class="best-rank" v-if="myRank">
        排名：第 {{ myRank }} 名
      </div>
    </div>

    <div class="leaderboard-list-container">
      <div class="list-header">
        <span class="col-rank">排名</span>
        <span class="col-player">玩家</span>
        <span class="col-score">得分</span>
        <span class="col-time">用时</span>
      </div>
      
      <div class="list-loading" v-if="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div class="list-empty" v-else-if="scores.length === 0">
        <div class="empty-icon">📭</div>
        <p>暂无记录</p>
        <p class="empty-tip">快来成为第一个上榜的玩家吧！</p>
      </div>

      <div class="list-content" v-else>
        <div
          v-for="(item, index) in scores"
          :key="index"
          class="list-item"
          :class="{ 
            'top-1': index === 0,
            'top-2': index === 1,
            'top-3': index === 2,
            'is-mine': item.nickname === currentNickname
          }"
        >
          <span class="col-rank">
            <span v-if="index === 0" class="medal">🥇</span>
            <span v-else-if="index === 1" class="medal">🥈</span>
            <span v-else-if="index === 2" class="medal">🥉</span>
            <span v-else class="rank-num">{{ index + 1 }}</span>
          </span>
          <span class="col-player">
            <span class="player-name">{{ item.nickname }}</span>
            <span v-if="item.nickname === currentNickname" class="mine-tag">我</span>
          </span>
          <span class="col-score">{{ item.score }} 分</span>
          <span class="col-time">⏱ {{ formatTime(item.time) }}</span>
        </div>
      </div>
    </div>

    <div class="backend-info">
      <span class="backend-label">数据存储：</span>
      <span class="backend-type">{{ backendTypeLabel }}</span>
      <span class="backend-hint" v-if="backendType === 'local'">(本地存储)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getLeaderboardService, generateRandomNickname } from '../game/modules/LeaderboardService.js'
import { LEVELS } from '../game/data/levels.js'

const emit = defineEmits(['back'])

const leaderboardService = getLeaderboardService()
const levels = LEVELS

const selectedLevel = ref(1)
const scores = ref([])
const loading = ref(false)
const myBestScore = ref(null)
const myRank = ref(null)
const nicknameInput = ref('')
const currentNickname = ref('')

const backendType = computed(() => leaderboardService.getBackendType())

const backendTypeLabel = computed(() => {
  const labels = {
    local: '本地存储',
    leancloud: 'LeanCloud',
    supabase: 'Supabase'
  }
  return labels[backendType.value] || '本地存储'
})

function formatTime(seconds) {
  return leaderboardService.formatTime(seconds)
}

async function loadLeaderboard() {
  loading.value = true
  try {
    const topScores = await leaderboardService.getTopScores(selectedLevel.value, 50)
    scores.value = topScores
    
    const best = await leaderboardService.getUserBestScore(selectedLevel.value)
    myBestScore.value = best
    
    if (best) {
      const rank = topScores.findIndex(s => 
        s.nickname === currentNickname.value && 
        s.score === best.score && 
        s.time === best.time
      )
      myRank.value = rank >= 0 ? rank + 1 : null
    } else {
      myRank.value = null
    }
  } catch (e) {
    console.error('Failed to load leaderboard:', e)
    scores.value = []
    myBestScore.value = null
  } finally {
    loading.value = false
  }
}

function selectLevel(levelId) {
  selectedLevel.value = levelId
  loadLeaderboard()
}

function refreshNickname() {
  const newName = leaderboardService.generateNewNickname()
  nicknameInput.value = newName
  currentNickname.value = newName
  loadLeaderboard()
}

function updateNickname() {
  const trimmed = nicknameInput.value.trim()
  if (trimmed && trimmed !== currentNickname.value) {
    leaderboardService.setNickname(trimmed)
    currentNickname.value = trimmed
    loadLeaderboard()
  } else {
    nicknameInput.value = currentNickname.value
  }
}

onMounted(() => {
  currentNickname.value = leaderboardService.getNickname()
  nicknameInput.value = currentNickname.value
  loadLeaderboard()
})
</script>

<style scoped>
.leaderboard-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  overflow: hidden;
}

.leaderboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  background: rgba(13, 17, 23, 0.9);
  border-bottom: 1px solid rgba(96, 165, 250, 0.3);
  flex-shrink: 0;
}

.back-btn {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(96, 165, 250, 0.25);
  border-color: rgba(96, 165, 250, 0.5);
}

.leaderboard-title {
  font-size: 22px;
  color: #fbbf24;
  margin: 0;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.header-spacer {
  width: 80px;
}

.nickname-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(13, 17, 23, 0.7);
  flex-shrink: 0;
}

.nickname-label {
  color: #94a3b8;
  font-size: 14px;
}

.nickname-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-input {
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(167, 139, 250, 0.4);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  width: 160px;
  text-align: center;
  outline: none;
  transition: all 0.2s;
}

.nickname-input:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
}

.refresh-nickname-btn {
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.3);
  color: #ec4899;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-nickname-btn:hover {
  background: rgba(236, 72, 153, 0.3);
  transform: scale(1.1);
}

.level-selector {
  flex-shrink: 0;
  background: rgba(13, 17, 23, 0.5);
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
}

.level-scroll {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(96, 165, 250, 0.3) transparent;
}

.level-scroll::-webkit-scrollbar {
  height: 4px;
}

.level-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.level-scroll::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.3);
  border-radius: 2px;
}

.level-btn {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 16px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.level-btn:hover {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
}

.level-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
}

.level-num {
  font-size: 11px;
  color: #94a3b8;
}

.level-btn.active .level-num {
  color: rgba(255, 255, 255, 0.8);
}

.level-name {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.level-btn.active .level-name {
  color: white;
}

.my-best-score {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%);
  border-bottom: 1px solid rgba(167, 139, 250, 0.2);
}

.best-label {
  font-size: 12px;
  color: #a78bfa;
  font-weight: 600;
}

.best-score {
  font-size: 18px;
  font-weight: bold;
  color: #fbbf24;
}

.best-time {
  font-size: 13px;
  color: #22c55e;
}

.best-rank {
  font-size: 13px;
  color: #60a5fa;
}

.leaderboard-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.list-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 90px;
  align-items: center;
  padding: 12px 16px;
  background: rgba(13, 17, 23, 0.8);
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
  margin-top: 12px;
}

.list-header span {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.col-rank {
  text-align: center;
}

.col-player {
  text-align: left;
  padding-left: 8px;
}

.col-score {
  text-align: right;
}

.col-time {
  text-align: right;
}

.list-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(96, 165, 250, 0.2);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.list-empty p {
  color: #64748b;
  margin: 4px 0;
  font-size: 14px;
}

.empty-tip {
  color: #475569 !important;
  font-size: 12px !important;
}

.list-content {
  padding-bottom: 20px;
}

.list-item {
  display: grid;
  grid-template-columns: 60px 1fr 80px 90px;
  align-items: center;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.4);
  border-bottom: 1px solid rgba(96, 165, 250, 0.1);
  transition: background 0.2s;
}

.list-item:last-child {
  border-bottom: none;
  border-radius: 0 0 10px 10px;
}

.list-item:hover {
  background: rgba(96, 165, 250, 0.1);
}

.list-item.top-1 {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.15) 0%, rgba(30, 41, 59, 0.4) 30%);
}

.list-item.top-2 {
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.15) 0%, rgba(30, 41, 59, 0.4) 30%);
}

.list-item.top-3 {
  background: linear-gradient(90deg, rgba(217, 119, 6, 0.15) 0%, rgba(30, 41, 59, 0.4) 30%);
}

.list-item.is-mine {
  background: linear-gradient(90deg, rgba(167, 139, 250, 0.2) 0%, rgba(30, 41, 59, 0.4) 30%);
}

.medal {
  font-size: 24px;
  display: block;
  text-align: center;
}

.rank-num {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  display: block;
  text-align: center;
}

.player-name {
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 500;
}

.mine-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background: rgba(167, 139, 250, 0.2);
  color: #a78bfa;
  font-size: 10px;
  border-radius: 4px;
  font-weight: 600;
}

.list-item .col-score {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.list-item .col-time {
  font-size: 13px;
  color: #22c55e;
}

.backend-info {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: rgba(13, 17, 23, 0.8);
  border-top: 1px solid rgba(96, 165, 250, 0.2);
}

.backend-label {
  font-size: 12px;
  color: #64748b;
}

.backend-type {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.backend-hint {
  font-size: 11px;
  color: #475569;
}

@media (max-width: 480px) {
  .list-header {
    grid-template-columns: 50px 1fr 65px 75px;
    padding: 10px 12px;
  }
  
  .list-item {
    grid-template-columns: 50px 1fr 65px 75px;
    padding: 10px 12px;
  }
  
  .col-score {
    font-size: 12px !important;
  }
  
  .col-time {
    font-size: 11px !important;
  }
  
  .player-name {
    font-size: 13px;
  }
  
  .my-best-score {
    gap: 12px;
    flex-wrap: wrap;
  }
}
</style>
