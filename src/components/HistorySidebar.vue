<template>
  <div class="history-sidebar-container">
    <div class="flex justify-between items-center px-3 py-2 border-b border-gray-200">
      <h3 class="history-title">历史记录</h3>
      <el-button
        v-if="histories.length > 0"
        class="clear-button"
        size="small"
        type="danger"
        :icon="Delete"
        @click="clearOldHistories"
      >
        清除
      </el-button>
    </div>
    <div class="history-container">
      <div v-if="histories.length === 0" class="empty-state">
        <el-empty description="暂无历史记录" />
      </div>
      <div v-else class="history-list">
        <div v-for="group in groupedHistories" :key="group.dayId" class="history-group">
          <div class="history-date-header">{{ formatDateId(group.dayId) }}</div>
          <ul class="history-items">
            <li v-for="history in group.items" :key="history.id" class="history-item">
              <el-card shadow="hover" class="history-card">
                <div class="history-content">
                  <h4 class="history-name">{{ history.name }}</h4>
                  <p class="history-time">{{ formatTime(history.date) }}</p>
                </div>
                <div class="history-actions">
                  <el-button
                    type="primary"
                    :icon="RefreshRight"
                    circle
                    @click="restoreHistory(history)"
                  />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    @click="deleteHistory(history.id)"
                  />
                </div>
              </el-card>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, RefreshRight } from '@element-plus/icons-vue'

const visible = ref(false)
const histories = ref([])

// 按日期分组的历史记录
const groupedHistories = computed(() => {
  const groups = histories.value.reduce((groups, item) => {
    const dayId = item.dayId || Math.floor(item.id / 10000) // 兼容旧数据
    if (!groups[dayId]) {
      groups[dayId] = []
    }
    groups[dayId].push(item)
    return groups
  }, {})
  
  // 按日期ID降序排序（最新日期在前）
  const sortedKeys = Object.keys(groups).sort((a, b) => parseInt(b) - parseInt(a))
  
  // 返回数组形式的groupedHistories，确保顺序一致
  return sortedKeys.map(key => {
    return {
      dayId: key,
      items: groups[key]
    }
  })
})

// 格式化日期 ID 为可读格式
const formatDateId = (id) => {
  const year = Math.floor(id / 10000)
  const month = Math.floor((id % 10000) / 100)
  const day = id % 100
  return `${year}年${month}月${day}日`
}

// 格式化时间
const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    // 如果日期无效，尝试解析中文日期格式
    const parts = dateStr.split(' ')
    return parts[1] || ''
  }
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 加载历史记录
const loadHistories = () => {
  const savedHistories = localStorage.getItem('scheduleHistories')
  if (savedHistories) {
    histories.value = JSON.parse(savedHistories)
    // 按时间戳降序排序
    histories.value.sort((a, b) => b.id - a.id)
  }
}

// 恢复历史记录
const restoreHistory = async (history) => {
  try {
    const result = await ElMessageBox.confirm(
      '恢复历史记录将覆盖当前排班表，是否继续？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (result === 'confirm') {
      // 触发事件通知父组件恢复历史记录
      emit('restore', history)
      visible.value = false
    }
  } catch {}
}

// 删除历史记录
const deleteHistory = async (id) => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要删除这条历史记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (result === 'confirm') {
      histories.value = histories.value.filter(h => h.id !== id)
      localStorage.setItem('scheduleHistories', JSON.stringify(histories.value))
      
      ElMessage({
        type: 'success',
        message: '历史记录已删除'
      })
    }
  } catch {}
}

// 清除旧的历史记录
const clearOldHistories = async () => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要清除历史记录吗？仅保留今天的记录。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (result === 'confirm') {
      const today = new Date()
      const todayId = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      
      // 只保留今天的历史记录
      histories.value = histories.value.filter(h => {
        const dayId = h.dayId || Math.floor(h.id / 10000) // 兼容旧数据
        return dayId === todayId
      })
      
      // 保存到本地存储
      localStorage.setItem('scheduleHistories', JSON.stringify(histories.value))
      
      ElMessage({
        type: 'success',
        message: '历史记录已清除，仅保留今天的记录'
      })
    }
  } catch {}
}

// 打开抽屉时加载历史记录
const open = () => {
  loadHistories()
  visible.value = true
}

defineExpose({
  open,
  formatDateId
})

const emit = defineEmits(['restore'])

onMounted(() => {
  loadHistories()
})
</script>

<style scoped>
.history-sidebar-container {
  @apply h-full flex flex-col bg-white border-r border-gray-200;
  width: 240px;
  text-align: center;
  padding: 5px;
}

.history-title {
  @apply text-base font-medium text-gray-900 m-0;
}

.history-container {
  @apply flex-1 overflow-y-auto;
}

.history-list {
  @apply py-2;
}

.history-group {
  @apply mb-3;
}

.history-date-header {
  @apply text-xs font-medium text-gray-500 px-3 py-1 bg-gray-50;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-date-header::before,
.history-date-header::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid var(--el-text-color-secondary);
}

.history-date-header::before {
  left: 10px;
}

.history-date-header::after {
  right: 10px;
}

.history-items {
  @apply list-none p-0 m-0;
}

.history-item {
  @apply px-2;
  text-align: center;
  padding: 5px;
}

.history-card {
  @apply cursor-pointer transition-all duration-300;
}

.history-card:hover {
  transform: translateY(-2px);
}

.history-content {
  @apply text-left;
  padding-top: 5px;
}

.history-name {
  @apply text-sm font-medium text-gray-900 mb-1;
}

.history-time {
  @apply text-xs text-gray-500 m-0;
}

.history-actions {
  @apply flex justify-center gap-2 mt-2;
  padding-bottom: 5px;
}

.empty-state {
  @apply flex justify-center items-center h-full;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .history-sidebar-container {
    @apply fixed left-0 top-[60px] bottom-0 z-50 transform transition-transform duration-300;
    transform: translateX(-100%);
  }

  .history-sidebar-container.open {
    transform: translateX(0);
  }
}

/* 修改圆形按钮样式 */
:deep(.el-button.is-circle) {
  border-radius: var(--el-border-radius-base);
  width: 30px;
  height: 30px;
}

/* 添加清除按钮样式 */
.clear-button {
  @apply border border-[#F56C6C] text-[#F56C6C] bg-white hover:bg-[#FEF0F0] transition-colors duration-300;
  font-size: 12px;
  height: 28px;
  padding: 0 12px;
  margin: 5px;
}

.clear-button :deep(.el-icon) {
  font-size: 14px;
  margin-right: 4px;
}
</style> 