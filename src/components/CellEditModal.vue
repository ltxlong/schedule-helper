<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />
      
      <div class="relative bg-white rounded-lg max-w-lg w-full p-6">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-semibold text-gray-900">编辑排班</h2>
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
          <!-- 排班组列表 -->
          <div v-for="(group, index) in groups" :key="index" class="space-y-4 p-4 bg-gray-50 rounded-lg relative">
            <!-- 删除组按钮 -->
            <button
              v-if="groups.length > 1"
              @click="removeGroup(index)"
              class="absolute top-2 right-2 text-red-600 hover:text-red-900"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- 开播时间 -->
            <div>
              <label class="block text-sm font-medium text-gray-700">开播时间</label>
              <input
                type="time"
                v-model="group.startTime"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <!-- 主播选择 -->
            <div>
              <label class="block text-sm font-medium text-gray-700">开播主播</label>
              <div class="mt-2 space-y-2">
                <label class="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    v-model="group.isBlank"
                    class="form-checkbox text-indigo-600"
                  />
                  <span class="ml-2">空白</span>
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="checkbox"
                    v-model="group.isGroup"
                    class="form-checkbox text-indigo-600"
                  />
                  <span class="ml-2">团播</span>
                </label>
              </div>
              <div v-if="!group.isBlank" class="mt-2">
                <select
                  v-model="group.streamers"
                  multiple
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option v-for="streamer in streamers" :key="streamer.id" :value="streamer.id">
                    {{ streamer.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 开播主题 -->
            <div>
              <label class="block text-sm font-medium text-gray-700">开播主题</label>
              <input
                type="text"
                v-model="group.theme"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- 添加组按钮 -->
          <button
            @click="addGroup"
            class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加组
          </button>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            @click="handleSave"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close', 'save'])

const streamers = ref([])

const groups = ref([
  {
    startTime: '',
    isBlank: false,
    isGroup: false,
    streamers: [],
    theme: ''
  }
])

const addGroup = () => {
  groups.value.push({
    startTime: '',
    isBlank: false,
    isGroup: false,
    streamers: [],
    theme: ''
  })
}

const removeGroup = (index) => {
  groups.value.splice(index, 1)
}

const handleSave = async () => {
  try {
    // 实现保存排班的逻辑
    
    emit('save', groups.value)
    emit('close')
    
    ElMessage({
      type: 'success',
      message: '排班信息已保存'
    })
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '保存排班信息时发生错误'
    })
  }
}
</script> 