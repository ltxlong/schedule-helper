<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />
      
      <div class="relative bg-white rounded-lg max-w-3xl w-full p-6 overflow-hidden">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-semibold text-gray-900">新建排班表</h2>
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
          <!-- 模板选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700">选择模板</label>
            <select
              v-model="formData.templateId"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            >
              <option value="">空白模板</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>

          <!-- 基本配置 -->
          <div v-if="!formData.templateId">
            <div class="space-y-4">
              <!-- 排班表格式 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">排班表格式</label>
                <div class="mt-2 space-x-4">
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      v-model="formData.format"
                      value="week"
                      class="form-radio text-indigo-600"
                    />
                    <span class="ml-2">一周</span>
                  </label>
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      v-model="formData.format"
                      value="month"
                      class="form-radio text-indigo-600"
                    />
                    <span class="ml-2">一个月</span>
                  </label>
                </div>
              </div>

              <!-- 主播logo显示参数设置 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">主播logo显示</label>
                <div class="mt-2 flex space-x-4 items-center">
                  <el-radio-group v-model="formData.logoPosition">
                    <el-radio label="none">关闭</el-radio>
                    <el-radio label="left">左边</el-radio>
                    <el-radio label="center">中间</el-radio>
                    <el-radio label="right">右边</el-radio>
                  </el-radio-group>
                </div>
                <!-- 当选择了非关闭选项时，显示成员多选下拉框 -->
                <div v-if="formData.logoPosition !== 'none'" class="mt-2">
                  <el-select
                    v-model="formData.logoStreamers"
                    multiple
                    filterable
                    placeholder="请选择成员"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="streamer in streamers"
                      :key="streamer.id"
                      :label="streamer.name"
                      :value="streamer.name"
                    />
                  </el-select>
                </div>
              </div>

              <!-- 标题 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">排班表标题</label>
                <input
                  type="text"
                  v-model="formData.title"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <!-- 字体 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">字体</label>
                <select
                  v-model="formData.font"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="Arial">Arial</option>
                </select>
              </div>

              <!-- 主题颜色 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">主题颜色</label>
                <div class="mt-2 flex space-x-4">
                  <input
                    type="color"
                    v-model="formData.themeColor"
                    class="h-8 w-8 rounded-md border-gray-300"
                  />
                  <span class="text-sm text-gray-500">表格线条和字体颜色</span>
                </div>
              </div>

              <!-- 背景图片 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">背景图片</label>
                <div class="mt-1 flex items-center">
                  <input
                    type="file"
                    @change="handleBackgroundImage"
                    accept="image/*"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              <!-- 星期排序 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">星期排序</label>
                <div class="mt-2 space-x-4">
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      v-model="formData.weekdayLayout"
                      value="single"
                      class="form-radio text-indigo-600"
                    />
                    <span class="ml-2">一行</span>
                  </label>
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      v-model="formData.weekdayLayout"
                      value="double"
                      class="form-radio text-indigo-600"
                    />
                    <span class="ml-2">两行</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            @click="handleCreate"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close', 'create'])

const templates = ref([
  // 示例数据，实际应该从后端获取
  { id: 1, name: '标准周排班模板' },
  { id: 2, name: '标准月排班模板' }
])

// 修改为从localStorage获取实际的成员数据
const streamers = ref([])

// 加载成员数据
const loadStreamers = () => {
  try {
    const storedStreamers = localStorage.getItem('streamers')
    if (storedStreamers) {
      streamers.value = JSON.parse(storedStreamers)
    }
  } catch (error) {
    console.error('加载成员数据失败:', error)
  }
}

onMounted(() => {
  loadStreamers()
})

const formData = ref({
  templateId: '',
  format: 'week',
  title: '',
  font: 'Arial',
  themeColor: '#000000',
  backgroundImage: null,
  weekdayLayout: 'single',
  logoPosition: 'none',
  logoStreamers: []
})

const handleBackgroundImage = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.backgroundImage = file
  }
}

const handleCreate = async () => {
  try {
    // 实现创建排班表的逻辑
    const scheduleData = {
      ...formData.value,
      // 添加其他必要的字段
    }
    
    // 触发创建事件，将数据传递给父组件
    emit('create', scheduleData)
    
    ElMessage({
      type: 'success',
      message: '排班表创建成功'
    })
    
    emit('close')
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '创建排班表时发生错误',
      duration: 3000
    })
  }
}
</script> 