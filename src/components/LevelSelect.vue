<template>
  <div class="level-select-screen">
    <div class="level-select-header">
      <button class="back-btn" @click="$emit('back')">
        ← 返回
      </button>
      <h1 class="title">📜 关卡选择</h1>
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-icon">⭐</span>
          <span class="stat-value">{{ totalStars }} / {{ maxStars }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">💎</span>
          <span class="stat-value">{{ totalScore }}</span>
        </div>
      </div>
    </div>

    <div class="items-panel">
      <div class="items-panel-header">
        <span class="items-panel-title">🎒 背知道具</span>
        <span class="items-panel-hint">每关可携带一个道具</span>
      </div>
      <div class="items-list">
        <div
          v-for="item in itemList"
          :key="item.id"
          class="item-card"
          :class="{
            'selected': selectedItem === item.id,
            'disabled': item.count <= 0
          }"
          @click="selectItem(item.id)"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.description }}</div>
          </div>
          <div class="item-count">x{{ item.count }}</div>
        </div>
      </div>
      <div class="selected-item-info" v-if="selectedItem">
        <span class="selected-label">已选择：</span>
        <span class="selected-name">{{ getItemConfig(selectedItem).icon }} {{ getItemConfig(selectedItem).name }}</span>
        <button class="clear-selection-btn" @click="clearSelection">
          取消选择
        </button>
      </div>
    </div>

    <div class="levels-grid">
      <div
        v-for="(level, index) in levels"
        :key="level.id"
        class="level-item"
        :class="{
          'locked': !isUnlocked(index),
          'completed': getProgress(level.id).completed,
          'boss': level.isBossLevel
        }"
        @click="selectLevel(level, index)"
      >
        <div class="level-number">{{ level.id }}</div>
        <div class="level-name">{{ level.name }}</div>
        <div class="level-size">{{ level.gridSize.rows }}×{{ level.gridSize.cols }}</div>
        
        <div class="level-stars" v-if="isUnlocked(index)">
          <span
            v-for="n in 3"
            :key="n"
            class="star"
            :class="{ 'filled': n <= getProgress(level.id).stars }"
          >
            {{ n <= getProgress(level.id).stars ? '⭐' : '☆' }}
          </span>
        </div>
        
        <div class="level-best" v-if="getProgress(level.id).completed">
          <div class="best-score">
            <span>💎 {{ getProgress(level.id).bestScore }}</span>
          </div>
          <div class="best-time">
            <span>⏱️ {{ formatTime(getProgress(level.id).bestTime) }}</span>
          </div>
        </div>

        <div class="lock-overlay" v-if="!isUnlocked(index)">
          <span class="lock-icon">🔒</span>
          <span class="lock-text">完成上一关解锁</span>
        </div>

        <div class="boss-badge" v-if="level.isBossLevel">
          👹 BOSS
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LEVELS } from '../game/data/levels.js'
import { getLevelProgressManager } from '../game/modules/LevelProgress.js'
import { getItemManager, ITEM_TYPES, ITEM_CONFIG } from '../game/modules/ItemManager.js'

const emit = defineEmits(['back', 'selectLevel'])

const levels = LEVELS
const progressManager = getLevelProgressManager()
const itemManager = getItemManager()

const selectedItem = ref(null)
let itemsUnsubscribe = null

const totalStars = computed(() => progressManager.getTotalStars())
const totalScore = computed(() => progressManager.getTotalScore())
const maxStars = computed(() => levels.length * 3)

const itemList = computed(() => {
  return Object.values(ITEM_CONFIG).map(config => ({
    ...config,
    count: itemManager.getItemCount(config.id)
  }))
})

function getItemConfig(itemId) {
  return ITEM_CONFIG[itemId] || {}
}

function getProgress(levelId) {
  return progressManager.getLevelProgress(levelId)
}

function isUnlocked(index) {
  return progressManager.isLevelUnlocked(index)
}

