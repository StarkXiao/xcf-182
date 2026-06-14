<template>
  <div class="workshop-page">
    <div class="workshop-header">
      <button class="back-btn" @click="$emit('back')">
        ← 返回
      </button>
      <h2 class="workshop-title">🎨 创意工坊</h2>
      <div class="header-spacer"></div>
    </div>

    <div class="workshop-subheader">
      <div class="tabs-container">
        <button
          v-for="tab in sortTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: currentSort === tab.value }"
          @click="changeSort(tab.value)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
      
      <button class="upload-btn" @click="$emit('openEditor')">
        ✏️ 上传我的关卡
      </button>
    </div>

    <div class="levels-container">
      <div class="levels-loading" v-if="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div class="levels-empty" v-else-if="levels.length === 0">
        <div class="empty-icon">📭</div>
        <p>还没有关卡</p>
        <p class="empty-tip">成为第一个上传关卡的创作者吧！</p>
        <button class="upload-btn large" @click="$emit('openEditor')">
          🎨 创建关卡
        </button>
      </div>

      <div class="levels-grid" v-else>
        <LevelCard
          v-for="level in levels"
          :key="level.id"
          :level="level"
          :is-liked="likedLevelIds.includes(level.id)"
          @play="handlePlayLevel"
          @like-changed="handleLikeChanged"
        />
      </div>
    </div>

    <div class="workshop-footer">
      <div class="backend-status">
        <span class="status-dot" :class="backendStatusClass"></span>
        <span class="backend-label">数据存储：</span>
        <span class="backend-type" :class="backendTypeClass">{{ backendTypeLabel }}</span>
        <span v-if="workshopService.isCloudBackend()" class="cloud-tag">☁️ 云端同步</span>
        <span v-else class="local-tag">💾 本地存储</span>
      </div>
      <div class="footer-tip" v-if="!workshopService.isCloudBackend()">
        <span>提示：配置 <code>.env</code> 中的 Supabase 密钥，即可启用云端创意工坊</span>
      </div>
    </div>

    <div class="upload-toast" v-if="showUploadToast">
      <div class="toast-content">
        <span class="toast-icon">🎉</span>
        <span class="toast-text">{{ uploadToastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import LevelCard from './LevelCard.vue'
import { getWorkshopService } from '../game/modules/WorkshopService.js'

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0
  },
  uploadSuccess: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'playLevel', 'openEditor'])

const workshopService = getWorkshopService()

const sortTabs = [
  { value: 'hot', label: '最热', icon: '🔥' },
  { value: 'newest', label: '最新', icon: '✨' },
  { value: 'most_liked', label: '点赞最多', icon: '❤️' },
  { value: 'most_played', label: '游玩最多', icon: '🎮' }
]

const currentSort = ref('hot')
const levels = ref([])
const loading = ref(false)
const likedLevelIds = ref([])
const showUploadToast = ref(false)
const uploadToastMessage = ref('')

const backendType = computed(() => workshopService.getBackendType())

const backendTypeLabel = computed(() => {
  const labels = {
    local: '本地存储',
    leancloud: 'LeanCloud',
    supabase: 'Supabase'
  }
  return labels[backendType.value] || '本地存储'
})

const backendStatusClass = computed(() => ({
  'status-online': workshopService.isCloudBackend(),
  'status-offline': !workshopService.isCloudBackend()
}))

const backendTypeClass = computed(() => ({
  'type-local': backendType.value === 'local',
  'type-leancloud': backendType.value === 'leancloud',
  'type-supabase': backendType.value === 'supabase'
}))

async function loadLevels() {
  loading.value = true
  try {
    const [loadedLevels, likedIds] = await Promise.all([
      workshopService.getWorkshopLevels(currentSort.value, 50),
      workshopService.getUserLikedLevels()
    ])
    levels.value = loadedLevels
    likedLevelIds.value = likedIds
  } catch (e) {
    console.error('Failed to load workshop levels:', e)
    levels.value = []
  } finally {
    loading.value = false
  }
}

function changeSort(sortValue) {
  currentSort.value = sortValue
  loadLevels()
}

function handlePlayLevel(level) {
  emit('playLevel', level)
}

function handleLikeChanged(levelId, isLiked) {
  if (isLiked) {
    if (!likedLevelIds.value.includes(levelId)) {
      likedLevelIds.value.push(levelId)
    }
  } else {
    const idx = likedLevelIds.value.indexOf(levelId)
    if (idx !== -1) {
      likedLevelIds.value.splice(idx, 1)
    }
  }
  
  const level = levels.value.find(l => l.id === levelId)
  if (level) {
    level.likesCount += isLiked ? 1 : -1
  }
}

function showToast(message) {
  uploadToastMessage.value = message
  showUploadToast.value = true
  setTimeout(() => {
    showUploadToast.value = false
  }, 3000)
}

watch(() => props.refreshTrigger, () => {
  loadLevels()
})

watch(() => props.uploadSuccess, (newVal) => {
  if (newVal) {
    showToast('关卡上传成功！')
    loadLevels()
  }
})

onMounted(() => {
  workshopService.ensureBackendReady().then(() => {
    loadLevels()
  })
})
</script>

<style scoped>
.workshop-page {
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

.workshop-header {
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

.workshop-title {
  font-size: 22px;
  color: #fbbf24;
  margin: 0;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.header-spacer {
  width: 80px;
}

.workshop-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(13, 17, 23, 0.7);
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  flex-shrink: 0;
  gap: 12px;
}

.tabs-container {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
}

.tab-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
}

.tab-icon {
  font-size: 14px;
}

.tab-label {
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
}

.tab-btn.active .tab-label {
  color: white;
}

.upload-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.upload-btn.large {
  padding: 12px 24px;
  font-size: 15px;
  margin-top: 16px;
}

.levels-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.levels-loading {
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

.levels-empty {
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

.levels-empty p {
  color: #64748b;
  margin: 4px 0;
  font-size: 14px;
}

.empty-tip {
  color: #475569 !important;
  font-size: 12px !important;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.workshop-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(13, 17, 23, 0.8);
  border-top: 1px solid rgba(96, 165, 250, 0.2);
}

.backend-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.status-online {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
  animation: pulse-green 2s ease-in-out infinite;
}

.status-dot.status-offline {
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.backend-label {
  font-size: 12px;
  color: #64748b;
}

.backend-type {
  font-size: 12px;
  font-weight: 600;
}

.backend-type.type-local {
  color: #f59e0b;
}

.backend-type.type-supabase {
  color: #10b981;
}

.backend-type.type-leancloud {
  color: #06b6d4;
}

.cloud-tag, .local-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  border-width: 1px;
  border-style: solid;
}

.cloud-tag {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.local-tag {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
}

.footer-tip {
  font-size: 11px;
  color: #475569;
  text-align: center;
}

.footer-tip code {
  background: rgba(30, 41, 59, 0.8);
  padding: 1px 6px;
  border-radius: 3px;
  color: #a78bfa;
  font-size: 10px;
  font-family: 'SF Mono', Monaco, monospace;
}

.upload-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
}

.toast-icon {
  font-size: 18px;
}

.toast-text {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 600px) {
  .workshop-subheader {
    flex-direction: column;
    align-items: stretch;
  }
  
  .upload-btn {
    width: 100%;
  }
  
  .levels-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .tab-btn {
    padding: 6px 10px;
  }
  
  .tab-label {
    font-size: 12px;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .levels-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  .levels-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
