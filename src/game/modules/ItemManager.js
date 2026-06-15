const STORAGE_KEY = 'moss_cave_items_v1'

export const ITEM_TYPES = {
  PATH_HINT: 'path_hint',
  OBSTACLE_CLEAR: 'obstacle_clear'
}

export const ITEM_CONFIG = {
  [ITEM_TYPES.PATH_HINT]: {
    id: ITEM_TYPES.PATH_HINT,
    name: '路径提示',
    icon: '💡',
    description: '显示一格正确路径',
    color: '#fbbf24',
    bgColor: '#1e3a5f'
  },
  [ITEM_TYPES.OBSTACLE_CLEAR]: {
    id: ITEM_TYPES.OBSTACLE_CLEAR,
    name: '障碍消除',
    icon: '💥',
    description: '消除一个障碍物',
    color: '#f97316',
    bgColor: '#7c2d12'
  }
}

export class ItemManager {
  constructor() {
    this.items = this._loadItems()
    this.selectedItem = null
    this.listeners = []
  }

  _loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load items:', e)
    }
    return {
      [ITEM_TYPES.PATH_HINT]: 3,
      [ITEM_TYPES.OBSTACLE_CLEAR]: 2
    }
  }

  _saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    } catch (e) {
      console.warn('Failed to save items:', e)
    }
    this._notifyListeners()
  }

  _notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn({ ...this.items })
      } catch (e) {
        console.error('Item listener error:', e)
      }
    })
  }

  onItemsChange(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback)
    }
  }

  getItemCount(itemType) {
    return this.items[itemType] || 0
  }

  getAllItems() {
    return { ...this.items }
  }

  addItem(itemType, count = 1) {
    if (!this.items[itemType]) {
      this.items[itemType] = 0
    }
    this.items[itemType] += count
    this._saveItems()
    return this.items[itemType]
  }

  useItem(itemType) {
    if (this.getItemCount(itemType) <= 0) {
      return false
    }
    this.items[itemType]--
    this._saveItems()
    return true
  }

  setSelectedItem(itemType) {
    if (itemType && this.getItemCount(itemType) <= 0) {
      this.selectedItem = null
      return false
    }
    this.selectedItem = itemType
    return true
  }

  getSelectedItem() {
    return this.selectedItem
  }

  clearSelectedItem() {
    this.selectedItem = null
  }

  canUseSelectedItem() {
    if (!this.selectedItem) return false
    return this.getItemCount(this.selectedItem) > 0
  }

  useSelectedItem() {
    if (!this.canUseSelectedItem()) return false
    const itemType = this.selectedItem
    const success = this.useItem(itemType)
    if (success && this.getItemCount(itemType) <= 0) {
      this.selectedItem = null
    }
    return success
  }

  resetItems() {
    this.items = {
      [ITEM_TYPES.PATH_HINT]: 3,
      [ITEM_TYPES.OBSTACLE_CLEAR]: 2
    }
    this.selectedItem = null
    this._saveItems()
  }

  rewardItemsForLevel(levelIndex, stars) {
    if (stars >= 2) {
      this.addItem(ITEM_TYPES.PATH_HINT, 1)
    }
    if (stars >= 3) {
      this.addItem(ITEM_TYPES.OBSTACLE_CLEAR, 1)
    }
  }
}

let singletonInstance = null

export function getItemManager() {
  if (!singletonInstance) {
    singletonInstance = new ItemManager()
  }
  return singletonInstance
}