function selectItem(itemId) {
  if (itemManager.getItemCount(itemId) <= 0) return
  
  if (selectedItem.value === itemId) {
    selectedItem.value = null
    itemManager.clearSelectedItem()
  } else {
    selectedItem.value = itemId
    itemManager.setSelectedItem(itemId)
  }
}

function clearSelection() {
  selectedItem.value = null
  itemManager.clearSelectedItem()
}

function selectLevel(level, index) {
  if (!isUnlocked(index)) return
  emit('selectLevel', level, index, selectedItem.value)
}

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function refreshItems() {
}

onMounted(() => {
  selectedItem.value = itemManager.getSelectedItem()
  itemsUnsubscribe = itemManager.onItemsChange(() => {
    refreshItems()
  })
})

onUnmounted(() => {
  if (itemsUnsubscribe) {
    itemsUnsubscribe()
  }
})
</script>

<style scoped>
.level-select-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
  z-index: 2000;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}

.items-panel {
  max-width: 1200px;
  margin: 0 auto 25px;
  background: rgba(13, 17, 23, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 20px;
}

.items-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.items-panel-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fbbf24;
}

.items-panel-hint {
  font-size: 0.85rem;
  color: #64748b;
}

.items-list {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.item-card {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.item-card:hover:not(.disabled) {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-2px);
}

.item-card.selected {
  border-color: #22c55e;
  background: rgba(22, 101, 52, 0.3);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.item-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.item-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 0.8rem;
  color: #94a3b8;
}

.item-count {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fbbf24;
  flex-shrink: 0;
}

.selected-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(251, 191, 36, 0.2);
}

.selected-label {
  font-size: 0.9rem;
  color: #64748b;
}

.selected-name {
  font-size: 1rem;
  font-weight: 600;
  color: #22c55e;
}

.clear-selection-btn {
  margin-left: auto;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-selection-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}

.level-select-header {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  padding: 20px;
  background: rgba(13, 17, 23, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.back-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
}

.title {
  font-size: 2rem;
  color: #60a5fa;
  margin: 0;
  text-shadow: 0 0 20px rgba(96, 165, 250, 0.5);
}

.stats-summary {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(96, 165, 250, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
}

.levels-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding-bottom: 40px;
}

.level-item {
  position: relative;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 2px solid rgba(96, 165, 250, 0.3);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-align: center;
}

.level-item:not(.locked):hover {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.6);
  box-shadow: 0 8px 30px rgba(96, 165, 250, 0.3);
}

.level-item.completed {
  border-color: rgba(34, 197, 94, 0.5);
}

.level-item.completed::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.level-item.boss {
  border-color: rgba(239, 68, 68, 0.5);
}

.level-item.boss::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ef4444, #f97316);
}

.level-item.locked {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.level-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #60a5fa;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(96, 165, 250, 0.5);
}

.level-item.boss .level-number {
  color: #ef4444;
  text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
}

.level-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 6px;
  min-height: 2.8em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-size {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 12px;
}

.level-stars {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 10px;
}

.star {
  font-size: 1.2rem;
  transition: all 0.2s;
}

.star.filled {
  filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.8));
  animation: starPulse 2s ease-in-out infinite;
}

@keyframes starPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.level-best {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.best-score, .best-time {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 14px;
}

.lock-icon {
  font-size: 2.5rem;
}

.lock-text {
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: center;
  padding: 0 10px;
}

.boss-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
}

@media (max-width: 600px) {
  .level-select-screen {
    padding: 10px;
  }

  .level-select-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 15px;
  }

  .title {
    font-size: 1.5rem;
  }

  .stats-summary {
    justify-content: center;
  }

  .levels-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .level-item {
    padding: 15px;
  }

  .level-number {
    font-size: 2rem;
  }

  .level-name {
    font-size: 0.95rem;
    min-height: 2.5em;
  }

  .level-best {
    font-size: 0.7rem;
  }

  .boss-badge {
    font-size: 0.6rem;
    padding: 3px 8px;
  }
}
</style>
