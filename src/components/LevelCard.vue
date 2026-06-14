<template>
  <div class="level-card" :class="{ 'liked': isLiked }" @click="$emit('play', level)">
    <div class="card-header">
      <div class="level-name">{{ level.name }}</div>
      <div class="level-size">{{ level.gridSize.rows }}×{{ level.gridSize.cols }}</div>
    </div>
    
    <div class="card-author">
      <span class="author-label">作者：</span>
      <span class="author-name">{{ level.authorNickname }}</span>
    </div>
    
    <div class="card-description" v-if="level.description">
      {{ level.description }}
    </div>
    
    <div class="mini-grid">
      <div
        v-for="row in level.gridSize.rows"
        :key="'mini-row-' + row"
        class="mini-row"
      >
        <div
          v-for="col in level.gridSize.cols"
          :key="'mini-cell-' + row + '-' + col"
          class="mini-cell"
          :class="getMiniCellClass(row - 1, col - 1)"
        ></div>
      </div>
    </div>
    
    <div class="card-stats">
      <div class="stat-item">
        <span class="stat-icon">💎</span>
        <span class="stat-value">{{ level.totalPoints }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🌱</span>
        <span class="stat-value">{{ level.plants.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🪨</span>
        <span class="stat-value">{{ level.obstacles.length }}</span>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="footer-left">
        <button 
          class="like-btn" 
          :class="{ active: isLiked }"
          @click.stop="handleLike"
        >
          <span class="like-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
          <span class="like-count">{{ displayLikes }}</span>
        </button>
        <div class="play-count">
          <span class="play-icon">▶️</span>
          <span class="play-count-num">{{ level.playsCount }}</span>
        </div>
      </div>
      <div class="footer-right">
        <button class="play-btn" @click.stop="$emit('play', level)">
          🎮 试玩
        </button>
      </div>
    </div>
    
    <div class="card-time">
      {{ formatTime(level.createdAt) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getWorkshopService } from '../game/modules/WorkshopService.js'

const props = defineProps({
  level: {
    type: Object,
    required: true
  },
  isLiked: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play', 'likeChanged'])

const workshopService = getWorkshopService()
const isLiking = ref(false)
const localLikes = ref(props.level.likesCount)

const displayLikes = computed(() => localLikes.value)

function getMiniCellClass(row, col) {
  const classes = []
  
  if (props.level.start && props.level.start.row === row && props.level.start.col === col) {
    classes.push('mini-start')
  } else if (props.level.end && props.level.end.row === row && props.level.end.col === col) {
    classes.push('mini-end')
  } else if (props.level.obstacles.some(o => o.row === row && o.col === col)) {
    classes.push('mini-obstacle')
  } else {
    const plant = props.level.plants.find(p => p.row === row && p.col === col)
    if (plant) {
      classes.push('mini-plant')
      classes.push('mini-plant-' + plant.type)
    }
  }
  
  return classes
}

function formatTime(timestamp) {
  return workshopService.formatDate(timestamp)
}

async function handleLike() {
  if (isLiking.value) return
  isLiking.value = true
  
  try {
    if (props.isLiked) {
      await workshopService.unlikeWorkshopLevel(props.level.id)
      localLikes.value = Math.max(0, localLikes.value - 1)
    } else {
      const result = await workshopService.likeWorkshopLevel(props.level.id)
      if (result.success) {
        localLikes.value++
      }
    }
    emit('likeChanged', props.level.id, !props.isLiked)
  } catch (e) {
    console.error('Like failed:', e)
  } finally {
    isLiking.value = false
  }
}
</script>

<style scoped>
.level-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.level-card:hover {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 8px 30px rgba(96, 165, 250, 0.2);
}

.level-card.liked {
  border-color: rgba(236, 72, 153, 0.4);
}

.level-card.liked::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ec4899, #f472b6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.level-name {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.level-size {
  font-size: 12px;
  color: #64748b;
  background: rgba(96, 165, 250, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.card-author {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.author-label {
  color: #64748b;
}

.author-name {
  color: #a78bfa;
  font-weight: 500;
}

.card-description {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mini-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgba(15, 23, 42, 0.8);
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid rgba(96, 165, 250, 0.15);
}

.mini-row {
  display: flex;
  gap: 1px;
}

.mini-cell {
  flex: 1;
  aspect-ratio: 1;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 2px;
}

.mini-cell.mini-start {
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
}

.mini-cell.mini-end {
  background: #a855f7;
  box-shadow: 0 0 4px rgba(168, 85, 247, 0.5);
}

.mini-cell.mini-obstacle {
  background: #64748b;
}

.mini-cell.mini-plant {
  border-radius: 50%;
}

.mini-cell.mini-plant-moss {
  background: #4ade80;
  box-shadow: 0 0 3px rgba(74, 222, 128, 0.4);
}

.mini-cell.mini-plant-mushroom {
  background: #f472b6;
  box-shadow: 0 0 3px rgba(244, 114, 182, 0.4);
}

.mini-cell.mini-plant-flower {
  background: #60a5fa;
  box-shadow: 0 0 3px rgba(96, 165, 250, 0.4);
}

.card-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  gap: 12px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid rgba(236, 72, 153, 0.3);
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn:hover {
  background: rgba(236, 72, 153, 0.1);
  border-color: rgba(236, 72, 153, 0.5);
}

.like-btn.active {
  background: rgba(236, 72, 153, 0.2);
  border-color: #ec4899;
}

.like-icon {
  font-size: 14px;
}

.like-count {
  font-size: 12px;
  color: #ec4899;
  font-weight: 600;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.play-icon {
  font-size: 12px;
}

.play-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.card-time {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  color: #475569;
}

@media (max-width: 600px) {
  .level-card {
    padding: 12px;
  }
  
  .level-name {
    font-size: 14px;
  }
  
  .card-stats {
    padding: 6px;
  }
  
  .stat-value {
    font-size: 12px;
  }
}
</style>
