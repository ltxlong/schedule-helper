<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />
      
      <div class="relative bg-white rounded-lg max-w-3xl w-full p-6">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-semibold text-gray-900">主播管理</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-500"
          >
            <span class="sr-only">关闭</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-6">
          <!-- 添加主播按钮 -->
          <button
            @click="showAddForm = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加主播
          </button>

          <!-- 添加主播表单 -->
          <div v-if="showAddForm" class="bg-gray-50 p-4 rounded-lg">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">主播名称</label>
                <input
                  type="text"
                  v-model="newStreamer.name"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">主播简介</label>
                <textarea
                  v-model="newStreamer.description"
                  rows="3"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  @click="showAddForm = false"
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  @click="addStreamer"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>

          <!-- 主播列表 -->
          <div class="grid grid-cols-1 gap-4">
            <div
              v-for="streamer in streamers"
              :key="streamer.id"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ streamer.name }}</h3>
                  <p class="mt-1 text-sm text-gray-500">{{ streamer.description }}</p>
                </div>
                <div class="flex space-x-2">
                  <button
                    @click="editStreamer(streamer)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    编辑
                  </button>
                  <button
                    @click="deleteStreamer(streamer)"
                    class="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const showAddForm = ref(false)
const newStreamer = ref({
  name: '',
  description: ''
})

const streamers = ref([
  // 示例数据，实际应该从后端获取
  {
    id: 1,
    name: '主播A',
    description: '擅长游戏直播'
  },
  {
    id: 2,
    name: '主播B',
    description: '擅长音乐直播'
  }
])

const addStreamer = async () => {
  if (!newStreamer.value.name) {
    ElMessage({
      type: 'error',
      message: '请输入主播名称'
    })
    return
  }

  try {
    // 实现添加主播的逻辑
    
    showAddForm.value = false
    newStreamer.value = {
      name: '',
      description: ''
    }
    
    ElMessage({
      type: 'success',
      message: '主播信息已保存'
    })
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '添加主播信息时发生错误'
    })
  }
}

const editStreamer = (streamer) => {
  // 实现编辑主播的逻辑
}

const deleteStreamer = async (streamer) => {
  const result = await ElMessageBox.confirm(
    '确定要删除这个主播吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  if (result === 'confirm') {
    // 删除主播的逻辑
    ElMessage({
      type: 'success',
      message: '主播已成功删除'
    })
  }
}
</script> 