<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />
      
      <div class="relative bg-white rounded-lg max-w-3xl w-full p-6">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-semibold text-gray-900">排班表模板</h2>
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
          <!-- 模板列表 -->
          <div class="grid grid-cols-1 gap-4">
            <div
              v-for="template in templates"
              :key="template.id"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ template.name }}</h3>
                  <p class="mt-1 text-sm text-gray-500">{{ template.description }}</p>
                  <div class="mt-2 flex items-center text-sm text-gray-500">
                    <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatType(template.format) }}
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button
                    @click="viewTemplate(template)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    查看
                  </button>
                  <button
                    @click="editTemplate(template)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    编辑
                  </button>
                  <button
                    @click="deleteTemplate(template)"
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

const templates = ref([
  // 示例数据，实际应该从后端获取
  {
    id: 1,
    name: '标准周排班模板',
    description: '适用于常规周排班的模板',
    format: 'week'
  },
  {
    id: 2,
    name: '标准月排班模板',
    description: '适用于常规月排班的模板',
    format: 'month'
  }
])

const formatType = (format) => {
  switch (format) {
    case 'current_week':
      return '本周排班'
    case 'month_week':
      return '本月周排班'
    case 'current_month':
      return '本月排班'
    case 'next_month':
      return '下个月排班'
    default:
      return '未知格式'
  }
}

const viewTemplate = (template) => {
  // 实现查看模板的逻辑
}

const editTemplate = (template) => {
  // 实现编辑模板的逻辑
}

const deleteTemplate = async (template) => {
  const result = await ElMessageBox.confirm(
    '确定要删除这个模板吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  if (result === 'confirm') {
    templates.value = templates.value.filter(t => t.id !== template.id)
    ElMessage({
      type: 'success',
      message: '模板已成功删除'
    })
  }
}
</script> 