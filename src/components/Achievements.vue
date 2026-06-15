<template>
  <div class="achievements-page">
    <div class="achievements-container">
      <div class="achievements-header">
        <button class="back-btn" @click="$emit('back')">
          ← 返回
        </button>
        <h2 class="page-title">🏆 成就系统</h2>
        <div class="progress-info">
          <span class="progress-count">{{ unlockedCount }} / {{ totalCount }}</span>
          <span class="progress-label">已解锁</span>
        </div>
      </div>

      <div class="progress-bar-container">
        <div 
          class="progress-bar-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>

      <div class="category-tabs">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          class="tab-btn"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>

      <div class="achievements-grid">
        <div 
          v-for="achievement in filteredAchievements" 
          :key="achievement.id"
          class="achievement-card"
          :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
        >
          <div class="achievement-icon" :style="{ borderColor: achievement.color }">
            <span class="icon-text">{{ achievement.unlocked ? achievement.icon : '🔒' }}</span>
          </div>
          <div class="achievement-info">
            <h3 class="achievement-name" :style="{ color: achievement.unlocked ? achievement.color : '#64748b' }">
              {{ achievement.name }}
            </h3>
            <p class="achievement-desc">{{ achievement.description }}</p>
            <p v-if="achievement.unlocked && achievement.unlockedAt" class="achievement-date">
              {{ formatDate(achievement.unlockedAt) }} 解锁
            </p>
            <p v-else class="achievement-locked">尚未解锁</p>
          </div>
          <div v-if="achievement.unlocked" class="unlocked-badge">
            ✓
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAchievementManager } from '../game/modules/AchievementManager.js'

const emit = defineEmits(['back'])

const achievements = ref([])
const activeCategory = ref('all')

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'progress', name: '进度', icon: '🌟' },
  { id: 'skill', name: '技巧', icon: '⚔️' },
  { id: 'meta', name: '收藏', icon: '🏆' }
]

const achievementManager = getAchievementManager()

const unlockedCount = computed(() => achievements.value.filter(a => a.unlocked).length)
const totalCount = computed(() => achievements.value.length)
const progressPercent = computed(() => totalCount.value > 0 ? (unlockedCount.value / totalCount.value) * 100 : 0)

const filteredAchievements = computed(() => {
  if (activeCategory.value === 'all') {
    return achievements.value
  }
  return achievements.value.filter(a => a.category === activeCategory.value)
})

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

function loadAchievements() {
  achievements.value = achievementManager.getAllAchievements()
}

onMounted(() => {
  loadAchievements()
})
</script>

<style scoped>
.achievements-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
  z-index: 1000;
  overflow-y: auto;
}

.achievements-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px 20px;
}

.achievements-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 10px;
}

.back-btn {
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  border: 1px solid rgba(75, 85, 99, 0.5);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.back-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.7);
}

.page-title {
  margin: 0;
  font-size: 1.6rem;
  color: #fbbf24;
  text-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.progress-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #22c55e;
}

.progress-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 25px;
  border: 1px solid rgba(75, 85, 99, 0.3);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #fbbf24 50%, #a78bfa 100%);
  border-radius: 5px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.tab-btn {
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  border: 1px solid rgba(75, 85, 99, 0.4);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.tab-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
}

.tab-btn.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);
}

.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: rgba(13, 17, 23, 0.7);
  border-radius: 14px;
  border: 2px solid rgba(75, 85, 99, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement-card.unlocked {
  background: rgba(13, 17, 23, 0.9);
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: 0 2px 15px rgba(34, 197, 94, 0.1);
}

.achievement-card.unlocked:hover {
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.6);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2);
}

.achievement-card.locked {
  opacity: 0.65;
}

.achievement-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.achievement-card.unlocked .achievement-icon {
  background: rgba(30, 27, 75, 0.8);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}

.achievement-card.unlocked:hover .achievement-icon {
  transform: scale(1.08);
}

.icon-text {
  font-size: 28px;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: bold;
}

.achievement-desc {
  margin: 0 0 4px 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.achievement-date {
  margin: 0;
  font-size: 0.75rem;
  color: #22c55e;
  font-weight: 600;
}

.achievement-locked {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.unlocked-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #22c55e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

@media (max-width: 500px) {
  .achievements-container {
    padding: 20px 14px;
  }
  
  .achievements-header {
    flex-wrap: wrap;
  }
  
  .page-title {
    font-size: 1.3rem;
    order: -1;
    width: 100%;
    text-align: center;
  }
  
  .achievement-icon {
    width: 48px;
    height: 48px;
  }
  
  .icon-text {
    font-size: 24px;
  }
}
</style>
