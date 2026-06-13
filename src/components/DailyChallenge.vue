<template>
  <div class="daily-challenge-container">
    <div class="dc-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <h1 class="dc-title">🔥 每日挑战</h1>
      <div class="streak-badge">
        <span class="streak-fire">🔥</span>
        <span class="streak-count">{{ challengeState.currentStreak }}</span>
        <span class="streak-label">连续天数</span>
      </div>
    </div>

    <div class="dc-body">
      <div class="dc-main">
        <div class="today-card" :class="{ completed: todayCompleted }">
          <div class="card-header">
            <span class="date-badge">{{ todayStr }}</span>
            <span v-if="todayCompleted" class="completed-tag">✅ 已完成</span>
            <span v-else class="pending-tag">⏳ 待挑战</span>
          </div>

          <div class="level-preview">
            <div class="preview-grid" :style="previewGridStyle">
              <div
                v-for="cell in previewCells"
                :key="cell.key"
                class="preview-cell"
                :class="cell.cssClass"
              ></div>
            </div>
          </div>

          <div class="level-info">
            <h2 class="level-name">{{ dailyLevel?.name || '加载中...' }}</h2>
            <p class="level-desc">{{ dailyLevel?.description }}</p>
          </div>

          <button
            v-if="!todayCompleted"
            class="challenge-btn"
            @click="startChallenge"
          >
            ⚔️ 开始挑战
          </button>
          <div v-else class="completed-info">
            <p class="done-text">今日挑战已完成！明天再来 🎉</p>
            <p class="best-score" v-if="challengeState.bestScore > 0">最高分: ⭐ {{ challengeState.bestScore }}</p>
          </div>
        </div>

        <div class="streak-section">
          <h3 class="section-title">📅 打卡进度</h3>
          <div class="streak-track">
            <div
              v-for="day in 7"
              :key="day"
              class="streak-day"
              :class="{
                active: challengeState.currentStreak >= day,
                current: challengeState.currentStreak === day - 1 && !todayCompleted
              }"
            >
              <div class="day-circle">
                <span v-if="challengeState.currentStreak >= day">✓</span>
                <span v-else>{{ day }}</span>
              </div>
              <span class="day-label">第{{ day }}天</span>
            </div>
            <div class="streak-reward" :class="{ unlocked: challengeState.currentStreak >= 7 }">
              <div class="reward-circle">
                <span>🌟</span>
              </div>
              <span class="day-label">徽章+皮肤</span>
            </div>
          </div>
          <p class="streak-hint" v-if="daysUntilNext > 0">
            还需连续打卡 <strong>{{ daysUntilNext }}</strong> 天即可解锁下个奖励
          </p>
          <p class="streak-hint streak-complete" v-else-if="challengeState.currentStreak >= 7">
            🎉 已解锁7天连续打卡奖励！
          </p>
        </div>
      </div>

      <div class="dc-sidebar">
        <div class="panel">
          <h3>🎖 我的徽章</h3>
          <div class="badges-grid">
            <div
              v-for="badge in allBadges"
              :key="badge.id"
              class="badge-item"
              :class="{ earned: badge.earned }"
            >
              <span class="badge-icon">{{ badge.icon }}</span>
              <span class="badge-name">{{ badge.name }}</span>
              <span class="badge-desc" v-if="badge.earned">{{ badge.description }}</span>
              <span class="badge-locked" v-else>🔒 未解锁</span>
            </div>
            <div v-if="allBadges.length === 0" class="empty-hint">
              完成每日挑战来获取徽章
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>🎨 主题皮肤</h3>
          <div class="skins-list">
            <div
              v-for="skin in allSkins"
              :key="skin.id"
              class="skin-item"
              :class="{ unlocked: skin.unlocked, active: activeSkin === skin.id }"
              @click="selectSkin(skin)"
            >
              <span class="skin-icon">{{ skin.icon }}</span>
              <div class="skin-info">
                <span class="skin-name">{{ skin.name }}</span>
                <span class="skin-desc">{{ skin.description }}</span>
              </div>
              <span v-if="skin.unlocked && activeSkin !== skin.id" class="skin-apply">应用</span>
              <span v-if="activeSkin === skin.id" class="skin-active">使用中</span>
              <span v-if="!skin.unlocked" class="skin-lock">🔒</span>
            </div>
            <div
              class="skin-item default-skin"
              :class="{ active: activeSkin === 'default' }"
              @click="selectSkin({ id: 'default', unlocked: true })"
            >
              <span class="skin-icon">🍄</span>
              <div class="skin-info">
                <span class="skin-name">默认主题</span>
                <span class="skin-desc">苔藓洞穴原始风格</span>
              </div>
              <span v-if="activeSkin === 'default'" class="skin-active">使用中</span>
              <span v-else class="skin-apply">应用</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>📊 挑战统计</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">累计完成</span>
              <span class="stat-value">{{ challengeState.completedDates.length }} 天</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">当前连续</span>
              <span class="stat-value highlight">{{ challengeState.currentStreak }} 天</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最高分</span>
              <span class="stat-value">⭐ {{ challengeState.bestScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已获徽章</span>
              <span class="stat-value">{{ challengeState.badges.length }} / {{ Object.keys(BADGE_INFO).length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  generateDailyLevel,
  isTodayCompleted,
  getTodayStr,
  getChallengeState,
  getDaysUntilNextStreak,
  BADGE_INFO,
  THEME_SKIN_INFO
} from '../game/data/dailyChallenge.js'

const emit = defineEmits(['back', 'startChallenge'])

const todayStr = ref(getTodayStr())
const todayCompleted = ref(false)
const dailyLevel = ref(null)
const challengeState = ref({
  completedDates: [],
  currentStreak: 0,
  badges: [],
  themeSkins: [],
  bestScore: 0
})
const daysUntilNext = ref(0)
const activeSkin = ref('default')

const allBadges = computed(() => {
  return Object.entries(BADGE_INFO).map(([id, info]) => ({
    id,
    name: info.name,
    icon: info.icon,
    description: info.description,
    earned: challengeState.value.badges.includes(id)
  }))
})

const allSkins = computed(() => {
  return Object.entries(THEME_SKIN_INFO).map(([id, info]) => ({
    id,
    name: info.name,
    icon: info.icon,
    description: info.description,
    colors: info.colors,
    unlocked: challengeState.value.themeSkins.includes(id)
  }))
})

const previewGridStyle = computed(() => {
  if (!dailyLevel.value) return {}
  const { rows, cols } = dailyLevel.value.gridSize
  return {
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gridTemplateColumns: `repeat(${cols}, 1fr)`
  }
})

const previewCells = computed(() => {
  if (!dailyLevel.value) return []
  const level = dailyLevel.value
  const { rows, cols } = level.gridSize
  const cells = []

  const obstacleSet = new Set(level.obstacles.map(o => `${o.row},${o.col}`))
  const plantMap = {}
  level.plants.forEach(p => { plantMap[`${p.row},${p.col}`] = p.type })
  const pathSet = new Set(level.correctPath.map(p => `${p.row},${p.col}`))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`
      let cssClass = 'cell-empty'
      if (r === level.start.row && c === level.start.col) cssClass = 'cell-start'
      else if (r === level.end.row && c === level.end.col) cssClass = 'cell-end'
      else if (obstacleSet.has(key)) cssClass = 'cell-obstacle'
      else if (pathSet.has(key)) cssClass = 'cell-path'
      else if (plantMap[key]) cssClass = `cell-plant-${plantMap[key]}`

      cells.push({ key, cssClass })
    }
  }
  return cells
})

function refreshState() {
  todayCompleted.value = isTodayCompleted()
  challengeState.value = getChallengeState()
  daysUntilNext.value = getDaysUntilNextStreak()

  const savedSkin = localStorage.getItem('moss_cave_active_skin')
  activeSkin.value = savedSkin || 'default'
}

function selectSkin(skin) {
  if (!skin.unlocked) return
  activeSkin.value = skin.id
  localStorage.setItem('moss_cave_active_skin', skin.id)
}

function startChallenge() {
  if (!dailyLevel.value) return
  if (isTodayCompleted()) {
    todayCompleted.value = true
    return
  }
  emit('startChallenge', dailyLevel.value)
}

onMounted(() => {
  dailyLevel.value = generateDailyLevel(todayStr.value)
  refreshState()
})
</script>

<style scoped>
.daily-challenge-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
  color: #e2e8f0;
  overflow: hidden;
}

.dc-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: rgba(13, 17, 23, 0.95);
  border-bottom: 1px solid rgba(251, 191, 36, 0.3);
  z-index: 100;
}

.back-btn {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.4);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(96, 165, 250, 0.3);
  border-color: #60a5fa;
}

.dc-title {
  font-size: 1.5rem;
  margin: 0;
  color: #fbbf24;
  text-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  flex: 1;
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 50px;
  padding: 8px 18px;
}

.streak-fire {
  font-size: 1.3rem;
}

.streak-count {
  font-size: 1.4rem;
  font-weight: bold;
  color: #fbbf24;
}

.streak-label {
  font-size: 0.85rem;
  color: #fcd34d;
}

.dc-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.dc-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dc-sidebar {
  width: 320px;
  padding: 16px;
  overflow-y: auto;
  background: rgba(13, 17, 23, 0.6);
  border-left: 1px solid rgba(251, 191, 36, 0.15);
}

.today-card {
  background: rgba(15, 23, 42, 0.8);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid rgba(251, 191, 36, 0.3);
  transition: all 0.3s;
}

.today-card.completed {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.date-badge {
  background: rgba(251, 191, 36, 0.2);
  color: #fcd34d;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.completed-tag {
  color: #4ade80;
  font-weight: 600;
  font-size: 0.9rem;
}

.pending-tag {
  color: #fbbf24;
  font-weight: 600;
  font-size: 0.9rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.level-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.preview-grid {
  display: grid;
  gap: 2px;
  width: 240px;
  height: 240px;
  background: rgba(13, 17, 23, 0.9);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.preview-cell {
  border-radius: 2px;
  background: rgba(30, 41, 59, 0.6);
}

.preview-cell.cell-start {
  background: rgba(34, 197, 94, 0.7);
  border-radius: 4px;
}

.preview-cell.cell-end {
  background: rgba(139, 92, 246, 0.7);
  border-radius: 4px;
}

.preview-cell.cell-obstacle {
  background: rgba(100, 116, 139, 0.6);
}

.preview-cell.cell-path {
  background: rgba(59, 130, 246, 0.3);
}

.preview-cell.cell-plant-moss {
  background: rgba(74, 222, 128, 0.35);
}

.preview-cell.cell-plant-mushroom {
  background: rgba(244, 114, 182, 0.35);
}

.preview-cell.cell-plant-flower {
  background: rgba(96, 165, 250, 0.35);
}

.level-info {
  text-align: center;
  margin-bottom: 20px;
}

.level-name {
  font-size: 1.4rem;
  color: #fbbf24;
  margin: 0 0 8px;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.level-desc {
  color: #94a3b8;
  margin: 0;
  font-size: 0.95rem;
}

.challenge-btn {
  display: block;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.challenge-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(245, 158, 11, 0.6);
}

.challenge-btn:active {
  transform: translateY(0);
}

.completed-info {
  text-align: center;
  padding: 12px;
}

.done-text {
  color: #4ade80;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px;
}

.best-score {
  color: #fbbf24;
  font-size: 0.95rem;
  margin: 0;
}

.streak-section {
  background: rgba(15, 23, 42, 0.8);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.section-title {
  color: #fbbf24;
  margin: 0 0 20px;
  font-size: 1.1rem;
  text-align: center;
}

.streak-track {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.streak-day,
.streak-reward {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.day-circle,
.reward-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  border: 2px solid rgba(100, 116, 139, 0.4);
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  transition: all 0.3s;
}

.streak-day.active .day-circle {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #fbbf24;
  color: white;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
}

.streak-day.current .day-circle {
  border-color: #fbbf24;
  animation: pulse 1.5s ease-in-out infinite;
}

.streak-reward .reward-circle {
  width: 52px;
  height: 52px;
  font-size: 1.4rem;
  border: 2px dashed rgba(100, 116, 139, 0.4);
}

.streak-reward.unlocked .reward-circle {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  border: 2px solid #c4b5fd;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.day-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.streak-hint {
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0;
}

.streak-hint strong {
  color: #fbbf24;
}

.streak-complete {
  color: #4ade80;
}

.panel {
  background: rgba(15, 23, 42, 0.8);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #fbbf24;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.15);
}

.badges-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.badge-item.earned {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
}

.badge-icon {
  font-size: 1.5rem;
  min-width: 32px;
  text-align: center;
}

.badge-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.badge-desc {
  font-size: 0.75rem;
  color: #4ade80;
}

.badge-locked {
  font-size: 0.75rem;
  color: #64748b;
}

.badge-item:not(.earned) .badge-icon {
  filter: grayscale(1);
  opacity: 0.5;
}

.empty-hint {
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
  padding: 16px;
}

.skins-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skin-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.skin-item.unlocked {
  cursor: pointer;
}

.skin-item.unlocked:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(96, 165, 250, 0.3);
}

.skin-item.active,
.skin-item.default-skin.active {
  background: rgba(96, 165, 250, 0.2);
  border-color: #60a5fa;
}

.skin-item:not(.unlocked):not(.default-skin) {
  opacity: 0.5;
  cursor: not-allowed;
}

.skin-icon {
  font-size: 1.5rem;
  min-width: 32px;
  text-align: center;
}

.skin-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.skin-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.skin-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}

.skin-apply {
  font-size: 0.8rem;
  color: #60a5fa;
  font-weight: 600;
}

.skin-active {
  font-size: 0.8rem;
  color: #22c55e;
  font-weight: 600;
}

.skin-lock {
  font-size: 1rem;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 6px;
  font-size: 13px;
}

.stat-label {
  color: #94a3b8;
}

.stat-value {
  color: #e2e8f0;
  font-weight: 600;
}

.stat-value.highlight {
  color: #fbbf24;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(251, 191, 36, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 191, 36, 0.5);
}

@media (max-width: 768px) {
  .dc-body {
    flex-direction: column;
  }

  .dc-sidebar {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(251, 191, 36, 0.15);
  }

  .streak-track {
    flex-wrap: wrap;
  }

  .dc-header {
    flex-wrap: wrap;
  }
}
</style>
