<template>
  <div
    class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move"
    draggable="true"
    @dragstart="handleDragStart"
  >
    <div v-if="type === 'text'" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">文字组件</span>
        <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </div>
      <p class="text-xs text-gray-500">拖拽到排班表添加文字</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    required: true
  }
})

const handleDragStart = (event) => {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: props.type,
    data: {
      text: '',
      style: {
        fontSize: '14px',
        color: '#000000',
        fontWeight: 'normal'
      }
    }
  }))
}
</script> 