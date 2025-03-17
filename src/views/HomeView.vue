<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h1 class="text-xl font-bold">排班表助手</h1>
        </div>
        <div class="flex items-center space-x-2">
          <el-button @click="toggleHistorySidebar" class="menu-button">
            <el-icon><Menu /></el-icon>
          </el-button>
          <el-button type="primary" @click="newScheduleDialogVisible = true">
            <el-icon class="el-icon--left"><Plus /></el-icon>
            新建排班表
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-container class="main-container">
      <!-- 左侧历史边栏 -->
      <HistorySidebar
        ref="historySidebarRef"
        :class="['history-sidebar', isHistorySidebarOpen ? 'open' : '']"
        @restore="handleRestoreHistory"
      />

      <!-- 中间内容区域 -->
      <el-main class="main-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="left-tools">
            <el-button @click="showTemplateModal">
              <el-icon class="el-icon--left"><Files /></el-icon>
              模板
            </el-button>
            <el-button @click="showMemberModal">
              <el-icon class="el-icon--left"><User /></el-icon>
              成员
            </el-button>
            <el-button @click="centerSchedule">
              <el-icon class="el-icon--left"><Position /></el-icon>
              居中
            </el-button>
            <div class="zoom-controls">
              <el-button circle @click="handleZoomOut">
                <el-icon><Minus /></el-icon>
              </el-button>
              <el-button
                class="zoom-text"
                text
                @click="showScaleDialog"
              >{{ scale }}%</el-button>
              <el-button circle @click="handleZoomIn">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="right-tools">
            <el-button @click="saveAsHistory">
              <el-icon class="el-icon--left"><Timer /></el-icon>
              保存为历史
            </el-button>
            <el-button @click="editSchedule">
              <el-icon class="el-icon--left"><Edit /></el-icon>
              编辑
            </el-button>
            <el-button @click="saveAsTemplate">
              <el-icon class="el-icon--left"><DocumentAdd /></el-icon>
              保存为模板
            </el-button>
            <el-button @click="exportAsImage">
              <el-icon class="el-icon--left"><Download /></el-icon>
              导出图片
            </el-button>
          </div>
        </div>

        <!-- 添加放缩比例设置弹窗 -->
        <el-dialog
          v-model="scaleDialogVisible"
          title="设置放缩比例"
          width="300px"
          :close-on-click-modal="true"
          destroy-on-close
        >
          <div class="flex items-center justify-between">
            <el-input
              v-model="scaleInputValue"
              type="text"
              @input="handleScaleInput"
              style="width: 120px"
            >
              <template #append>%</template>
            </el-input>
            <span class="text-gray-400 text-sm">范围：{{ MIN_SCALE }}% - {{ MAX_SCALE }}%</span>
          </div>
          <template #footer>
            <div class="flex justify-center space-x-4">
              <el-button @click="scaleDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleScaleChange">确定</el-button>
            </div>
          </template>
        </el-dialog>

        <!-- 排班表区域 -->
        <el-card ref="scheduleTableRef" class="schedule-table" shadow="hover" 
          :style="{
            '--schedule-font-family': currentSchedule.style.font,
            backgroundImage: currentSchedule.style.backgroundImage ? `url(${currentSchedule.style.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }"
        >
          <div class="schedule-content" 
            draggable="true"
            @dragstart="handleDragStart"
            @dragend="handleDragEnd"
            :style="{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale / 100})`,
              gap: currentSchedule.data.format.includes('week') ? '.5rem' : (currentSchedule.data.logoPosition === 'none' ? '.5rem' : '0')
            }"
          >
            <!-- 排班表标题 -->
            <div class="text-center mb-2">
              <h2 class="text-2xl font-bold mb-2" 
                :style="{ 
                  color: currentSchedule.style.themeColor,
                  fontSize: currentSchedule.style.titleFontSize 
                }"
              >
                {{ currentSchedule.data.title }}
              </h2>
              <p :style="{ color: currentSchedule.style.themeColor }">{{ currentSchedule.data.dateRange }}</p>
            </div>
            
            <!-- 周排班表 -->
            <div v-if="['current_week', 'month_week'].includes(currentSchedule.data.format)" 
              class="schedule-table-container"
            >
              <!-- 成员logo显示区域 -->
              <div v-if="currentSchedule.data.logoPosition && currentSchedule.data.logoPosition !== 'none' && currentSchedule.data.logoStreamers?.length > 0"
                class="streamers-logo-container flex items-center h-6 mb-2"
                :style="{
                  justifyContent: currentSchedule.data.logoPosition === 'left' ? 'flex-start' : 
                                 currentSchedule.data.logoPosition === 'center' ? 'center' : 
                                 currentSchedule.data.logoPosition === 'right' ? 'flex-end' : 'center'
                }"
              >
                <div v-for="streamerName in currentSchedule.data.logoStreamers" :key="streamerName"
                  class="streamer-logo-item"
                >
                  <img 
                    v-if="getStreamerLogo(streamerName)"
                    :src="getStreamerLogo(streamerName)"
                    class="w-6 h-6 rounded-full object-cover"
                    alt="Logo"
                  />
                  <div 
                    v-else 
                    class="streamer-logo-text rounded-full flex items-center justify-center text-xs font-bold text-white"
                    :style="getLogoStyle(streamerName)"
                  >
                    {{ getStreamerLogoText(streamerName) }}
                  </div>
                </div>
              </div>
              
              <!-- 上方表头样式 -->
              <template v-if="currentSchedule.style.themeStyle === 'top-weekday'">
                <table class="schedule-grid" 
                  :style="{ borderColor: currentSchedule.style.themeColor }"
                  :data-layout="currentSchedule.style.weekdayLayout"
                >
                  <thead>
                    <tr>
                      <template v-if="currentSchedule.style.weekdayLayout === 'single'">
                        <th v-for="(day, index) in weekDays" :key="index" 
                          class="border schedule-header"
                          :style="{ 
                            borderColor: currentSchedule.style.themeColor, 
                            color: currentSchedule.style.themeColor
                          }"
                          :data-cell-id="'header-' + index"
                        >
                          <div :style="{ fontSize: currentSchedule.style.weekdayFontSize }">{{ day.name }}</div>
                          <div class="text-sm opacity-75">{{ day.date }}</div>
                        </th>
                      </template>
                      <template v-else>
                        <!-- 第一行显示周一到周四 -->
                        <th v-for="(day, index) in weekDays.slice(0, 4)" :key="index" 
                          class="border schedule-header"
                          :style="{ 
                            borderColor: currentSchedule.style.themeColor, 
                            color: currentSchedule.style.themeColor
                          }"
                          :data-cell-id="'header-' + index"
                        >
                          <div :style="{ fontSize: currentSchedule.style.weekdayFontSize }">{{ day.name }}</div>
                          <div class="text-sm opacity-75">{{ day.date }}</div>
                        </th>
                      </template>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="currentSchedule.style.weekdayLayout === 'single'">
                      <tr v-for="row in 2" :key="row">
                        <td v-for="(day, dayIndex) in 7" :key="dayIndex"
                          class="border schedule-cell week-schedule"
                          :style="{
                            borderColor: currentSchedule.style.themeColor,
                            backgroundColor: getCellBackgroundColor(row - 1, dayIndex)
                          }"
                          :data-cell-id="'cell-' + (row - 1) + '-' + dayIndex"
                          :colspan="getColSpan(row - 1, dayIndex)"
                          :rowspan="getRowSpan(row - 1, dayIndex)"
                          v-show="!isMergedHiddenCell(row - 1, dayIndex)"
                        >
                          <div class="cell-content" 
                            :class="{ selected: isCellSelected(row - 1, dayIndex) }"
                            @click="handleCellClick(dayIndex, row - 1)"
                            @mousedown="handleCellMouseDown(row - 1, dayIndex, $event)"
                            @mousemove="handleCellMouseMove(row - 1, dayIndex)"
                            @mouseup="handleMouseUp"
                            @contextmenu="handleCellContextMenu(row - 1, dayIndex, $event)"
                          >
                            <div v-if="weekScheduleData[row - 1][dayIndex]" class="space-y-1 relative">
                              <!-- 显示时间 -->
                              <div v-if="weekScheduleData[row - 1][dayIndex].showTime && weekScheduleData[row - 1][dayIndex].time && weekScheduleData[row - 1][dayIndex].type !== 'rest'" 
                                class="text-sm"
                                :style="{ 
                                  color: getTextColor(weekScheduleData[row - 1][dayIndex]),
                                  fontSize: weekScheduleData[row - 1][dayIndex]?.style?.fontSize || 'inherit'
                                }"
                              >
                                {{ weekScheduleData[row - 1][dayIndex].time }}
                              </div>
                              <!-- 显示内容 -->
                              <div class="font-medium" 
                                :style="{ 
                                  color: getTextColor(weekScheduleData[row - 1][dayIndex]),
                                  fontSize: weekScheduleData[row - 1][dayIndex]?.style?.fontSize || 'inherit'
                                }"
                              >
                                <template v-if="weekScheduleData[row - 1][dayIndex].isImage">
                                  <el-image
                                    :src="weekScheduleData[row - 1][dayIndex].imageUrl"
                                    :preview-src-list="[weekScheduleData[row - 1][dayIndex].imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  <template v-if="weekScheduleData[row - 1][dayIndex].type === 'manual'">
                                    <template v-if="!weekScheduleData[row - 1][dayIndex].showAvatar">
                                      {{ weekScheduleData[row - 1][dayIndex].streamers.join('、') }}
                                    </template>
                                    <template v-else>
                                      <div class="flex justify-center flex-wrap"
                                        :class="{
                                          'grid-avatar-container': weekScheduleData[row - 1][dayIndex].streamers.length === 4,
                                          'single-row-avatars': weekScheduleData[row - 1][dayIndex].streamers.length <= 3,
                                          'multi-row-avatars': weekScheduleData[row - 1][dayIndex].streamers.length > 4
                                        }"
                                        style="gap: 5px;"
                                      >
                                        <el-avatar
                                          v-for="streamerName in weekScheduleData[row - 1][dayIndex].streamers"
                                          :key="streamerName"
                                          :size="weekScheduleData[row - 1][dayIndex].streamers.length >= 3 ? 30 : weekScheduleData[row - 1][dayIndex].streamers.length === 2 ? 40 : 50"
                                          :src="getStreamerAvatarByName(streamerName)"
                                          :style="{ backgroundColor: '#409EFF' }"
                                        >
                                          {{streamerName ? streamerName.charAt(0) : ''}}
                                        </el-avatar>
                                      </div>
                                    </template>
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex].type === 'custom'">
                                    {{ weekScheduleData[row - 1][dayIndex].customContent }}
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex].type === 'group'">
                                    <!-- 团播类型需要先判断是否为图片显示 -->
                                    <template v-if="weekScheduleData[row - 1][dayIndex].isImage">
                                      <el-image
                                        :src="weekScheduleData[row - 1][dayIndex].imageUrl"
                                        :preview-src-list="[weekScheduleData[row - 1][dayIndex].imageUrl]"
                                        fit="contain"
                                        class="cell-image"
                                        style="width: 100%; max-height: 60px;"
                                      >
                                        <template #error>
                                          <div class="image-error">
                                            <el-icon><Picture /></el-icon>
                                            <span>加载失败</span>
                                          </div>
                                        </template>
                                      </el-image>
                                    </template>
                                    <template v-else>
                                      团播
                                    </template>
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex].type === 'rest'">
                                    <!-- 休息类型需要先判断是否为图片显示 -->
                                    <template v-if="weekScheduleData[row - 1][dayIndex].isImage">
                                      <el-image
                                        :src="weekScheduleData[row - 1][dayIndex].imageUrl"
                                        :preview-src-list="[weekScheduleData[row - 1][dayIndex].imageUrl]"
                                        fit="contain"
                                        class="cell-image"
                                        style="width: 100%; max-height: 60px;"
                                      >
                                        <template #error>
                                          <div class="image-error">
                                            <el-icon><Picture /></el-icon>
                                            <span>加载失败</span>
                                          </div>
                                        </template>
                                      </el-image>
                                    </template>
                                    <template v-else>
                                      <span :class="{ 'rest-text': weekScheduleData[row - 1][dayIndex].useShortText }" :style="{ width: getRestTextWidth(weekScheduleData[row - 1][dayIndex]) }">
                                        {{ weekScheduleData[row - 1][dayIndex].useShortText ? '休' : '休息' }}
                                      </span>
                                    </template>
                                  </template>
                                </template>
                              </div>
                              
                              <!-- 新增：显示Logo -->
                              <div v-if="weekScheduleData[row - 1][dayIndex]?.logoType === 'custom' && weekScheduleData[row - 1][dayIndex]?.type !== 'rest'" 
                                class="logo-container"
                              >
                                <template v-if="weekScheduleData[row - 1][dayIndex]?.logoStreamer">
                                  <img 
                                    v-if="getStreamerLogo(weekScheduleData[row - 1][dayIndex]?.logoStreamer)"
                                    :src="getStreamerLogo(weekScheduleData[row - 1][dayIndex]?.logoStreamer)"
                                    class="logo-image"
                                    alt="Logo"
                                  />
                                  <div 
                                    v-else 
                                    class="logo-text"
                                    :style="getLogoStyle(weekScheduleData[row - 1][dayIndex]?.logoStreamer)"
                                  >
                                    {{ getStreamerLogoText(weekScheduleData[row - 1][dayIndex]?.logoStreamer) }}
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <!-- 第一行周一到周四的空格子 -->
                      <tr v-for="row in 2" :key="'first-' + row">
                        <td v-for="dayIndex in 4" :key="'first-' + dayIndex"
                          class="border schedule-cell"
                          :style="{
                            borderColor: currentSchedule.style.themeColor,
                            backgroundColor: getCellBackgroundColor(row - 1, dayIndex - 1)
                          }"
                          :data-cell-id="'cell-' + (row - 1) + '-' + (dayIndex - 1)"
                          :colspan="getColSpan(row - 1, dayIndex - 1)"
                          :rowspan="getRowSpan(row - 1, dayIndex - 1)"
                          v-show="!isMergedHiddenCell(row - 1, dayIndex - 1)"
                        >
                          <div class="cell-content" 
                            :class="{ selected: isCellSelected(row - 1, dayIndex - 1) }"
                            @click="handleCellClick(dayIndex - 1, row - 1)"
                            @mousedown="handleCellMouseDown(row - 1, dayIndex - 1, $event)"
                            @mousemove="handleCellMouseMove(row - 1, dayIndex - 1)"
                            @mouseup="handleMouseUp"
                            @contextmenu="handleCellContextMenu(row - 1, dayIndex - 1, $event)"
                          >
                            <div v-if="weekScheduleData[row - 1][dayIndex - 1]" class="space-y-1 relative">
                              <!-- 显示时间 -->
                              <div v-if="weekScheduleData[row - 1][dayIndex - 1].showTime && weekScheduleData[row - 1][dayIndex - 1].time && weekScheduleData[row - 1][dayIndex - 1].type !== 'rest'" 
                                class="text-sm"
                                :style="{ 
                                  color: getTextColor(weekScheduleData[row - 1][dayIndex - 1]),
                                  fontSize: weekScheduleData[row - 1][dayIndex - 1]?.style?.fontSize || 'inherit'
                                }"
                              >
                                {{ weekScheduleData[row - 1][dayIndex - 1].time }}
                              </div>
                              <!-- 显示内容 -->
                              <div class="font-medium" 
                                :style="{ 
                                  color: getTextColor(weekScheduleData[row - 1][dayIndex - 1]),
                                  fontSize: weekScheduleData[row - 1][dayIndex - 1]?.style?.fontSize || 'inherit'
                                }"
                              >
                                <template v-if="weekScheduleData[row - 1][dayIndex - 1].isImage">
                                  <el-image
                                    :src="weekScheduleData[row - 1][dayIndex - 1].imageUrl"
                                    :preview-src-list="[weekScheduleData[row - 1][dayIndex - 1].imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  <template v-if="weekScheduleData[row - 1][dayIndex - 1].type === 'manual'">
                                    <template v-if="!weekScheduleData[row - 1][dayIndex - 1].showAvatar">
                                      {{ weekScheduleData[row - 1][dayIndex - 1].streamers.join('、') }}
                                    </template>
                                    <template v-else>
                                      <div class="flex justify-center flex-wrap"
                                        :class="{
                                          'grid-avatar-container': weekScheduleData[row - 1][dayIndex - 1].streamers.length === 4,
                                          'single-row-avatars': weekScheduleData[row - 1][dayIndex - 1].streamers.length <= 3,
                                          'multi-row-avatars': weekScheduleData[row - 1][dayIndex - 1].streamers.length > 4
                                        }"
                                        style="gap: 5px;"
                                      >
                                        <el-avatar
                                          v-for="streamerName in weekScheduleData[row - 1][dayIndex - 1].streamers"
                                          :key="streamerName"
                                          :size="weekScheduleData[row - 1][dayIndex - 1].streamers.length >= 3 ? 30 : weekScheduleData[row - 1][dayIndex - 1].streamers.length === 2 ? 40 : 50"
                                          :src="getStreamerAvatarByName(streamerName)"
                                          :style="{ backgroundColor: '#409EFF' }"
                                        >
                                          {{streamerName ? streamerName.charAt(0) : ''}}
                                        </el-avatar>
                                      </div>
                                    </template>
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex - 1].type === 'custom'">
                                    {{ weekScheduleData[row - 1][dayIndex - 1].customContent }}
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex - 1].type === 'group'">
                                    <!-- 团播类型需要先判断是否为图片显示 -->
                                    <template v-if="weekScheduleData[row - 1][dayIndex - 1].isImage">
                                      <el-image
                                        :src="weekScheduleData[row - 1][dayIndex - 1].imageUrl"
                                        :preview-src-list="[weekScheduleData[row - 1][dayIndex - 1].imageUrl]"
                                        fit="contain"
                                        class="cell-image"
                                        style="width: 100%; max-height: 60px;"
                                      >
                                        <template #error>
                                          <div class="image-error">
                                            <el-icon><Picture /></el-icon>
                                            <span>加载失败</span>
                                          </div>
                                        </template>
                                      </el-image>
                                    </template>
                                    <template v-else>
                                      团播
                                    </template>
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex - 1].type === 'rest'">
                                    <!-- 休息类型需要先判断是否为图片显示 -->
                                    <template v-if="weekScheduleData[row - 1][dayIndex - 1].isImage">
                                      <el-image
                                        :src="weekScheduleData[row - 1][dayIndex - 1].imageUrl"
                                        :preview-src-list="[weekScheduleData[row - 1][dayIndex - 1].imageUrl]"
                                        fit="contain"
                                        class="cell-image"
                                        style="width: 100%; max-height: 60px;"
                                      >
                                        <template #error>
                                          <div class="image-error">
                                            <el-icon><Picture /></el-icon>
                                            <span>加载失败</span>
                                          </div>
                                        </template>
                                      </el-image>
                                    </template>
                                    <template v-else>
                                      <span :class="{ 'rest-text': weekScheduleData[row - 1][dayIndex - 1].useShortText }" :style="{ width: getRestTextWidth(weekScheduleData[row - 1][dayIndex - 1]) }">
                                        {{ weekScheduleData[row - 1][dayIndex - 1].useShortText ? '休' : '休息' }}
                                      </span>
                                    </template>
                                  </template>
                                </template>
                              </div>
                              
                              <!-- 新增：显示Logo -->
                              <div v-if="weekScheduleData[row - 1][dayIndex - 1]?.logoType === 'custom' && weekScheduleData[row - 1][dayIndex - 1]?.type !== 'rest'" 
                                class="logo-container"
                              >
                                <template v-if="weekScheduleData[row - 1][dayIndex - 1]?.logoStreamer">
                                  <img 
                                    v-if="getStreamerLogo(weekScheduleData[row - 1][dayIndex - 1]?.logoStreamer)"
                                    :src="getStreamerLogo(weekScheduleData[row - 1][dayIndex - 1]?.logoStreamer)"
                                    class="logo-image"
                                    alt="Logo"
                                  />
                                  <div 
                                    v-else 
                                    class="logo-text"
                                    :style="getLogoStyle(weekScheduleData[row - 1][dayIndex - 1]?.logoStreamer)"
                                  >
                                    {{ getStreamerLogoText(weekScheduleData[row - 1][dayIndex - 1]?.logoStreamer) }}
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <!-- 第二行表头（周五到周日） -->
                      <tr>
                        <th v-for="(day, index) in weekDays.slice(4)" :key="'second-header-' + index" 
                          class="border schedule-header"
                          :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                          :data-cell-id="'header-' + (index + 4)"
                        >
                          <div :style="{ fontSize: currentSchedule.style.weekdayFontSize }">{{ day.name }}</div>
                          <div class="text-sm opacity-75">{{ day.date }}</div>
                        </th>
                        <!-- 添加右侧合并单元格，占据表头行+两行内容 -->
                        <td 
                          class="border schedule-cell"
                          :style="{
                            borderColor: currentSchedule.style.themeColor,
                            backgroundColor: 'transparent'
                          }"
                          colspan="1"
                          rowspan="3"
                          data-cell-id="cell-extra"
                        >
                          <!-- 空内容 -->
                        </td>
                      </tr>
                      <!-- 第二行周五到周日的空格子 -->
                      <tr v-for="row in 2" :key="'second-' + row">
                        <td v-for="(day, dayIndex) in weekDays.slice(4)" :key="'second-' + dayIndex"
                          class="border schedule-cell"
                          :style="{
                            borderColor: currentSchedule.style.themeColor,
                            backgroundColor: getCellBackgroundColor(row - 1, dayIndex + 4)
                          }"
                          :data-cell-id="'cell-' + (row - 1) + '-' + (dayIndex + 4)"
                          :colspan="getColSpan(row - 1, dayIndex + 4)"
                          :rowspan="getRowSpan(row - 1, dayIndex + 4)"
                          v-show="!isMergedHiddenCell(row - 1, dayIndex + 4)"
                        >
                          <div class="cell-content" 
                            :class="{ selected: isCellSelected(row - 1, dayIndex + 4) }"
                            @click="handleCellClick(dayIndex + 4, row - 1)"
                            @mousedown="handleCellMouseDown(row - 1, dayIndex + 4, $event)"
                            @mousemove="handleCellMouseMove(row - 1, dayIndex + 4)"
                            @mouseup="handleMouseUp"
                            @contextmenu="handleCellContextMenu(row - 1, dayIndex + 4, $event)"
                          >
                            <div v-if="weekScheduleData[row - 1][dayIndex + 4]" class="space-y-1 relative">
                              <!-- 显示时间 -->
                              <div v-if="weekScheduleData[row - 1][dayIndex + 4].showTime && weekScheduleData[row - 1][dayIndex + 4].time && weekScheduleData[row - 1][dayIndex + 4].type !== 'rest'" 
                                class="text-sm"
                                :style="{ 
                                  color: getTextColor(weekScheduleData[row - 1][dayIndex + 4]),
                                  fontSize: weekScheduleData[row - 1][dayIndex + 4]?.style?.fontSize || 'inherit'
                                }"
                              >
                                {{ weekScheduleData[row - 1][dayIndex + 4].time }}
                              </div>
                              <!-- 显示内容 -->
                              <div class="font-medium" 
                                :style="{ 
                                  color: getTextColor(weekScheduleData[row - 1][dayIndex + 4]),
                                  fontSize: weekScheduleData[row - 1][dayIndex + 4]?.style?.fontSize || 'inherit'
                                }"
                              >
                                <template v-if="weekScheduleData[row - 1][dayIndex + 4].isImage">
                                  <el-image
                                    :src="weekScheduleData[row - 1][dayIndex + 4].imageUrl"
                                    :preview-src-list="[weekScheduleData[row - 1][dayIndex + 4].imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  <template v-if="weekScheduleData[row - 1][dayIndex + 4].type === 'manual'">
                                    <template v-if="!weekScheduleData[row - 1][dayIndex + 4].showAvatar">
                                      {{ weekScheduleData[row - 1][dayIndex + 4].streamers.join('、') }}
                                    </template>
                                    <template v-else>
                                      <div class="flex justify-center flex-wrap"
                                        :class="{
                                          'grid-avatar-container': weekScheduleData[row - 1][dayIndex + 4].streamers.length === 4,
                                          'single-row-avatars': weekScheduleData[row - 1][dayIndex + 4].streamers.length <= 3,
                                          'multi-row-avatars': weekScheduleData[row - 1][dayIndex + 4].streamers.length > 4
                                        }"
                                        style="gap: 5px;"
                                      >
                                        <el-avatar
                                          v-for="streamerName in weekScheduleData[row - 1][dayIndex + 4].streamers"
                                          :key="streamerName"
                                          :size="weekScheduleData[row - 1][dayIndex + 4].streamers.length >= 3 ? 30 : weekScheduleData[row - 1][dayIndex + 4].streamers.length === 2 ? 40 : 50"
                                          :src="getStreamerAvatarByName(streamerName)"
                                          :style="{ backgroundColor: '#409EFF' }"
                                        >
                                          {{streamerName ? streamerName.charAt(0) : ''}}
                                        </el-avatar>
                                      </div>
                                    </template>
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex + 4].type === 'custom'">
                                    {{ weekScheduleData[row - 1][dayIndex + 4].customContent }}
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex + 4].type === 'group'">
                                    <!-- 团播类型需要先判断是否为图片显示 -->
                                    <template v-if="weekScheduleData[row - 1][dayIndex + 4].isImage">
                                      <el-image
                                        :src="weekScheduleData[row - 1][dayIndex + 4].imageUrl"
                                        :preview-src-list="[weekScheduleData[row - 1][dayIndex + 4].imageUrl]"
                                        fit="contain"
                                        class="cell-image"
                                        style="width: 100%; max-height: 60px;"
                                      >
                                        <template #error>
                                          <div class="image-error">
                                            <el-icon><Picture /></el-icon>
                                            <span>加载失败</span>
                                          </div>
                                        </template>
                                      </el-image>
                                    </template>
                                    <template v-else>
                                      团播
                                    </template>
                                  </template>
                                  <template v-else-if="weekScheduleData[row - 1][dayIndex + 4].type === 'rest'">
                                    <!-- 休息类型需要先判断是否为图片显示 -->
                                    <template v-if="weekScheduleData[row - 1][dayIndex + 4].isImage">
                                      <el-image
                                        :src="weekScheduleData[row - 1][dayIndex + 4].imageUrl"
                                        :preview-src-list="[weekScheduleData[row - 1][dayIndex + 4].imageUrl]"
                                        fit="contain"
                                        class="cell-image"
                                        style="width: 100%; max-height: 60px;"
                                      >
                                        <template #error>
                                          <div class="image-error">
                                            <el-icon><Picture /></el-icon>
                                            <span>加载失败</span>
                                          </div>
                                        </template>
                                      </el-image>
                                    </template>
                                    <template v-else>
                                      <span :class="{ 'rest-text': weekScheduleData[row - 1][dayIndex + 4].useShortText }" :style="{ width: getRestTextWidth(weekScheduleData[row - 1][dayIndex + 4]) }">
                                        {{ weekScheduleData[row - 1][dayIndex + 4].useShortText ? '休' : '休息' }}
                                      </span>
                                    </template>
                                  </template>
                                </template>
                              </div>
                              
                              <!-- 新增：显示Logo -->
                              <div v-if="weekScheduleData[row - 1][dayIndex + 4]?.logoType === 'custom' && weekScheduleData[row - 1][dayIndex + 4]?.type !== 'rest'" 
                                class="logo-container"
                              >
                                <template v-if="weekScheduleData[row - 1][dayIndex + 4]?.logoStreamer">
                                  <img 
                                    v-if="getStreamerLogo(weekScheduleData[row - 1][dayIndex + 4]?.logoStreamer)"
                                    :src="getStreamerLogo(weekScheduleData[row - 1][dayIndex + 4]?.logoStreamer)"
                                    class="logo-image"
                                    alt="Logo"
                                  />
                                  <div 
                                    v-else 
                                    class="logo-text"
                                    :style="getLogoStyle(weekScheduleData[row - 1][dayIndex + 4]?.logoStreamer)"
                                  >
                                    {{ getStreamerLogoText(weekScheduleData[row - 1][dayIndex + 4]?.logoStreamer) }}
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </template>

              <!-- 左侧表头样式 -->
              <template v-else-if="currentSchedule.style.themeStyle === 'left-weekday'">
                <table class="min-w-full" :style="{ borderColor: currentSchedule.style.themeColor }">
                  <thead>
                    <tr>
                      <th class="border bg-gray-50 px-4 py-2"
                        :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      >时间/主播</th>
                      <th v-for="streamer in streamers" :key="streamer.id"
                        class="border bg-gray-50 px-4 py-2"
                        :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      >
                        {{ streamer.name }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(day, dayIndex) in weekDays" :key="day.name">
                      <th class="border bg-gray-50 px-4 py-2"
                        :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      >
                        <div class="font-medium">{{ day.name }}</div>
                        <div class="text-sm opacity-75">{{ day.date }}</div>
                      </th>
                      <td v-for="(streamer, streamerIndex) in streamers" :key="streamer.id"
                        class="border"
                        :style="{ borderColor: currentSchedule.style.themeColor }"
                      >
                        <div class="px-4 py-2 min-h-[80px]">
                          <div class="space-y-1">
                            <div class="text-sm" :style="{ color: currentSchedule.style.themeColor }">18:30</div>
                            <div class="text-sm" :style="{ color: currentSchedule.style.themeColor }">21:00</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- 上方主播名称样式 -->
              <template v-else>
                <table class="min-w-full" :style="{ borderColor: currentSchedule.style.themeColor }">
                  <thead>
                    <tr>
                      <th class="border bg-gray-50 px-4 py-2"
                        :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      >主播/时间</th>
                      <th v-for="(time, index) in ['18:30', '21:00']" :key="time"
                        class="border bg-gray-50 px-4 py-2"
                        :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      >
                        {{ time }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(day, dayIndex) in weekDays" :key="day.name">
                      <th class="border bg-gray-50 px-4 py-2"
                        :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      >
                        <div class="font-medium">{{ day.name }}</div>
                        <div class="text-sm opacity-75">{{ day.date }}</div>
                      </th>
                      <td v-for="timeIndex in 2" :key="timeIndex"
                        class="border"
                        :style="{ borderColor: currentSchedule.style.themeColor }"
                      >
                        <div class="px-4 py-2 min-h-[80px]" @click="editCell(timeIndex - 1, dayIndex)">
                          <div v-if="weekScheduleData[timeIndex - 1][dayIndex]" class="space-y-1">
                            <div class="font-medium" :style="{ color: currentSchedule.style.themeColor }">
                              {{ weekScheduleData[timeIndex - 1][dayIndex]?.streamer }}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </div>

            <!-- 月排班表 -->
            <div v-else class="schedule-table-container month-view">
              <!-- 成员logo显示区域 -->
              <div v-if="currentSchedule.data.logoPosition && currentSchedule.data.logoPosition !== 'none' && currentSchedule.data.logoStreamers?.length > 0"
                class="streamers-logo-container flex items-center h-6 mb-2"
                :style="{
                  justifyContent: currentSchedule.data.logoPosition === 'left' ? 'flex-start' : 
                                 currentSchedule.data.logoPosition === 'center' ? 'center' : 
                                 currentSchedule.data.logoPosition === 'right' ? 'flex-end' : 'center'
                }"
              >
                <div v-for="streamerName in currentSchedule.data.logoStreamers" :key="streamerName"
                  class="streamer-logo-item"
                >
                  <img 
                    v-if="getStreamerLogo(streamerName)"
                    :src="getStreamerLogo(streamerName)"
                    class="w-6 h-6 rounded-full object-cover"
                    alt="Logo"
                  />
                  <div 
                    v-else 
                    class="streamer-logo-text rounded-full flex items-center justify-center text-xs font-bold text-white"
                    :style="getLogoStyle(streamerName)"
                  >
                    {{ getStreamerLogoText(streamerName) }}
                  </div>
                </div>
              </div>
              
              <table class="schedule-grid" :style="{ borderColor: currentSchedule.style.themeColor }">
                <thead>
                  <tr>
                    <th v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day"
                      class="border schedule-header"
                      :style="{ borderColor: currentSchedule.style.themeColor, color: currentSchedule.style.themeColor }"
                      :data-cell-id="'header-' + day"
                    >
                      <div :style="{ fontSize: currentSchedule.style.weekdayFontSize }">周{{ day }}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(week, weekIndex) in getMonthCalendarData()" :key="weekIndex">
                    <td v-for="(day, dayIndex) in week" :key="dayIndex"
                      class="border schedule-cell calendar-cell"
                      :class="{ 
                        'other-month': !day.isCurrentMonth,
                        'merged-main': isMergedMainCell(weekIndex, dayIndex),
                        'merged-hidden': isMergedHiddenCell(weekIndex, dayIndex)
                      }"
                      :style="{ 
                        borderColor: currentSchedule.style.themeColor,
                        color: day.isCurrentMonth ? 'inherit' : '#999',
                        backgroundColor: day.isCurrentMonth ? getBackgroundColor(day.slots[0]) : 'transparent',
                        ...getMergedCellStyle(weekIndex, dayIndex)
                      }"
                      :colspan="getColSpan(weekIndex, dayIndex)"
                      :rowspan="getRowSpan(weekIndex, dayIndex)"
                      v-show="!isMergedHiddenCell(weekIndex, dayIndex)"
                      :data-cell-id="'cell-' + weekIndex + '-' + dayIndex"
                    >
                      <div class="date-header" :style="{ color: currentSchedule.style.themeColor }">
                        <template v-if="isMergedMainCell(weekIndex, dayIndex)">
                          {{ getMergedDateRange(weekIndex, dayIndex) }}
                        </template>
                        <template v-else>
                          {{ day.date.getDate() }}日
                        </template>
                      </div>
                      <div class="cell-content"
                        :class="{ selected: isCellSelected(weekIndex, dayIndex) }"
                        @click="handleCellClick(dayIndex, weekIndex)"
                        @mousedown="handleCellMouseDown(weekIndex, dayIndex, $event)"
                        @mousemove="handleCellMouseMove(weekIndex, dayIndex)"
                        @mouseup="handleMouseUp"
                        @contextmenu="handleCellContextMenu(weekIndex, dayIndex, $event)"
                      >
                        <div v-if="day.slots[0]" class="space-y-1 relative">
                          <!-- 显示时间 -->
                          <div v-if="day.slots[0].showTime && day.slots[0].time && day.slots[0].type !== 'rest'" 
                            class="text-sm"
                            :style="{ 
                              color: getTextColor(day.slots[0]),
                              fontSize: day.slots[0]?.style?.fontSize || 'inherit'
                            }"
                          >
                            {{ day.slots[0].time }}
                          </div>
                          <!-- 显示内容 -->
                          <div class="font-medium" 
                            :style="{ 
                              color: getTextColor(day.slots[0]),
                              fontSize: day.slots[0]?.style?.fontSize || 'inherit'
                            }"
                          >
                            <template v-if="day.slots[0].isImage">
                              <el-image
                                :src="day.slots[0].imageUrl"
                                :preview-src-list="[day.slots[0].imageUrl]"
                                fit="contain"
                                class="cell-image"
                                style="width: 100%; max-height: 60px;"
                              >
                                <template #error>
                                  <div class="image-error">
                                    <el-icon><Picture /></el-icon>
                                    <span>加载失败</span>
                                  </div>
                                </template>
                              </el-image>
                            </template>
                            <template v-else>
                              <template v-if="day.slots[0].type === 'manual'">
                                <template v-if="!day.slots[0].showAvatar">
                                  {{ day.slots[0].streamers.join('、') }}
                                </template>
                                <template v-else>
                                  <div class="flex justify-center flex-wrap"
                                    :class="{
                                      'grid-avatar-container': day.slots[0].streamers.length === 4,
                                      'single-row-avatars': day.slots[0].streamers.length <= 3,
                                      'multi-row-avatars': day.slots[0].streamers.length > 4
                                    }"
                                    style="gap: 5px;"
                                  >
                                    <el-avatar
                                      v-for="streamerName in day.slots[0].streamers"
                                      :key="streamerName"
                                      :size="day.slots[0].streamers.length >= 3 ? 30 : day.slots[0].streamers.length === 2 ? 40 : 50"
                                      :src="getStreamerAvatarByName(streamerName)"
                                      :style="{ backgroundColor: '#409EFF' }"
                                    >
                                      {{streamerName ? streamerName.charAt(0) : ''}}
                                    </el-avatar>
                                  </div>
                                </template>
                              </template>
                              <template v-else-if="day.slots[0].type === 'custom'">
                                {{ day.slots[0].customContent }}
                              </template>
                              <template v-else-if="day.slots[0].type === 'group'">
                                <!-- 团播类型需要先判断是否为图片显示 -->
                                <template v-if="day.slots[0].isImage">
                                  <el-image
                                    :src="day.slots[0].imageUrl"
                                    :preview-src-list="[day.slots[0].imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  团播
                                </template>
                              </template>
                              <template v-else-if="day.slots[0].type === 'rest'">
                                <!-- 休息类型需要先判断是否为图片显示 -->
                                <template v-if="day.slots[0].isImage">
                                  <el-image
                                    :src="day.slots[0].imageUrl"
                                    :preview-src-list="[day.slots[0].imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  <span :class="{ 'rest-text': day.slots[0].useShortText }" :style="{ width: getRestTextWidth(day.slots[0]) }">
                                    {{ day.slots[0].useShortText ? '休' : '休息' }}
                                  </span>
                                </template>
                              </template>
                            </template>
                          </div>
                          
                          <!-- 修改：月排班表的Logo显示 -->
                          <div v-if="day.slots[0]?.logoType === 'custom' && day.slots[0]?.type !== 'rest'" 
                            class="logo-container"
                          >
                            <template v-if="day.slots[0]?.logoStreamer">
                              <img 
                                v-if="getStreamerLogo(day.slots[0]?.logoStreamer)"
                                :src="getStreamerLogo(day.slots[0]?.logoStreamer)"
                                class="logo-image"
                                alt="Logo"
                              />
                              <div 
                                v-else 
                                class="logo-text"
                                :style="getLogoStyle(day.slots[0]?.logoStreamer)"
                              >
                                {{ getStreamerLogoText(day.slots[0]?.logoStreamer) }}
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>

    <!-- 成员管理对话框 -->
    <el-dialog
      v-model="memberDialogVisible"
      title="成员管理"
      width="80%"
      :close-on-click-modal="true"
      destroy-on-close
      class="member-dialog"
    >
      <div class="flex justify-end mb-4 space-x-2">
        <el-button type="primary" @click="handleImportMember">
          <el-icon class="mr-1"><Upload /></el-icon>导入
        </el-button>
        <el-button type="primary" @click="handleExportMember">
          <el-icon class="mr-1"><Download /></el-icon>导出
        </el-button>
        <el-button type="primary" @click="startAddMember">
          <el-icon class="mr-1"><Plus /></el-icon>新建
        </el-button>
      </div>
      
      <el-table
        :data="streamers"
        style="width: 100%; margin: 10px 0; height: calc(70vh - 150px);"
        :border="true"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          textAlign: 'center'
        }"
        :cell-style="{
          textAlign: 'center'
        }"
      >
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="description" label="备注" min-width="200" />
        <el-table-column label="头像" width="100">
          <template #default="scope">
            <el-avatar
              :size="40"
              :src="scope.row.avatar"
              :style="{ backgroundColor: scope.row.avatar ? 'transparent' : '#409EFF' }"
            >
              {{scope.row.name.charAt(0)}}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="Logo" width="100">
          <template #default="scope">
            <el-avatar
              :size="40"
              :src="scope.row.logo"
              :style="{ backgroundColor: scope.row.logo ? 'transparent' : '#409EFF' }"
            >
              {{ scope.row.logoText || 'Logo' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="120">
          <template #default="scope">
            <div class="flex items-center">
              <div 
                class="color-preview w-8 h-8 rounded border border-gray-200"
                :style="{ 
                  backgroundColor: scope.row.useCustomColor && scope.row.color ? scope.row.color : '',
                  opacity: scope.row.useCustomColor ? 1 : 0.5
                }"
                :title="scope.row.useCustomColor && scope.row.color ? scope.row.color : '默认颜色'"
              ></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最后修改时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <div class="flex space-x-2">
              <el-button
                type="primary"
                :icon="Edit"
                circle
                @click="startEditMember(scope.row)"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="handleDeleteMember(scope.row.id)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="addMemberDialogVisible"
      title="添加成员"
      width="500px"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <el-form :model="memberForm" label-width="80px" class="member-dialog-form">
        <el-form-item label="名称" required>
          <div class="form-input-container" style="max-width: 300px;">
            <el-input v-model="memberForm.name" placeholder="请输入名称" />
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <div class="form-input-container" style="max-width: 300px;">
            <el-input
              v-model="memberForm.description"
              type="textarea"
              :rows="3"
              class="description-textarea"
              placeholder="请输入备注"
            />
          </div>
        </el-form-item>
        <el-form-item label="头像">
          <div class="flex items-center space-x-4">
            <el-avatar
              :size="40"
              :src="memberForm.avatar"
              :style="{ backgroundColor: memberForm.avatar ? 'transparent' : '#409EFF', width: '40px' }"
            >
              {{memberForm.name.charAt(0) || '名'}}
            </el-avatar>
            <div class="flex-1" style="margin-top: 5px;">
              <el-input
                v-model="memberForm.avatar"
                placeholder="请输入图片链接"
              >
                <template #append>
                  <el-button @click="memberForm.avatar = ''">清除</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="Logo">
          <div class="flex items-center space-x-4">
            <el-avatar
              :size="40"
              :src="memberForm.logo"
              :style="{ backgroundColor: memberForm.logo ? 'transparent' : '#409EFF', width: '40px' }"
            >
              {{ memberForm.logoText || 'Logo' }}
            </el-avatar>
            <div class="flex-1" style="margin-top: 5px;">
              <div class="flex items-center justify-between mb-2">
                <el-switch
                  v-model="memberForm.isLogoImage"
                  active-text="图片"
                  inactive-text="文字"
                />
              </div>
              <template v-if="memberForm.isLogoImage">
                <el-input
                  v-model="memberForm.logo"
                  placeholder="请输入图片链接"
                  class="w-full"
                >
                  <template #append>
                    <el-button @click="memberForm.logo = ''">清除</el-button>
                  </template>
                </el-input>
              </template>
              <template v-else>
                <el-input
                  v-model="memberForm.logoText"
                  placeholder="请输入Logo文字"
                  class="w-full"
                />
              </template>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="颜色" class="color-form-item">
          <div class="color-switch-container">
            <el-switch
              v-model="memberForm.useCustomColor"
              active-text="自定义"
              inactive-text="默认"
            />
            <div class="color-input-container" :class="{ hidden: !memberForm.useCustomColor }">
              <el-color-picker
                v-if="memberForm.useCustomColor"
                v-model="memberForm.color"
                :show-alpha="false"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddMember">添加</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑成员对话框 -->
    <el-dialog
      v-model="editMemberDialogVisible"
      title="编辑成员"
      width="500px"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <el-form :model="memberForm" label-width="80px" class="member-dialog-form">
        <el-form-item label="名称" required>
          <div class="form-input-container" style="max-width: 300px;">
            <el-input v-model="memberForm.name" placeholder="请输入名称" />
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <div class="form-input-container" style="max-width: 300px;">
            <el-input
              v-model="memberForm.description"
              type="textarea"
              :rows="3"
              class="description-textarea"
              placeholder="请输入备注"
            />
          </div>
        </el-form-item>
        <el-form-item label="头像">
          <div class="flex items-center space-x-4">
            <el-avatar
              :size="40"
              :src="memberForm.avatar"
              :style="{ backgroundColor: memberForm.avatar ? 'transparent' : '#409EFF', width: '40px' }"
            >
              {{memberForm.name.charAt(0) || '名'}}
            </el-avatar>
            <div class="flex-1" style="margin-top: 5px;">
              <el-input
                v-model="memberForm.avatar"
                placeholder="请输入图片链接"
              >
                <template #append>
                  <el-button @click="memberForm.avatar = ''">清除</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="Logo">
          <div class="flex items-center space-x-4">
            <el-avatar
              :size="40"
              :src="memberForm.logo"
              :style="{ backgroundColor: memberForm.logo ? 'transparent' : '#409EFF', width: '40px' }"
            >
              {{ memberForm.logoText || 'Logo' }}
            </el-avatar>
            <div class="flex-1" style="margin-top: 5px;">
              <div class="flex items-center justify-between mb-2">
                <el-switch
                  v-model="memberForm.isLogoImage"
                  active-text="图片"
                  inactive-text="文字"
                />
              </div>
              <template v-if="memberForm.isLogoImage">
                <el-input
                  v-model="memberForm.logo"
                  placeholder="请输入图片链接"
                  class="w-full"
                >
                  <template #append>
                    <el-button @click="memberForm.logo = ''">清除</el-button>
                  </template>
                </el-input>
              </template>
              <template v-else>
                <el-input
                  v-model="memberForm.logoText"
                  placeholder="请输入Logo文字"
                  class="w-full"
                />
              </template>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="颜色" class="color-form-item">
          <div class="color-switch-container">
            <el-switch
              v-model="memberForm.useCustomColor"
              active-text="自定义"
              inactive-text="默认"
            />
            <div class="color-input-container" :class="{ hidden: !memberForm.useCustomColor }">
              <el-color-picker
                v-if="memberForm.useCustomColor"
                v-model="memberForm.color"
                :show-alpha="false"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditMember">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新建排班表对话框 -->
    <el-dialog
      v-model="newScheduleDialogVisible"
      :title="isEditMode ? '编辑排班表' : '新建排班表'"
      width="500px"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <el-form :model="newScheduleForm" label-width="100px">
        <el-form-item label="选择模板">
          <el-select v-model="newScheduleForm.template" class="w-full" placeholder="请选择模板">
            <el-option label="空白模板" value="" />
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            >
              <div class="flex items-center justify-between">
                <span>{{ template.name }}</span>
                <span class="text-gray-400 text-sm">{{ formatDate(new Date(template.createTime).getTime()) }}</span>
              </div>
              <div v-if="template.description" class="text-gray-400 text-sm mt-1 truncate">
                {{ template.description }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="排班表格式">
          <div class="space-y-4">
            <el-radio-group 
              v-model="newScheduleForm.format" 
              class="flex flex-wrap gap-4"
              :disabled="!!newScheduleForm.template"
            >
              <el-radio :value="'current_week'">本周</el-radio>
              <el-radio :value="'month_week'">本月周</el-radio>
              <el-radio :value="'current_month'">本月</el-radio>
              <el-radio :value="'next_month'">下个月</el-radio>
            </el-radio-group>
            
            <!-- 本月周选择下拉框 -->
            <el-select
              v-if="newScheduleForm.format === 'month_week'"
              v-model="selectedMonthWeek"
              class="w-full"
              placeholder="请选择周"
              :disabled="!!newScheduleForm.template"
            >
              <el-option
                v-for="week in currentMonthWeeks"
                :key="week.value"
                :label="week.label"
                :value="week.value"
              />
            </el-select>
          </div>
        </el-form-item>
        
        <el-form-item label="排班表标题" required>
          <el-input v-model="newScheduleForm.title" placeholder="请输入标题" />
        </el-form-item>
        
        <!-- 添加标题字体大小设置 -->
        <el-form-item label="标题大小">
          <el-select v-model="newScheduleForm.style.titleFontSize" class="w-full">
            <el-option label="18px" value="18px" />
            <el-option label="20px" value="20px" />
            <el-option label="一般 (24px)" value="24px" />
            <el-option label="28px" value="28px" />
            <el-option label="32px" value="32px" />
            <el-option label="36px" value="36px" />
            <el-option label="42px" value="42px" />
            <el-option label="50px" value="50px" />
            <el-option label="55px" value="55px" />
            <el-option label="60px" value="60px" />
            <el-option label="65px" value="65px" />
            <el-option label="70px" value="70px" />
            <el-option label="75px" value="75px" />
            <el-option label="80px" value="80px" />
          </el-select>
        </el-form-item>

        <!-- 添加星期字体大小设置 -->
        <el-form-item label="星期大小">
          <el-select v-model="newScheduleForm.style.weekdayFontSize" class="w-full">
            <el-option label="12px" value="12px" />
            <el-option label="14px" value="14px" />
            <el-option label="一般 (16px)" value="16px" />
            <el-option label="18px" value="18px" />
            <el-option label="20px" value="20px" />
            <el-option label="22px" value="22px" />
            <el-option label="24px" value="24px" />
            <el-option label="26px" value="26px" />
            <el-option label="28px" value="28px" />
            <el-option label="30px" value="30px" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="字体">
          <el-select v-model="newScheduleForm.style.font" class="w-full">
            <el-option-group label="阿里巴巴惠普体">
              <el-option label="阿里巴巴惠普体 特细" value="AlibabaSans-Thin" />
              <el-option label="阿里巴巴惠普体 细体" value="AlibabaSans-Light" />
              <el-option label="阿里巴巴惠普体 常规" value="AlibabaSans-Regular" />
              <el-option label="阿里巴巴惠普体 中等" value="AlibabaSans-Medium" />
              <el-option label="阿里巴巴惠普体 粗体" value="AlibabaSans-Bold" />
              <el-option label="阿里巴巴惠普体 黑体" value="AlibabaSans-Black" />
            </el-option-group>
            <el-option-group label="华为鸿蒙Sans">
              <el-option label="鸿蒙Sans 特细" value="HarmonyOS_Sans_Thin" />
              <el-option label="鸿蒙Sans 细体" value="HarmonyOS_Sans_Light" />
              <el-option label="鸿蒙Sans 常规" value="HarmonyOS_Sans_Regular" />
              <el-option label="鸿蒙Sans 中等" value="HarmonyOS_Sans_Medium" />
              <el-option label="鸿蒙Sans 粗体" value="HarmonyOS_Sans_Bold" />
              <el-option label="鸿蒙Sans 黑体" value="HarmonyOS_Sans_Black" />
            </el-option-group>
          </el-select>
        </el-form-item>
        
        <el-form-item label="主题颜色">
          <el-color-picker v-model="newScheduleForm.style.themeColor" />
        </el-form-item>
        
        <el-form-item label="线条粗度">
          <el-radio-group v-model="newScheduleForm.style.borderWidth">
            <el-radio :value="'1'">默认</el-radio>
            <el-radio :value="'2'">2倍</el-radio>
            <el-radio :value="'3'">3倍</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="背景图片">
          <div class="flex items-center space-x-4">
            <div class="flex-1">
              <el-input
                v-model="newScheduleForm.style.backgroundImage"
                placeholder="请输入图片链接"
              >
                <template #append>
                  <el-button @click="newScheduleForm.style.backgroundImage = ''">清除</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="星期排序">
          <el-radio-group 
            v-model="newScheduleForm.style.weekdayLayout"
            :disabled="!!newScheduleForm.template || newScheduleForm.format === 'current_month' || newScheduleForm.format === 'next_month'"
          >
            <el-radio :value="'single'">一行</el-radio>
            <el-radio :value="'double'" :disabled="newScheduleForm.format === 'current_month' || newScheduleForm.format === 'next_month'">两行</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 添加主播logo显示设置 -->
        <el-form-item label="主播logo显示">
          <div class="space-y-2">
            <el-radio-group v-model="newScheduleForm.logoPosition" class="flex flex-wrap gap-2">
              <el-radio :value="'none'">关闭</el-radio>
              <el-radio :value="'left'">左边</el-radio>
              <el-radio :value="'center'">中间</el-radio>
              <el-radio :value="'right'">右边</el-radio>
            </el-radio-group>
            
            <!-- 当选择非关闭选项时显示成员多选下拉框 -->
            <div v-if="newScheduleForm.logoPosition && newScheduleForm.logoPosition !== 'none'" class="mt-2">
              <el-select
                v-model="newScheduleForm.logoStreamers"
                multiple
                filterable
                class="w-full"
                placeholder="请选择要显示logo的成员"
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
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newScheduleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateSchedule">{{ isEditMode ? '完成' : '创建' }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="排班表模板"
      width="80%"
      :close-on-click-modal="true"
      destroy-on-close
      class="template-dialog"
    >
      <div class="flex justify-end mb-4 space-x-2">
        <el-button type="primary" @click="handleImportTemplate">
          <el-icon class="mr-1"><Upload /></el-icon>导入
        </el-button>
        <el-button type="primary" @click="handleExportTemplates">
          <el-icon class="mr-1"><Download /></el-icon>导出
        </el-button>
      </div>
      
      <el-table
        :data="templates"
        style="width: 100%; margin: 10px 0; height: calc(70vh - 150px);"
        :border="true"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          textAlign: 'center'
        }"
        :cell-style="{
          textAlign: 'center'
        }"
      >
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(new Date(scope.row.createTime).getTime()) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <div class="flex space-x-2 justify-center">
              <el-button
                type="primary"
                :icon="View"
                circle
                @click="handleViewTemplate(scope.row)"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="handleDeleteTemplate(scope.row.id)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 查看模板对话框 -->
    <el-dialog
      v-model="viewTemplateDialogVisible"
      :title="currentViewTemplate?.name"
      width="80%"
      destroy-on-close
      class="template-preview-dialog"
      :before-close="handlePreviewClose"
    >
      <div class="space-y-4" v-if="currentViewTemplate && currentViewTemplate.data">
        <div class="text-sm text-gray-500">
          {{ currentViewTemplate.description }}
        </div>
        <div class="text-sm text-gray-500">
          格式：{{ formatType(currentViewTemplate?.data?.schedule?.data?.format) }}
          <template v-if="currentViewTemplate?.data?.schedule?.data?.format === 'month_week'">
            （第{{ currentViewTemplate?.data?.schedule?.data?.selectedWeek }}周）
          </template>
        </div>
        <div class="mt-6" v-if="currentViewTemplate.data.schedule">
          <h3 class="font-medium text-gray-900 mb-4 mt-4 margin-t-b-5">模板预览</h3>
          <el-card class="preview-schedule-table" shadow="hover" ref="previewTableRef"
              :style="{ 
              fontFamily: currentViewTemplate.data.schedule.style?.font,
              backgroundImage: currentViewTemplate.data.schedule.style?.backgroundImage ? `url(${currentViewTemplate.data.schedule.style.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '--preview-theme-color-rgb': getThemeColorRGB(currentViewTemplate.data.schedule.style?.themeColor)
            }"
          >
            <div class="schedule-content" 
              :style="{
                gap: currentViewTemplate.data.schedule.data?.logoPosition === 'none' ? '.5rem' : '0'
              }"
            >
              <!-- 排班表标题 -->
              <div class="text-center mb-2">
                <h2 class="text-2xl font-bold mb-2" 
                  :style="{ 
                    color: currentViewTemplate.data.schedule.style?.themeColor,
                    fontSize: currentViewTemplate.data.schedule.style?.titleFontSize 
                  }"
                >
                  {{ currentViewTemplate.data.schedule.data?.title }}
                </h2>
                <p :style="{ color: currentViewTemplate.data.schedule.style?.themeColor }">
                  {{ currentViewTemplate.data.schedule.data?.dateRange }}
                </p>
              </div>

              <!-- 周排班表预览 -->
              <div v-if="['current_week', 'month_week'].includes(currentViewTemplate?.data?.schedule?.data?.format)" 
                class="schedule-table-container"
              >
                <!-- 成员logo显示区域 -->
                <div v-if="currentViewTemplate.data.schedule.data?.logoPosition && currentViewTemplate.data.schedule.data?.logoPosition !== 'none' && currentViewTemplate.data.schedule.data?.logoStreamers?.length > 0"
                  class="streamers-logo-container flex items-center h-6 mb-2"
                  :style="{
                    justifyContent: currentViewTemplate.data.schedule.data?.logoPosition === 'left' ? 'flex-start' : 
                                   currentViewTemplate.data.schedule.data?.logoPosition === 'center' ? 'center' : 
                                   currentViewTemplate.data.schedule.data?.logoPosition === 'right' ? 'flex-end' : 'center'
                  }"
                >
                  <div v-for="streamerName in currentViewTemplate.data.schedule.data?.logoStreamers" :key="streamerName"
                    class="streamer-logo-item"
                  >
                    <img 
                      v-if="getStreamerLogo(streamerName)"
                      :src="getStreamerLogo(streamerName)"
                      class="w-6 h-6 rounded-full object-cover"
                      alt="Logo"
                    />
                    <div 
                      v-else 
                      class="streamer-logo-text rounded-full flex items-center justify-center text-xs font-bold text-white"
                      :style="getLogoStyle(streamerName, true)"
                    >
                      {{ getStreamerLogoText(streamerName) }}
                    </div>
                  </div>
                </div>
                
                <table class="schedule-grid preview-table" 
                  :style="{ borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor }"
                  :data-layout="currentViewTemplate?.data?.schedule?.style?.weekdayLayout"
                >
                  <thead>
                    <tr>
                      <template v-if="currentViewTemplate?.data?.schedule?.style?.weekdayLayout === 'single'">
                        <th v-for="(day, index) in previewWeekDays" :key="index" 
                          class="border schedule-header"
                          :style="{ 
                            borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor, 
                            color: currentViewTemplate?.data?.schedule?.style?.themeColor,
                            borderWidth: currentViewTemplate?.data?.schedule?.style?.borderWidth + 'px'
                          }"
                        >
                          <div :style="{ fontSize: currentViewTemplate?.data?.schedule?.style?.weekdayFontSize }">{{ day.name }}</div>
                          <div class="text-sm opacity-75">{{ day.date }}</div>
                        </th>
                      </template>
                      <template v-else>
                        <!-- 第一行显示周一到周四 -->
                        <th v-for="(day, index) in previewWeekDays.slice(0, 4)" :key="index" 
                          class="border schedule-header"
                          :style="{ 
                            borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor, 
                            color: currentViewTemplate?.data?.schedule?.style?.themeColor,
                            borderWidth: currentViewTemplate?.data?.schedule?.style?.borderWidth + 'px'
                          }"
                        >
                          <div :style="{ fontSize: currentViewTemplate?.data?.schedule?.style?.weekdayFontSize }">{{ day.name }}</div>
                          <div class="text-sm opacity-75">{{ day.date }}</div>
                        </th>
                      </template>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="currentViewTemplate?.data?.schedule?.style?.weekdayLayout === 'single'">
                      <tr v-for="row in 2" :key="row">
                        <td v-for="(day, dayIndex) in previewWeekDays" :key="dayIndex"
                          class="border schedule-cell week-schedule"
                          :style="getCellStyle(currentViewTemplate?.data?.weekScheduleData?.[row - 1]?.[dayIndex], currentViewTemplate?.data?.schedule?.style, true)"
                          :colspan="currentViewTemplate?.data?.mergedCellsData ? getViewColSpan(row - 1, dayIndex) : 1"
                          :rowspan="currentViewTemplate?.data?.mergedCellsData ? getViewRowSpan(row - 1, dayIndex) : 1"
                          v-show="!isViewMergedHiddenCell(row - 1, dayIndex)"
                        >
                          <div class="cell-content" 
                            :style="{
                              fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize,
                              color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex], true)
                            }"
                          >
                            <div v-if="currentViewTemplate?.data?.weekScheduleData?.[row - 1]?.[dayIndex]" class="space-y-1 relative">
                              <!-- 显示时间 -->
                              <div v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].showTime && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].time && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].type !== 'rest'" 
                                class="text-sm"
                                :style="{ 
                                  color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex], true),
                                  fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize
                                }"
                              >
                                {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].time }}
                              </div>
                              <!-- 显示内容 -->
                              <div class="font-medium"
                                :style="{ 
                                  color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex], true),
                                  fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize
                                }"
                              >
                                <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].type === 'manual'">
                                  <template v-if="!currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].showAvatar">
                                    {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers.join('、') }}
                                  </template>
                                  <template v-else>
                                    <div class="flex justify-center flex-wrap"
                                      :class="{
                                        'grid-avatar-container': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers.length === 4,
                                        'single-row-avatars': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers.length <= 3,
                                        'multi-row-avatars': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers.length > 4
                                      }"
                                      style="gap: 5px;"
                                    >
                                      <el-avatar
                                        v-for="streamerName in currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers"
                                        :key="streamerName"
                                        :size="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers.length >= 3 ? 30 : currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].streamers.length === 2 ? 40 : 50"
                                        :src="getStreamerAvatarByName(streamerName)"
                                        :style="{ backgroundColor: '#409EFF' }"
                                      >
                                        {{streamerName ? streamerName.charAt(0) : ''}}
                                      </el-avatar>
                                    </div>
                                  </template>
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].type === 'custom'">
                                  {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].customContent }}
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].type === 'group'">
                                  <!-- 团播类型需要先判断是否为图片显示 -->
                                  <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].isImage">
                                    <el-image
                                      :src="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].imageUrl"
                                      :preview-src-list="[currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].imageUrl]"
                                      fit="contain"
                                      class="cell-image"
                                      style="width: 100%; max-height: 60px;"
                                    >
                                      <template #error>
                                        <div class="image-error">
                                          <el-icon><Picture /></el-icon>
                                          <span>加载失败</span>
                                        </div>
                                      </template>
                                    </el-image>
                                  </template>
                                  <template v-else>
                                    团播
                                  </template>
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].type === 'rest'">
                                  <!-- 休息类型需要先判断是否为图片显示 -->
                                  <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].isImage">
                                    <el-image
                                      :src="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].imageUrl"
                                      :preview-src-list="[currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].imageUrl]"
                                      fit="contain"
                                      class="cell-image"
                                      style="width: 100%; max-height: 60px;"
                                    >
                                      <template #error>
                                        <div class="image-error">
                                          <el-icon><Picture /></el-icon>
                                          <span>加载失败</span>
                                        </div>
                                      </template>
                                    </el-image>
                                  </template>
                                  <template v-else>
                                    <span :class="{ 'rest-text': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].useShortText }" :style="{ width: getRestTextWidth(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex]) }">
                                      {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].useShortText ? '休' : '休息' }}
                                    </span>
                                  </template>
                                </template>
                              </div>
                              
                              <!-- 显示Logo -->
                              <div v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex]?.logoType === 'custom' && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].type !== 'rest'" 
                                class="logo-container"
                              >
                                <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex]?.logoStreamer">
                                  <img 
                                    v-if="getStreamerLogo(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].logoStreamer)"
                                    :src="getStreamerLogo(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].logoStreamer)"
                                    class="logo-image"
                                    alt="Logo"
                                  />
                                  <div 
                                    v-else 
                                    class="logo-text"
                                    :style="getLogoStyle(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].logoStreamer, true)"
                                  >
                                    {{ getStreamerLogoText(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex].logoStreamer) }}
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <!-- 第一行周一到周四的空格子 -->
                      <tr v-for="row in 2" :key="'first-' + row">
                        <td v-for="dayIndex in 4" :key="'first-' + dayIndex"
                          class="border schedule-cell"
                          :style="{
                            borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor,
                            backgroundColor: getBackgroundColor(currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex - 1], true)
                          }"
                          :data-cell-id="'cell-' + (row - 1) + '-' + (dayIndex - 1)"
                          :colspan="getColSpan(row - 1, dayIndex - 1)"
                          :rowspan="getRowSpan(row - 1, dayIndex - 1)"
                          v-show="!isViewMergedHiddenCell(row - 1, dayIndex - 1)"
                        >
                          <div class="cell-content" 
                            :style="{
                              fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex - 1]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize,
                              color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex - 1], true)
                            }"
                          >
                            <div v-if="currentViewTemplate?.data?.weekScheduleData?.[row - 1]?.[dayIndex - 1]" class="space-y-1 relative">
                              <!-- 显示时间 -->
                              <div v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].showTime && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].time && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].type !== 'rest'" 
                                class="text-sm"
                                :style="{ 
                                  color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1], true),
                                  fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex - 1]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize
                                }"
                              >
                                {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].time }}
                              </div>
                              <!-- 显示内容 -->
                              <div class="font-medium"
                                :style="{ 
                                  color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1], true),
                                  fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex - 1]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize
                                }"
                              >
                                <!-- 内容显示部分 -->
                                <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].type === 'manual'">
                                  <template v-if="!currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].showAvatar">
                                    {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers.join('、') }}
                                  </template>
                                  <template v-else>
                                    <div class="flex justify-center flex-wrap"
                                      :class="{
                                        'grid-avatar-container': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers.length === 4,
                                        'single-row-avatars': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers.length <= 3,
                                        'multi-row-avatars': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers.length > 4
                                      }"
                                      style="gap: 5px;"
                                    >
                                      <el-avatar
                                        v-for="streamerName in currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers"
                                        :key="streamerName"
                                        :size="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers.length >= 3 ? 30 : currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].streamers.length === 2 ? 40 : 50"
                                        :src="getStreamerAvatarByName(streamerName)"
                                        :style="{ backgroundColor: '#409EFF' }"
                                      >
                                        {{streamerName ? streamerName.charAt(0) : ''}}
                                      </el-avatar>
                                    </div>
                                  </template>
                                </template>
                                <!-- 其他显示类型 -->
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].type === 'custom'">
                                  {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].customContent }}
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].type === 'group'">
                                  <!-- 团播类型需要先判断是否为图片显示 -->
                                  <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].isImage">
                                    <el-image
                                      :src="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].imageUrl"
                                      :preview-src-list="[currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].imageUrl]"
                                      fit="contain"
                                      class="cell-image"
                                      style="width: 100%; max-height: 60px;"
                                    >
                                      <template #error>
                                        <div class="image-error">
                                          <el-icon><Picture /></el-icon>
                                          <span>加载失败</span>
                                        </div>
                                      </template>
                                    </el-image>
                                  </template>
                                  <template v-else>
                                    团播
                                  </template>
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].type === 'rest'">
                                  <!-- 休息类型需要先判断是否为图片显示 -->
                                  <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].isImage">
                                    <el-image
                                      :src="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].imageUrl"
                                      :preview-src-list="[currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].imageUrl]"
                                      fit="contain"
                                      class="cell-image"
                                      style="width: 100%; max-height: 60px;"
                                    >
                                      <template #error>
                                        <div class="image-error">
                                          <el-icon><Picture /></el-icon>
                                          <span>加载失败</span>
                                        </div>
                                      </template>
                                    </el-image>
                                  </template>
                                  <template v-else>
                                    <span :class="{ 'rest-text': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].useShortText }" :style="{ width: getRestTextWidth(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1]) }">
                                      {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].useShortText ? '休' : '休息' }}
                                    </span>
                                  </template>
                                </template>
                              </div>
                              
                              <!-- 显示Logo -->
                              <div v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1]?.logoType === 'custom' && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].type !== 'rest'" 
                                class="logo-container"
                              >
                                <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1]?.logoStreamer">
                                  <img 
                                    v-if="getStreamerLogo(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].logoStreamer)"
                                    :src="getStreamerLogo(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].logoStreamer)"
                                    class="logo-image"
                                    alt="Logo"
                                  />
                                  <div 
                                    v-else 
                                    class="logo-text"
                                    :style="getLogoStyle(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].logoStreamer, true)"
                                  >
                                    {{ getStreamerLogoText(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex - 1].logoStreamer) }}
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <!-- 第二行表头（周五到周日） -->
                      <tr>
                        <th v-for="(day, index) in previewWeekDays.slice(4)" :key="'second-header-' + index" 
                          class="border schedule-header"
                          :style="{ 
                            borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor, 
                            color: currentViewTemplate?.data?.schedule?.style?.themeColor,
                            borderWidth: currentViewTemplate?.data?.schedule?.style?.borderWidth + 'px'
                          }"
                        >
                          <div :style="{ fontSize: currentViewTemplate?.data?.schedule?.style?.weekdayFontSize }">{{ day.name }}</div>
                          <div class="text-sm opacity-75">{{ day.date }}</div>
                        </th>
                        <!-- 添加右侧合并单元格，占据表头行+两行内容 -->
                        <td 
                          class="border schedule-cell"
                          :style="{
                            borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor,
                            backgroundColor: 'transparent',
                            borderWidth: currentViewTemplate?.data?.schedule?.style?.borderWidth + 'px'
                          }"
                          colspan="1"
                          rowspan="3"
                          data-cell-id="cell-extra"
                        >
                          <!-- 空内容 -->
                        </td>
                      </tr>
                      <!-- 第二行周五到周日的空格子 -->
                      <tr v-for="row in 2" :key="'second-' + row">
                        <td v-for="(day, dayIndex) in previewWeekDays.slice(4)" :key="'second-' + dayIndex"
                          class="border schedule-cell"
                          :style="getCellStyle(currentViewTemplate?.data?.weekScheduleData?.[row - 1]?.[dayIndex + 4], currentViewTemplate?.data?.schedule?.style, true)"
                          :colspan="currentViewTemplate?.data?.mergedCellsData ? getViewColSpan(row - 1, dayIndex + 4) : 1"
                          :rowspan="currentViewTemplate?.data?.mergedCellsData ? getViewRowSpan(row - 1, dayIndex + 4) : 1"
                          v-show="!isViewMergedHiddenCell(row - 1, dayIndex + 4)"
                          :data-cell-id="'cell-' + (row - 1) + '-' + (dayIndex + 4)"
                        >
                          <div class="cell-content" 
                            :style="{
                              fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex + 4]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize,
                              color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex + 4], true)
                            }"
                          >
                            <div v-if="currentViewTemplate?.data?.weekScheduleData?.[row - 1]?.[dayIndex + 4]" class="space-y-1 relative">
                              <!-- 显示时间 -->
                              <div v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].showTime && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].time && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].type !== 'rest'" 
                                class="text-sm"
                                :style="{ 
                                  color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4], true),
                                  fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex + 4]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize
                                }"
                              >
                                {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].time }}
                              </div>
                              <!-- 显示内容 -->
                              <div class="font-medium"
                                :style="{ 
                                  color: getTextColor(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4], true),
                                  fontSize: currentViewTemplate.data.weekScheduleData[row - 1]?.[dayIndex + 4]?.style?.fontSize || currentViewTemplate?.data?.schedule?.style?.fontSize
                                }"
                              >
                                <!-- 内容显示部分 -->
                                <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].type === 'manual'">
                                  <template v-if="!currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].showAvatar">
                                    {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers.join('、') }}
                                  </template>
                                  <template v-else>
                                    <div class="flex justify-center flex-wrap"
                                      :class="{
                                        'grid-avatar-container': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers.length === 4,
                                        'single-row-avatars': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers.length <= 3,
                                        'multi-row-avatars': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers.length > 4
                                      }"
                                      style="gap: 5px;"
                                    >
                                      <el-avatar
                                        v-for="streamerName in currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers"
                                        :key="streamerName"
                                        :size="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers.length >= 3 ? 30 : currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].streamers.length === 2 ? 40 : 50"
                                        :src="getStreamerAvatarByName(streamerName)"
                                        :style="{ backgroundColor: '#409EFF' }"
                                      >
                                        {{streamerName ? streamerName.charAt(0) : ''}}
                                      </el-avatar>
                                    </div>
                                  </template>
                                </template>
                                <!-- 其他显示类型 -->
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].type === 'custom'">
                                  {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].customContent }}
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].type === 'group'">
                                  <!-- 团播类型需要先判断是否为图片显示 -->
                                  <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].isImage">
                                    <el-image
                                      :src="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].imageUrl"
                                      :preview-src-list="[currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].imageUrl]"
                                      fit="contain"
                                      class="cell-image"
                                      style="width: 100%; max-height: 60px;"
                                    >
                                      <template #error>
                                        <div class="image-error">
                                          <el-icon><Picture /></el-icon>
                                          <span>加载失败</span>
                                        </div>
                                      </template>
                                    </el-image>
                                  </template>
                                  <template v-else>
                                    团播
                                  </template>
                                </template>
                                <template v-else-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].type === 'rest'">
                                  <!-- 休息类型需要先判断是否为图片显示 -->
                                  <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].isImage">
                                    <el-image
                                      :src="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].imageUrl"
                                      :preview-src-list="[currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].imageUrl]"
                                      fit="contain"
                                      class="cell-image"
                                      style="width: 100%; max-height: 60px;"
                                    >
                                      <template #error>
                                        <div class="image-error">
                                          <el-icon><Picture /></el-icon>
                                          <span>加载失败</span>
                                        </div>
                                      </template>
                                    </el-image>
                                  </template>
                                  <template v-else>
                                    <span :class="{ 'rest-text': currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].useShortText }" :style="{ width: getRestTextWidth(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4]) }">
                                      {{ currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].useShortText ? '休' : '休息' }}
                                    </span>
                                  </template>
                                </template>
                              </div>
                              
                              <!-- 显示Logo -->
                              <div v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4]?.logoType === 'custom' && currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].type !== 'rest'" 
                                class="logo-container"
                              >
                                <template v-if="currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4]?.logoStreamer">
                                  <img 
                                    v-if="getStreamerLogo(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].logoStreamer)"
                                    :src="getStreamerLogo(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].logoStreamer)"
                                    class="logo-image"
                                    alt="Logo"
                                  />
                                  <div 
                                    v-else 
                                    class="logo-text"
                                    :style="getLogoStyle(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].logoStreamer, true)"
                                  >
                                    {{ getStreamerLogoText(currentViewTemplate.data.weekScheduleData[row - 1][dayIndex + 4].logoStreamer) }}
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>

              <!-- 月排班表预览 -->
              <div v-else class="schedule-table-container">
                <!-- 成员logo显示区域 -->
                <div v-if="currentViewTemplate.data.schedule.data?.logoPosition && currentViewTemplate.data.schedule.data?.logoPosition !== 'none' && currentViewTemplate.data.schedule.data?.logoStreamers?.length > 0"
                  class="streamers-logo-container flex items-center h-6 mb-2"
                  :style="{
                    justifyContent: currentViewTemplate.data.schedule.data?.logoPosition === 'left' ? 'flex-start' : 
                                   currentViewTemplate.data.schedule.data?.logoPosition === 'center' ? 'center' : 
                                   currentViewTemplate.data.schedule.data?.logoPosition === 'right' ? 'flex-end' : 'center'
                  }"
                >
                  <div v-for="streamerName in currentViewTemplate.data.schedule.data?.logoStreamers" :key="streamerName"
                    class="streamer-logo-item"
                  >
                    <img 
                      v-if="getStreamerLogo(streamerName)"
                      :src="getStreamerLogo(streamerName)"
                      class="w-6 h-6 rounded-full object-cover"
                      alt="Logo"
                    />
                    <div 
                      v-else 
                      class="streamer-logo-text rounded-full flex items-center justify-center text-xs font-bold text-white"
                      :style="getLogoStyle(streamerName, true)"
                    >
                      {{ getStreamerLogoText(streamerName) }}
                    </div>
                  </div>
                </div>
                
                <table class="schedule-grid preview-table" :style="{ borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor }">
                  <thead>
                    <tr>
                      <th v-for="(day, index) in ['一', '二', '三', '四', '五', '六', '日']" :key="index"
                        class="border schedule-header"
                        :style="{ borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor, color: currentViewTemplate?.data?.schedule?.style?.themeColor }"
                      >
                        <div :style="{ fontSize: currentViewTemplate?.data?.schedule?.style?.weekdayFontSize }">周{{ day }}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(week, weekIndex) in getMonthCalendarWeeks(currentViewTemplate?.data?.monthScheduleData)" :key="weekIndex">
                      <td v-for="(day, dayIndex) in week" :key="dayIndex"
                        class="border schedule-cell calendar-cell"
                        :style="{
                          color: day.isCurrentMonth ? 'inherit' : '#999',
                          backgroundColor: day.isCurrentMonth ? getBackgroundColor(day) : 'transparent',
                          borderColor: currentViewTemplate?.data?.schedule?.style?.themeColor,
                          ...getViewMergedCellStyle(weekIndex, dayIndex, day) 
                        }"
                        :colspan="getViewColSpan(weekIndex, dayIndex)"
                        :rowspan="getViewRowSpan(weekIndex, dayIndex)"
                        v-show="!isViewMergedHiddenCell(weekIndex, dayIndex)"
                        :data-cell-id="'cell-' + weekIndex + '-' + dayIndex"
                      >
                        <div class="date-header" :style="{ color: currentViewTemplate?.data?.schedule?.style?.themeColor }">
                          {{ getViewMergedCellStyle(weekIndex, dayIndex, day).dateRange }}
                        </div>
                        <div class="cell-content" v-if="!isViewMergedHiddenCell(weekIndex, dayIndex)">
                          <div v-if="day" class="space-y-1 relative">
                            <!-- 显示时间 -->
                            <div v-if="day.showTime && day.time && day.type !== 'rest'" 
                              class="text-sm"
                              :style="{ color: getTextColor(day, true) }"
                            >
                              {{ day.time }}
                            </div>
                            <!-- 显示内容 -->
                            <div class="font-medium" :style="{ color: getTextColor(day, true) }">
                              <template v-if="day.type === 'manual'">
                                <template v-if="!day.showAvatar">
                                  {{ day.streamers?.join('、') }}
                                </template>
                                <template v-else>
                                  <div class="flex justify-center flex-wrap"
                                    :class="{
                                      'grid-avatar-container': day.streamers.length === 4,
                                      'single-row-avatars': day.streamers.length <= 3,
                                      'multi-row-avatars': day.streamers.length > 4
                                    }"
                                    style="gap: 5px;"
                                  >
                                    <el-avatar
                                      v-for="streamerName in day.streamers"
                                      :key="streamerName"
                                      :size="day.streamers.length >= 3 ? 30 : day.streamers.length === 2 ? 40 : 50"
                                      :src="getStreamerAvatarByName(streamerName)"
                                      :style="{ backgroundColor: '#409EFF' }"
                                    >
                                      {{streamerName ? streamerName.charAt(0) : ''}}
                                    </el-avatar>
                                  </div>
                                </template>
                              </template>
                              <template v-else-if="day.type === 'custom'">
                                {{ day.customContent }}
                              </template>
                              <template v-else-if="day.type === 'group'">
                                <!-- 团播类型需要先判断是否为图片显示 -->
                                <template v-if="day.isImage">
                                  <el-image
                                    :src="day.imageUrl"
                                    :preview-src-list="[day.imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  团播
                                </template>
                              </template>
                              <template v-else-if="day.type === 'rest'">
                                <!-- 休息类型需要先判断是否为图片显示 -->
                                <template v-if="day.isImage">
                                  <el-image
                                    :src="day.imageUrl"
                                    :preview-src-list="[day.imageUrl]"
                                    fit="contain"
                                    class="cell-image"
                                    style="width: 100%; max-height: 60px;"
                                  >
                                    <template #error>
                                      <div class="image-error">
                                        <el-icon><Picture /></el-icon>
                                        <span>加载失败</span>
                                      </div>
                                    </template>
                                  </el-image>
                                </template>
                                <template v-else>
                                  <span :class="{ 'rest-text': day.useShortText }" :style="{ width: getRestTextWidth(day) }">
                                    {{ day.useShortText ? '休' : '休息' }}
                                  </span>
                                </template>
                              </template>
                            </div>
                            <!-- 显示Logo -->
                            <div v-if="day?.logoType === 'custom' && day?.type !== 'rest'" class="logo-container">
                              <template v-if="day.logoStreamer">
                                <img 
                                  v-if="getStreamerLogo(day.logoStreamer)"
                                  :src="getStreamerLogo(day.logoStreamer)"
                                  class="logo-image"
                                  alt="Logo"
                                />
                                <div 
                                  v-else 
                                  class="logo-text"
                                  :style="getLogoStyle(day.logoStreamer, true)"
                                >
                                  {{ getStreamerLogoText(day.logoStreamer) }}
                                </div>
                              </template>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        模板数据加载中或数据不完整
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handlePreviewClose">关闭</el-button>
          <el-button type="primary" @click="handleUseTemplate(currentViewTemplate)" :disabled="!currentViewTemplate?.data?.schedule">使用此模板</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑排班对话框 -->
    <el-dialog
      v-model="editScheduleDialogVisible"
      title="编辑排班"
      width="500px"
      :close-on-click-modal="true"
      destroy-on-close
      class="edit-schedule-dialog"
    >
      <div class="flex justify-center">
        <el-form :model="editScheduleForm" label-width="80px" class="w-[320px]">
          <el-form-item label="时间" v-if="editScheduleForm.type !== 'rest'">
            <div class="flex items-center space-x-4">
              <el-time-picker
                v-model="editScheduleForm.time"
                placeholder="选择时间"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 180px"
              />
              <el-switch
                v-model="editScheduleForm.showTime"
                active-text="显示时间"
                inactive-text="隐藏时间"
              />
            </div>
          </el-form-item>
          
          <!-- 新增：Logo配置 -->
          <el-form-item label="Logo" v-if="editScheduleForm.type !== 'rest'">
            <el-select v-model="editScheduleForm.logoType" style="width: 100%" placeholder="请选择Logo显示方式">
              <el-option label="关闭" value="none" />
              <el-option label="选择主播" value="custom" />
            </el-select>
          </el-form-item>
          
          <!-- 新增：当选择"选择主播"时显示主播选择 -->
          <el-form-item label="Logo主播" v-if="editScheduleForm.logoType === 'custom' && editScheduleForm.type !== 'rest'">
            <el-select v-model="editScheduleForm.logoStreamer" style="width: 100%" placeholder="请选择主播">
              <el-option
                v-for="streamer in streamers"
                :key="streamer.id"
                :label="streamer.name"
                :value="streamer.name"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="类型">
            <el-select v-model="editScheduleForm.type" style="width: 100%" placeholder="请选择类型">
              <el-option label="手动选择" value="manual" />
              <el-option label="团播" value="group" />
              <el-option label="休息" value="rest" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          
          <!-- 新增：团播和休息类型的显示设置 -->
          <template v-if="['group', 'rest'].includes(editScheduleForm.type)">
            <el-form-item label="显示方式">
              <div class="style-switch-container">
                <el-switch
                  v-model="editScheduleForm.isImage"
                  active-text="图片"
                  inactive-text="文字"
                />
              </div>
            </el-form-item>
            <!-- 新增：休息类型且为文字显示时的简写选项 -->
            <el-form-item v-if="editScheduleForm.type === 'rest' && !editScheduleForm.isImage" label="显示文本">
              <div class="style-switch-container">
                <el-switch
                  v-model="editScheduleForm.useShortText"
                  active-text="休印"
                  inactive-text="休息"
                />
              </div>
            </el-form-item>
            <el-form-item v-if="editScheduleForm.isImage" label="图片链接">
              <div class="flex items-center space-x-2">
                <div class="flex-1">
                  <el-input
                    v-model="editScheduleForm.imageUrl"
                    placeholder="请输入图片链接"
                  >
                    <template #append>
                      <el-button @click="editScheduleForm.imageUrl = ''">清除</el-button>
                    </template>
                  </el-input>
                </div>
                <el-avatar
                  v-if="editScheduleForm.imageUrl"
                  :size="32"
                  :src="editScheduleForm.imageUrl"
                  fit="cover"
                />
              </div>
            </el-form-item>
          </template>

          <el-form-item 
            :label="editScheduleForm.type === 'custom' ? '自定义' : '主播'" 
            v-if="!['group', 'rest'].includes(editScheduleForm.type)"
          >
            <template v-if="editScheduleForm.type === 'manual'">
              <el-select
                v-model="editScheduleForm.streamers"
                multiple
                style="width: 100%"
                placeholder="请选择主播（可多选）"
              >
                <el-option
                  v-for="streamer in streamers"
                  :key="streamer.id"
                  :label="streamer.name"
                  :value="streamer.name"
                >
                  <div class="flex items-center space-x-2">
                    <span>{{ streamer.name }}</span>
                  </div>
                </el-option>
              </el-select>
            </template>
            <template v-else-if="editScheduleForm.type === 'custom'">
              <el-input
                v-model="editScheduleForm.customContent"
                type="textarea"
                :rows="2"
                placeholder="请输入自定义内容"
                resize="none"
                class="custom-textarea"
              />
            </template>
          </el-form-item>
          
          <!-- 新增：主播显示方式 -->
          <el-form-item v-if="editScheduleForm.type === 'manual'" label="显示方式">
            <div class="style-switch-container">
              <el-switch
                v-model="editScheduleForm.showAvatar"
                active-text="头像"
                inactive-text="名称"
              />
            </div>
          </el-form-item>

          <!-- 新增：字体大小设置 -->
          <el-form-item label="字体大小" class="style-form-item">
            <div class="style-switch-container">
              <el-switch
                v-model="editScheduleForm.useCustomFont"
                active-text="自定义"
                inactive-text="默认"
              />
              <div class="style-input-container" :class="{ hidden: !editScheduleForm.useCustomFont }">
                <el-select 
                  v-if="editScheduleForm.useCustomFont"
                  v-model="editScheduleForm.fontSize" 
                  placeholder="选择字体大小"
                >
                  <el-option label="12px" value="12px" />
                  <el-option label="一般(14px)" value="14px" />
                  <el-option label="16px" value="16px" />
                  <el-option label="18px" value="18px" />
                  <el-option label="20px" value="20px" />
                  <el-option label="24px" value="24px" />
                  <el-option label="30px" value="30px" />
                  <el-option label="36px" value="36px" />
                  <el-option label="42px" value="42px" />
                </el-select>
              </div>
            </div>
          </el-form-item>

          <!-- 新增：文字颜色设置 -->
          <el-form-item label="文字颜色" class="style-form-item">
            <div class="style-switch-container">
              <el-radio-group v-model="editScheduleForm.colorMode" class="flex items-center" :disabled="editScheduleForm.type === 'rest' && editScheduleForm.useShortText">
                <el-radio :value="'default'">默认</el-radio>
                <el-radio 
                  :value="'streamer'" 
                  :disabled="!canUseStreamerColor || (editScheduleForm.type === 'rest' && editScheduleForm.useShortText)"
                  v-if="editScheduleForm.type === 'manual'"
                >主播自带</el-radio>
                <el-radio :value="'custom'" :disabled="editScheduleForm.type === 'rest' && editScheduleForm.useShortText">自定义</el-radio>
              </el-radio-group>
              <el-color-picker
                v-if="editScheduleForm.colorMode === 'custom'"
                v-model="editScheduleForm.textColor"
                :show-alpha="false"
                :disabled="editScheduleForm.type === 'rest' && editScheduleForm.useShortText"
              />
            </div>
          </el-form-item>

          <!-- 背景颜色设置 -->
          <el-form-item label="背景颜色" class="style-form-item">
            <div class="style-switch-container">
              <el-radio-group v-model="editScheduleForm.bgColorMode" class="flex items-center">
                <el-radio :value="'default'">默认</el-radio>
                <el-radio 
                  :value="'streamer'" 
                  :disabled="!canUseStreamerColor"
                  v-if="editScheduleForm.type === 'manual'"
                >主播自带</el-radio>
                <el-radio :value="'custom'">自定义</el-radio>
              </el-radio-group>
              <el-color-picker
                v-if="editScheduleForm.bgColorMode === 'custom'"
                v-model="editScheduleForm.backgroundColor"
                :show-alpha="false"
              />
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-center space-x-4">
          <el-button @click="editScheduleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveSchedule">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加保存模板对话框 -->
    <el-dialog
      v-model="saveTemplateDialogVisible"
      title="保存模板"
      width="500px"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <el-form :model="saveTemplateForm" label-width="80px">
        <el-form-item label="模板名称" required>
          <el-input v-model="saveTemplateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="saveTemplateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
            class="template-description"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue'
import html2canvas from 'html2canvas'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Files,
  User,
  DocumentAdd,
  Download,
  Edit,
  Delete,
  Picture,
  Timer,
  Menu,
  Position,
  Minus,
  Upload,
  View
} from '@element-plus/icons-vue'
import HistorySidebar from '../components/HistorySidebar.vue'

// 状态管理
const isHistorySidebarOpen = ref(window.innerWidth > 768) // 手机模式下默认隐藏历史记录
const scheduleTableRef = ref(null)

// 当前排班表数据
const currentSchedule = ref({
  data: {
    title: '一周排班表',
    format: 'current_week',
    dateRange: '',
    source: 'blank' // 添加source属性，可能的值: 'history', 'template', 'blank'
  },
  style: {
    font: 'AlibabaSans-Regular',
    backgroundColor: '#ffffff',
    themeColor: '#000000',
    backgroundImage: null,
    themeStyle: 'top-weekday',
    weekdayLayout: 'single',
    borderWidth: '1',
    titleFontSize: '24px',
    weekdayFontSize: '16px' // 添加星期字体大小默认值
  }
})

// 周排班表数据
const getWeekDays = (startDate) => {
  const days = []
  const date = new Date(startDate)
  // 确保startDate是周一
  const dayOfWeek = date.getDay() || 7 // 将周日(0)转换为7
  date.setDate(date.getDate() - dayOfWeek + 1) // 调整到本周一
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(date)
    currentDate.setDate(date.getDate() + i)
    days.push({
      name: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      date: currentDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '.')
    })
  }
  return days
}

const weekDays = ref([])
const weekScheduleData = ref([
  Array(7).fill(null).map(() => ({})),
  Array(7).fill(null).map(() => ({}))
])

// 月排班表数据
const monthScheduleData = ref([])

// 添加主播数据
const streamers = ref([])

// 拖拽相关状态
const dragOffset = ref({ x: 0, y: 0 })
const dragStart = ref({ x: 0, y: 0 })

const handleDragStart = (event) => {
  dragStart.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  }
}

// 侧边栏切换
const toggleHistorySidebar = () => {
  isHistorySidebarOpen.value = !isHistorySidebarOpen.value
}

// 显示模板管理模态框
const showTemplateModal = () => {
  templateDialogVisible.value = true
}

// 修改保存为模板方法
const saveAsTemplate = () => {
  // 生成默认模板名称：排班表标题 + 时间戳
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/[\/\s:]/g, '')
  
  saveTemplateForm.value = {
    name: `${currentSchedule.value.data.title}_${timestamp}`,
    description: ''
  }
  
  // 如果是本月周格式，保存选中的周
  if (currentSchedule.value.data.format === 'month_week') {
    currentSchedule.value.data.selectedWeek = selectedMonthWeek.value
  }
  
  saveTemplateDialogVisible.value = true
}

// 处理保存模板
const handleSaveTemplate = async () => {
  saveTemplateForm.value.name = saveTemplateForm.value.name.trim()
  saveTemplateForm.value.description = saveTemplateForm.value.description.trim()
  
  if (!saveTemplateForm.value.name) {
    ElMessage.warning('请输入模板名称')
    return
  }

  try {
    // 将合并单元格信息转换为可序列化的格式
    const mergedCellsData = Array.from(mergedCells.value.entries())
    
    // 创建新的模板对象
    const newTemplate = {
      id: Date.now(),
      name: saveTemplateForm.value.name,
      description: saveTemplateForm.value.description,
      createTime: new Date().toISOString(),
      data: {
        schedule: {
          ...JSON.parse(JSON.stringify(currentSchedule.value)),
          data: {
            ...JSON.parse(JSON.stringify(currentSchedule.value.data)),
            source: 'template'
          }
        },
        weekScheduleData: JSON.parse(JSON.stringify(weekScheduleData.value)),
        monthScheduleData: JSON.parse(JSON.stringify(monthScheduleData.value)),
        dragOffset: JSON.parse(JSON.stringify(dragOffset.value)), // 保存拖拽位置
        scale: scale.value, // 保存放缩比例
        mergedCellsData // 保存合并单元格信息
      }
    }

    // 如果是周视图，保存周的开始日期
    if (currentSchedule.value.data.format.includes('week')) {
      const weekDates = weekDays.value.map(day => day.date)
      newTemplate.data.schedule.data.weekStart = weekDates[0]
    }
    
    // 从 localStorage 获取现有模板
    const existingTemplates = JSON.parse(localStorage.getItem('scheduleTemplates') || '[]')
    
    // 添加新模板
    existingTemplates.push(newTemplate)
    
    // 保存回 localStorage
    localStorage.setItem('scheduleTemplates', JSON.stringify(existingTemplates))
    
    // 更新模板列表并按创建时间倒序排序
    templates.value = existingTemplates.sort((a, b) => {
      return new Date(b.createTime) - new Date(a.createTime)
    })
    
    saveTemplateDialogVisible.value = false
    ElMessage({
      type: 'success',
      message: '模板已保存'
    })
  } catch (error) {
    console.error('保存模板时发生错误:', error)
    ElMessage({
      type: 'error',
      message: '保存模板时发生错误'
    })
  }
}

// 修改模板列表的初始化
const templates = ref([])

// 添加加载模板的方法
const loadTemplates = () => {
  try {
    const savedTemplates = JSON.parse(localStorage.getItem('scheduleTemplates') || '[]')
    // 按创建时间倒序排序
    templates.value = savedTemplates.sort((a, b) => {
      return new Date(b.createTime) - new Date(a.createTime)
    })
  } catch (error) {
    console.error('加载模板时发生错误:', error)
    templates.value = []
  }
}

// 修改初始化周排班表数据的方法
const initWeekScheduleData = (startDate = new Date()) => {
  const monday = new Date(startDate)
  monday.setDate(startDate.getDate() - startDate.getDay() + 1)
  
  weekDays.value = getWeekDays(monday)

  // 只有在非编辑模式下才重新初始化周排班表数据
  if (!isEditMode.value) {
    weekScheduleData.value = [
      Array(7).fill(null).map(() => ({})),
      Array(7).fill(null).map(() => ({}))
    ]
  }
  
  const endDate = new Date(monday)
  endDate.setDate(monday.getDate() + 6)
  return `${monday.getFullYear()}.${String(monday.getMonth() + 1).padStart(2, '0')}.${String(monday.getDate()).padStart(2, '0')}–${endDate.getFullYear()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${String(endDate.getDate()).padStart(2, '0')}`
}

// 修改初始化月排班表数据的方法
const initMonthScheduleData = (targetMonth = new Date()) => {

  // 如果是下个月格式，调整目标月份
  if (newScheduleForm.value.format === 'next_month') {
    targetMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1);
  }
  
  const firstDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // 设置日期范围
  const dateRange = `${firstDay.getFullYear()}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${String(firstDay.getDate()).padStart(2, '0')}–${lastDay.getFullYear()}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${String(lastDay.getDate()).padStart(2, '0')}`
  
  // 只有在非编辑模式下 或者 才重新初始化月排班表数据
  if (!isEditMode.value || monthScheduleData.value.length === 0) {
    monthScheduleData.value = Array(daysInMonth).fill(null).map((_, index) => {
      const currentDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), index + 1)
      const dayOfWeek = currentDate.getDay() || 7 // 将周日(0)转换为7
      return {
        date: `${String(index + 1).padStart(2, '0')}日`,
        dayOfWeek: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][dayOfWeek - 1],
        slots: [
          { time: '', streamer: '', showTime: true, type: 'manual', streamers: [] },
          { time: '', streamer: '', showTime: true, type: 'manual', streamers: [] }
        ]
      }
    })
  }

  // 如果需要更新当前排班表的日期范围
  if (currentSchedule.value.data.format.includes('month')) {
    currentSchedule.value.data.dateRange = dateRange
  }
  
  return dateRange
}

// 修改onMounted钩子
onMounted(async () => {
  // 初始化主播数据
  await loadStreamers()
  
  // 加载模板数据
  loadTemplates()
  
  const today = new Date()
  const dateRange = initWeekScheduleData(today)
  currentSchedule.value.data.dateRange = dateRange
  
  // 更新主题色RGB值
  updateThemeColorRGB()
  
  // 初始化缩放
  updateScheduleScale()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      isHistorySidebarOpen.value = true
    }
  })
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // 添加鼠标事件监听，防止拖动时选中文字
  document.addEventListener('selectstart', (e) => {
    if (isCtrlPressed.value) {
      e.preventDefault()
    }
  })
  
  // 添加页面点击事件监听
  document.addEventListener('mousedown', handlePageClick)
  
  // 监听窗口大小变化，在移动端自动隐藏历史记录侧边栏
  window.addEventListener('resize', handleWindowResize)
})

// 窗口大小变化处理函数
const handleWindowResize = () => {
  if (window.innerWidth <= 768 && isHistorySidebarOpen.value) {
    isHistorySidebarOpen.value = false
  }
}

onUnmounted(() => {
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleWindowResize)
  
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousedown', handlePageClick)
})

// 处理键盘按下事件
const handleKeyDown = (e) => {
  if (e.key === 'Control') {
    isCtrlPressed.value = true
  }
}

// 处理键盘释放事件
const handleKeyUp = (e) => {
  if (e.key === 'Control') {
    isCtrlPressed.value = false
  }
}

// 处理格子鼠标按下事件
const handleCellMouseDown = (rowIndex, cellIndex, e) => {
  if (!isCtrlPressed.value || e.button !== 0) return
  
  e.preventDefault()
  isDragging.value = true
  dragStartCell.value = { rowIndex, cellIndex }
  
  // 如果没有按住 Shift 键，清除之前的选择
  if (!e.shiftKey) {
    selectedCells.value.clear()
  }
  
  toggleCellSelection(rowIndex, cellIndex)
}

// 处理格子鼠标移动事件
const handleCellMouseMove = (rowIndex, cellIndex) => {
  if (!isDragging.value || !isCtrlPressed.value) return
  
  // 更新选择范围
  const startRow = Math.min(dragStartCell.value.rowIndex, rowIndex)
  const endRow = Math.max(dragStartCell.value.rowIndex, rowIndex)
  const startCell = Math.min(dragStartCell.value.cellIndex, cellIndex)
  const endCell = Math.max(dragStartCell.value.cellIndex, cellIndex)
  
  // 清除之前的选择
  selectedCells.value.clear()
  
  // 选择范围内的所有格子
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCell; j <= endCell; j++) {
      selectedCells.value.add(`${i},${j}`)
    }
  }
}

// 处理鼠标释放事件
const handleMouseUp = () => {
  isDragging.value = false
}

// 切换格子选择状态
const toggleCellSelection = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  if (selectedCells.value.has(key)) {
    selectedCells.value.delete(key)
  } else {
    selectedCells.value.add(key)
  }
}

// 判断格子是否被选中
const isCellSelected = (rowIndex, cellIndex) => {
  return selectedCells.value.has(`${rowIndex},${cellIndex}`)
}

// 处理格子右键菜单
const handleCellContextMenu = (rowIndex, cellIndex, e) => {
  e.preventDefault()
  
  // 先移除可能存在的旧菜单
  const oldMenu = document.querySelector('.context-menu')
  if (oldMenu) {
    document.body.removeChild(oldMenu)
  }
  const oldStyle = document.querySelector('#context-menu-style')
  if (oldStyle) {
    document.head.removeChild(oldStyle)
  }
  
  // 如果右键点击的格子不在选中范围内，清除选择并选中当前格子
  if (!isCellSelected(rowIndex, cellIndex)) {
    selectedCells.value.clear()
    selectedCells.value.add(`${rowIndex},${cellIndex}`)
  }
  
  // 创建右键菜单
  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.style.position = 'fixed'
  menu.style.left = `${e.clientX}px`
  menu.style.top = `${e.clientY}px`
  menu.style.backgroundColor = 'white'
  menu.style.boxShadow = '0 2px 12px 0 rgba(0,0,0,0.1)'
  menu.style.padding = '5px 0'
  menu.style.borderRadius = '4px'
  menu.style.zIndex = '1000'
  
  // 判断是否可以合并
  const canMerge = selectedCells.value.size > 1
  // 判断当前格子是否是合并格子或被合并的格子
  const isMerged = mergedCells.value.has(`${rowIndex},${cellIndex}`)
  const isMergedCell = Array.from(mergedCells.value.values()).some(cells => 
    cells.includes(`${rowIndex},${cellIndex}`)
  )
  
  // 创建菜单项
  const mergeItem = document.createElement('div')
  mergeItem.className = 'context-menu-item'
  mergeItem.textContent = '合并格子'
  mergeItem.style.padding = '8px 16px'
  mergeItem.style.cursor = canMerge ? 'pointer' : 'not-allowed'
  mergeItem.style.opacity = canMerge ? '1' : '0.5'
  mergeItem.style.whiteSpace = 'nowrap'
  
  const restoreItem = document.createElement('div')
  restoreItem.className = 'context-menu-item'
  restoreItem.textContent = '恢复格子'
  restoreItem.style.padding = '8px 16px'
  restoreItem.style.cursor = (isMerged || isMergedCell) ? 'pointer' : 'not-allowed'
  restoreItem.style.opacity = (isMerged || isMergedCell) ? '1' : '0.5'
  restoreItem.style.whiteSpace = 'nowrap'
  
  // 添加hover效果
  const hoverStyle = `
    .context-menu-item:hover {
      background-color: #f5f7fa;
    }
  `
  const style = document.createElement('style')
  style.id = 'context-menu-style'
  style.textContent = hoverStyle
  document.head.appendChild(style)
  
  // 添加点击事件
  mergeItem.onclick = () => {
    if (canMerge) {
      mergeCells(rowIndex, cellIndex)
    }
    removeContextMenu()
  }
  
  restoreItem.onclick = () => {
    if (isMerged || isMergedCell) {
      restoreCells(rowIndex, cellIndex)
    }
    removeContextMenu()
  }
  
  menu.appendChild(mergeItem)
  menu.appendChild(restoreItem)
  document.body.appendChild(menu)
  
  // 点击其他地方关闭菜单
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      removeContextMenu()
      document.removeEventListener('click', closeMenu)
    }
  }
  document.addEventListener('click', closeMenu)
}

// 移除右键菜单的辅助函数
const removeContextMenu = () => {
  const menu = document.querySelector('.context-menu')
  if (menu && menu.parentNode) {
    menu.parentNode.removeChild(menu)
  }
  
  const style = document.querySelector('#context-menu-style')
  if (style && style.parentNode) {
    style.parentNode.removeChild(style)
  }
}

// 合并格子
const mergeCells = (mainRowIndex, mainCellIndex) => {
  // 获取所有选中的格子
  const selectedCellsArray = Array.from(selectedCells.value)
  if (selectedCellsArray.length <= 1) return

  // 找出选中区域的边界
  const positions = selectedCellsArray.map(key => {
    const [row, col] = key.split(',').map(Number)
    return { row, col }
  })
  
  // 检查是否形成了一个矩形区域
  const minRow = Math.min(...positions.map(p => p.row))
  const maxRow = Math.max(...positions.map(p => p.row))
  const minCol = Math.min(...positions.map(p => p.col))
  const maxCol = Math.max(...positions.map(p => p.col))
  
  // 检查是否所有选中的格子都在矩形区域内
  const isValidRectangle = positions.length === (maxRow - minRow + 1) * (maxCol - minCol + 1)
  if (!isValidRectangle) {
    ElMessage.error('只能合并连续的矩形区域')
    return
  }
  
  // 检查选中区域内是否有已经被合并的格子
  const hasAlreadyMergedCell = positions.some(pos => {
    const key = `${pos.row},${pos.col}`
    return Array.from(mergedCells.value.entries()).some(([mainKey, mergedKeys]) => {
      return mainKey === key || mergedKeys.includes(key)
    })
  })
  
  if (hasAlreadyMergedCell) {
    ElMessage.error('选中区域包含已合并的格子')
    return
  }
  
  // 使用左上角的格子作为主格子
  const mainKey = `${minRow},${minCol}`
  const mergedCellsArray = selectedCellsArray.filter(key => key !== mainKey)

  // 获取合并后的格子属性
  const allCellsData = selectedCellsArray.map(key => {
    const [row, col] = key.split(',').map(Number)
    let cellData;
    
    if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
      // 获取月排班表的数据
      const weekData = getMonthCalendarData()[row];
      if (weekData && weekData[col]) {
        const date = weekData[col].date;
        cellData = monthScheduleData.value[date.getDate() - 1]?.slots[0] || {};
      }
    } else {
      // 获取周排班表的数据
      cellData = weekScheduleData.value[row][col] || {};
    }
    
    return {
      key,
      data: cellData
    }
  })

  // 应用属性继承规则
  const mainCellData = allCellsData.find(item => item.key === mainKey)?.data || {}
  const newCellData = {
    ...mainCellData,
    style: {
      ...mainCellData.style,
      // 保持主格子的样式
      fontSize: mainCellData.style?.fontSize,
      colorMode: mainCellData.style?.colorMode,
      textColor: mainCellData.style?.textColor,
      bgColorMode: mainCellData.style?.bgColorMode,
      backgroundColor: mainCellData.style?.backgroundColor
    }
  }

  // 更新主格子数据
  const [mainRow, mainCol] = mainKey.split(',').map(Number)
  if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
    const weekData = getMonthCalendarData()[mainRow];
    if (weekData && weekData[mainCol]) {
      const date = weekData[mainCol].date;
      if (monthScheduleData.value[date.getDate() - 1]) {
        monthScheduleData.value[date.getDate() - 1].slots[0] = newCellData;
      }
    }
  } else {
    weekScheduleData.value[mainRow][mainCol] = newCellData;
  }

  // 清除其他格子的数据，但保留必要的样式信息
  mergedCellsArray.forEach(key => {
    const [row, col] = key.split(',').map(Number)
    if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
      const weekData = getMonthCalendarData()[row];
      if (weekData && weekData[col]) {
        const date = weekData[col].date;
        if (monthScheduleData.value[date.getDate() - 1]) {
          monthScheduleData.value[date.getDate() - 1].slots[0] = {
            style: {
              borderColor: currentSchedule.value.data.themeColor
            }
          };
        }
      }
    } else {
      weekScheduleData.value[row][col] = {
        style: {
          borderColor: currentSchedule.value.data.themeColor
        }
      };
    }
  })

  // 设置合并信息
  mergedCells.value.set(mainKey, mergedCellsArray)
  selectedCells.value.clear()
  
  ElMessage.success('格子合并成功')
}

// 恢复格子
const restoreCells = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  // 如果是主格子或被合并的格子
  let mainKey = key
  let mergedGroup = []
  
  if (mergedCells.value.has(key)) {
    // 如果是主格子
    mergedGroup = mergedCells.value.get(key)
  } else {
    // 如果是被合并的格子，找到对应的主格子
    for (const [mKey, cells] of mergedCells.value.entries()) {
      if (cells.includes(key)) {
        mainKey = mKey
        mergedGroup = cells
        break
      }
    }
  }

  // 删除合并信息
  mergedCells.value.delete(mainKey)
}

// 导出图片
const exportAsImage = async () => {
  if (!scheduleTableRef.value) {
    ElMessage.warning('未找到排班表元素')
    return
  }
  
  try {
    ElMessage({
      type: 'info',
      message: '正在生成图片，请稍候...',
      duration: 0
    })

    await nextTick()
    
    const element = scheduleTableRef.value.$el
    const originalStyles = window.getComputedStyle(element)
    const elementWidth = element.offsetWidth
    const elementHeight = element.offsetHeight
    
    // 记录当前窗口宽度
    const currentWindowWidth = window.innerWidth
    const isMobileView = currentWindowWidth <= 768
    
    // 创建一个外层容器，用于保持间距
    const outerContainer = document.createElement('div')
    outerContainer.style.position = 'absolute'
    outerContainer.style.left = '-9999px'
    outerContainer.style.top = '-9999px'
    outerContainer.style.width = isMobileView ? '1024px' : elementWidth + 'px' // 如果是手机模式，使用电脑模式宽度
    outerContainer.style.height = isMobileView ? 'auto' : elementHeight + 'px'
    outerContainer.style.padding = '0'
    outerContainer.style.margin = '0'
    outerContainer.style.overflow = 'hidden'
    document.body.appendChild(outerContainer)
    
    const clone = element.cloneNode(true)
    
    // 复制所有关键样式
    clone.style.padding = originalStyles.padding
    clone.style.margin = '0'
    clone.style.width = isMobileView ? '1024px' : elementWidth + 'px' // 如果是手机模式，使用电脑模式宽度
    clone.style.height = isMobileView ? 'auto' : elementHeight + 'px'
    clone.style.position = 'relative'
    clone.style.display = 'flex'
    clone.style.backgroundColor = originalStyles.backgroundColor
    clone.style.boxSizing = 'border-box'
    
    // 如果是手机模式，应用电脑模式的样式
    if (isMobileView) {
      // 移除手机模式下的特殊样式
      const mobileSpecificElements = clone.querySelectorAll('[class*="mobile"], [style*="mobile"]')
      mobileSpecificElements.forEach(el => {
        el.classList.remove(...Array.from(el.classList).filter(cls => cls.includes('mobile')))
        if (el.style.cssText.includes('mobile')) {
          // 移除手机特定样式
          el.style.cssText = el.style.cssText.replace(/mobile[^;]+;/g, '')
        }
      })
      
      // 应用桌面样式
      clone.classList.add('desktop-view')
      
      // 调整布局，确保内容正确显示
      const layoutElements = clone.querySelectorAll('.flex-col, .flex-row')
      layoutElements.forEach(el => {
        if (el.classList.contains('flex-col') && !el.classList.contains('desktop-flex-col')) {
          el.classList.remove('flex-col')
          el.classList.add('flex-row')
        }
      })
    }
    
    const originalContent = element.querySelector('.schedule-content')
    const computedStyle = window.getComputedStyle(originalContent)
    
    const scheduleContent = clone.querySelector('.schedule-content')
    if (scheduleContent) {
      scheduleContent.style.transform = isMobileView ? 'none' : computedStyle.transform
      scheduleContent.style.transformOrigin = computedStyle.transformOrigin
      scheduleContent.style.width = '100%'
      scheduleContent.style.height = '100%'
      scheduleContent.style.margin = '0'
      scheduleContent.style.padding = computedStyle.padding
      scheduleContent.style.boxSizing = 'border-box'
    }
    
    // 处理表格边框
    
    const scheduleTable = clone.querySelector('.schedule-grid')
    if (scheduleTable) {
      const borderWidth = parseInt(currentSchedule.value.style.borderWidth)
      const borderColor = currentSchedule.value.style.themeColor
      
      // 设置表格的基本样式
      scheduleTable.style.borderCollapse = 'collapse'
      scheduleTable.style.borderSpacing = '0'
      scheduleTable.style.border = 'none'
      scheduleTable.style.position = 'relative'
      scheduleTable.style.width = '100%'
      scheduleTable.style.maxWidth = '100%'
      scheduleTable.style.tableLayout = 'fixed'
      
      // 如果是手机模式，调整表格布局为桌面模式
      if (isMobileView) {
        // 确保表格在导出时使用桌面模式的布局
        scheduleTable.style.display = 'table'
        scheduleTable.style.tableLayout = 'fixed'
        scheduleTable.style.width = '100%'
        
        // 调整表头和单元格样式
        const headerRow = scheduleTable.querySelector('tr:first-child')
        if (headerRow) {
          Array.from(headerRow.children).forEach(cell => {
            cell.style.fontWeight = 'bold'
            cell.style.textAlign = 'center'
          })
        }
      }
      
      // 处理所有单元格
      const cells = scheduleTable.querySelectorAll('td, th')

      cells.forEach(cell => {
        const originalCell = element.querySelector(`[data-cell-id="${cell.getAttribute('data-cell-id')}"]`)

        if (originalCell) {
          const originalStyle = window.getComputedStyle(originalCell)
          
          // 重置单元格样式
          cell.style.border = 'none'
          cell.style.position = 'relative'
          cell.style.boxSizing = 'border-box'
          
          // 如果不是被合并的单元格，添加边框
          if (originalStyle.borderColor !== 'transparent') {
            // 添加右边框和下边框
            cell.style.borderRight = `${borderWidth}px solid ${borderColor}`
            cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`
            
            // 为第一行添加上边框
            if (cell.parentElement.rowIndex === 0) {
              cell.style.borderTop = `${borderWidth}px solid ${borderColor}`
            }
            
            // 为第一列添加左边框
            if (cell.cellIndex === 0) {
              cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`
            }
          }
          
          // 保持背景色
          cell.style.backgroundColor = originalStyle.backgroundColor
          
          // 保持内边距
          cell.style.padding = originalStyle.padding
          
          // 处理休息文本的样式
          const restText = cell.querySelector('.rest-text')
          if (restText) {
            const themeColorRGB = getThemeColorRGB(currentSchedule.value.style.themeColor)
            restText.style.backgroundColor = `rgba(${themeColorRGB}, 0.5)`
            restText.style.border = `4px solid rgba(${themeColorRGB}, 0.2)`
            restText.style.boxShadow = `0 0 0 2px rgba(${themeColorRGB}, 0.5)`
            restText.style.color = '#fff'
            restText.style.display = 'inline-flex'
            restText.style.alignItems = 'center'
            restText.style.justifyContent = 'center'
            // 使用与页面显示相同的宽度计算方式
            const cellWidth = cell.offsetWidth;
            const cellHeight = cell.offsetHeight;
            restText.style.width = cellWidth <= cellHeight ? (cellWidth - 30) + 'px' : (cellHeight - 30) + 'px';
            restText.style.aspectRatio = '1/1'
            restText.style.borderRadius = '50%'
            restText.style.fontWeight = 'bold'
            restText.style.transform = 'rotate(30deg)'
            restText.style.position = 'relative'
            restText.style.boxSizing = 'border-box'
            
            // 添加外层圆环
            const before = document.createElement('div')
            before.style.content = '""'
            before.style.position = 'absolute'
            before.style.top = '-2px'
            before.style.left = '-2px'
            before.style.right = '-2px'
            before.style.bottom = '-2px'
            before.style.borderRadius = '50%'
            before.style.border = '5px solid #fff'
            before.style.pointerEvents = 'none'
            restText.insertBefore(before, restText.firstChild)
          }
        }
      })
    }
    
    outerContainer.appendChild(clone)
    
    const options = {
      scale: 8,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: isMobileView ? 1024 : elementWidth, // 如果是手机模式，使用固定桌面宽度
      height: isMobileView ? null : elementHeight, // 移动设备上高度自适应
      imageTimeout: 0,
      removeContainer: true,
      foreignObjectRendering: false
    }

    const canvas = await html2canvas(clone, options)
    document.body.removeChild(outerContainer)
    ElMessage.closeAll()
    
    // 如果在移动设备上，可能需要进一步处理画布尺寸
    let finalCanvas = canvas
    if (isMobileView) {
      // 创建一个新的画布，保持原始比例但使用桌面模式尺寸
      const desktopCanvas = document.createElement('canvas')
      const ctx = desktopCanvas.getContext('2d')
      
      // 设置画布宽度为桌面模式宽度
      desktopCanvas.width = 1024
      desktopCanvas.height = (canvas.height / canvas.width) * 1024
      
      // 绘制到新画布
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, desktopCanvas.width, desktopCanvas.height)
      finalCanvas = desktopCanvas
    }
    
    const image = finalCanvas.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    const fileName = `${currentSchedule.value.data.title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.png`
    
    link.href = image
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage({
      type: 'success',
      message: '排班表已成功导出为图片'
    })
  } catch (error) {
    console.error('导出图片错误:', error)
    ElMessage.closeAll()
    ElMessage({
      type: 'error',
      message: '导出排班表时发生错误：' + (error.message || '未知错误')
    })
  }
}

// 新建排班表相关状态
const newScheduleDialogVisible = ref(false)
const newScheduleForm = ref({
  template: '',
  format: 'current_week',
  title: '一周排班表',
  logoPosition: 'none', // 添加: 主播logo显示位置，可选值：none、left、center、right
  logoStreamers: [], // 添加: 要显示logo的成员列表
  style: {
    font: 'AlibabaSans-Regular',
    themeColor: '#409EFF',
    themeStyle: 'top-weekday', // 默认设置，不再需要用户选择
    weekdayLayout: 'single',
    backgroundImage: null,
    borderWidth: '1',
    titleFontSize: '24px',
    weekdayFontSize: '16px' // 添加星期字体大小设置
  }
})

// 添加本月周选项的状态
const selectedMonthWeek = ref(1)
const currentMonthWeeks = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const weeks = []
  let currentDate = new Date(firstDay)
  
  while (currentDate <= lastDay) {
    const weekStart = new Date(currentDate)
    const weekEnd = new Date(currentDate)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    weeks.push({
      value: weeks.length + 1,
      label: `第${weeks.length + 1}周 (${weekStart.getDate()}日-${
        weekEnd > lastDay ? lastDay.getDate() : weekEnd.getDate()
      }日)`
    })
    
    currentDate.setDate(currentDate.getDate() + 7)
    if (currentDate > lastDay) break
  }
  
  return weeks
})

// 添加预览周视图日期的计算属性
const previewWeekDays = computed(() => {
  if (!currentViewTemplate.value?.data?.schedule?.data?.format?.includes('week')) {
    return weekDays.value;
  }

  const weekStart = currentViewTemplate.value.data.schedule.data.weekStart;
  if (!weekStart) {
    // 如果没有保存的weekStart，使用本周一
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay() || 7;
    monday.setDate(today.getDate() - dayOfWeek + 1);
    return getWeekDays(monday);
  }

  // 使用保存的weekStart
  const [startMonth, startDay] = weekStart.split('.').map(Number);
  const now = new Date();
  const startDate = new Date(now.getFullYear(), startMonth - 1, startDay);
  return getWeekDays(startDate);
});

// 添加监听器，当格式改变时更新标题
watch(
  () => newScheduleForm.value.format,
  (newFormat) => {
    if (!newScheduleForm.value.template) {
      nextTick(() => {
        if (newFormat === 'current_month' || newFormat === 'next_month') {
          newScheduleForm.value.title = '本月排班表'
        } else {
          newScheduleForm.value.title = '一周排班表'
        }
      })
    }
  },
  { immediate: true, deep: true }
)

// 添加监听器，当选择模板时更新星期排序
watch(
  () => newScheduleForm.value.template,
  (templateId) => {
    if (templateId) {
      const selectedTemplate = templates.value.find(t => t.id === templateId)
      if (selectedTemplate && selectedTemplate.data && selectedTemplate.data.schedule) {
        // 自动填充星期排序与模板一致
        newScheduleForm.value.style.weekdayLayout = selectedTemplate.data.schedule.style.weekdayLayout;
      }
    }
  }
)

// 添加监听器，当星期排序布局改变时重置所有状态
watch(() => currentSchedule.value.style.weekdayLayout, async (newLayout) => {
  try {
    // 如果存在合并的格子，显示确认对话框
    if (mergedCells.value.size > 0 && 
      currentSchedule.value.data.source !== 'history' && 
      currentSchedule.value.data.source !== 'template'
    ) {
      const result = await ElMessageBox.confirm(
        '是否取消所有已合并的格子？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      if (result !== 'confirm') {
        // 如果用户取消，恢复之前的布局
        currentSchedule.value.style.weekdayLayout = newLayout === 'single' ? 'double' : 'single'
        return
      }
    }

    // 清除所有状态
    if (currentSchedule.value.data.source !== 'history' && 
        currentSchedule.value.data.source !== 'template') {
      mergedCells.value.clear()
    }
    selectedCells.value.clear()
    
    // 重新初始化数据，保留原有内容
    const tempData = JSON.parse(JSON.stringify(weekScheduleData.value))
    weekScheduleData.value = [
      Array(7).fill(null).map((_, index) => ({
        ...tempData[0][index]
      })),
      Array(7).fill(null).map((_, index) => ({
        ...tempData[1][index]
      }))
    ]

    // 等待渲染完成
    await nextTick()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换布局时发生错误:', error)
      ElMessage.error('切换布局失败')
    }
  }
})

// 创建新排班表
const handleCreateSchedule = async () => {
  if (!newScheduleForm.value.title) {
    ElMessage.warning('请输入排班表标题')
    return
  }

  try {
    // 检查是否切换了星期排序布局
    const isLayoutChanged = isEditMode.value && 
      currentSchedule.value.style.weekdayLayout !== newScheduleForm.value.style.weekdayLayout;

    // 如果切换了布局且存在合并格子，显示确认对话框
    if (isLayoutChanged && mergedCells.value.size > 0) {
      const result = await ElMessageBox.confirm(
        '切换星期排序布局将取消所有已合并的格子，是否继续？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
      
      if (result !== 'confirm') {
        // 如果用户取消，恢复之前的布局
        newScheduleForm.value.style.weekdayLayout = currentSchedule.value.style.weekdayLayout;
        return;
      }

      // 清除所有合并状态
      mergedCells.value.clear();
      selectedCells.value.clear();
      
      // 重新初始化数据，保留原有内容
      const tempData = JSON.parse(JSON.stringify(weekScheduleData.value));
      weekScheduleData.value = [
        Array(7).fill(null).map((_, index) => ({
          ...tempData[0][index],
          style: {} // 清除可能存在的合并样式
        })),
        Array(7).fill(null).map((_, index) => ({
          ...tempData[1][index],
          style: {} // 清除可能存在的合并样式
        }))
      ];
    }
    // 如果没有切换布局，但有其他数据变更，显示普通确认对话框
    else if (!isLayoutChanged && (
      currentSchedule.value.data.title !== '一周排班表' || 
      weekScheduleData.value.some(row => 
        row && row.some(cell => cell && Object.keys(cell).length > 0)
      ) ||
      monthScheduleData.value.some(day => 
        day && day.slots && day.slots.some(slot => slot && slot.streamer)
      )
    )) {
      const result = await ElMessageBox.confirm(
        '确认更新排班表？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
      
      if (result !== 'confirm') {
        return;
      }
    }

    const today = new Date();
    let dateRange = '';
    
    switch (newScheduleForm.value.format) {
      case 'current_week': {
        const today = new Date()
        const monday = new Date(today)
        // 获取本周一的日期
        const dayOfWeek = today.getDay() || 7
        monday.setDate(today.getDate() - dayOfWeek + 1)
        const endDate = new Date(monday)
        endDate.setDate(monday.getDate() + 6)
        dateRange = `${monday.getFullYear()}.${String(monday.getMonth() + 1).padStart(2, '0')}.${String(monday.getDate()).padStart(2, '0')}–${endDate.getFullYear()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${String(endDate.getDate()).padStart(2, '0')}`
        // 初始化周视图数据
        weekDays.value = getWeekDays(monday)
        // 只有在非编辑模式下才重新初始化周排班表数据
        if (!isEditMode.value) {
          weekScheduleData.value = [
            Array(7).fill(null).map(() => ({})),
            Array(7).fill(null).map(() => ({}))
          ]
        }
        break
      }
      case 'month_week': {
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const weekStart = new Date(currentMonth)
        weekStart.setDate(1 + (selectedMonthWeek.value - 1) * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        dateRange = `${weekStart.getFullYear()}.${String(weekStart.getMonth() + 1).padStart(2, '0')}.${String(weekStart.getDate()).padStart(2, '0')}–${weekEnd.getFullYear()}.${String(weekEnd.getMonth() + 1).padStart(2, '0')}.${String(weekEnd > monthEnd ? monthEnd.getDate() : weekEnd.getDate()).padStart(2, '0')}`
        // 初始化周视图数据
        weekDays.value = getWeekDays(weekStart)
        // 只有在非编辑模式下才重新初始化周排班表数据
        if (!isEditMode.value) {
          weekScheduleData.value = [
            Array(7).fill(null).map(() => ({})),
            Array(7).fill(null).map(() => ({}))
          ]
        }
        break
      }
      case 'current_month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        dateRange = `${firstDay.getFullYear()}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${String(firstDay.getDate()).padStart(2, '0')}–${lastDay.getFullYear()}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${String(lastDay.getDate()).padStart(2, '0')}`
        
        // 初始化本月数据
        initMonthScheduleData(today)
        break
      }
      case 'next_month': {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        dateRange = `${nextMonth.getFullYear()}.${String(nextMonth.getMonth() + 1).padStart(2, '0')}.${String(nextMonth.getDate()).padStart(2, '0')}–${lastDay.getFullYear()}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${String(lastDay.getDate()).padStart(2, '0')}`

        // 初始化下个月数据
        initMonthScheduleData(nextMonth)
        break
      }
    }

    // 如果选择了模板，应用模板数据
    if (newScheduleForm.value.template) {
      const selectedTemplate = templates.value.find(t => t.id === newScheduleForm.value.template)
      if (selectedTemplate) {
        // 应用模板数据，但保留新的标题和日期范围
        const templateSchedule = JSON.parse(JSON.stringify(selectedTemplate.data.schedule))
        currentSchedule.value = {
          ...templateSchedule,
          data: {
            ...templateSchedule.data,
            title: newScheduleForm.value.title,
            dateRange: isEditMode.value ? currentSchedule.value.data.dateRange : dateRange,
            logoPosition: newScheduleForm.value.logoPosition, // 添加主播logo显示位置
            logoStreamers: newScheduleForm.value.logoStreamers, // 添加主播logo成员列表
            source: 'template' // 添加source属性
          }
        }
        
        // 自动填充星期排序与模板一致
        newScheduleForm.value.style.weekdayLayout = templateSchedule.style.weekdayLayout;
        
        // 应用模板的排班数据
        if (selectedTemplate.data.weekScheduleData) {
          weekScheduleData.value = JSON.parse(JSON.stringify(selectedTemplate.data.weekScheduleData))
        }
        if (selectedTemplate.data.monthScheduleData) {
          monthScheduleData.value = JSON.parse(JSON.stringify(selectedTemplate.data.monthScheduleData))
        }
        
        // 应用模板的合并单元格数据
        mergedCells.value.clear()
        if (selectedTemplate.data.mergedCellsData) {
          // 将序列化的合并单元格数据转换回 Map
          selectedTemplate.data.mergedCellsData.forEach(([key, values]) => {
            mergedCells.value.set(key, values)
          })
        }
      }
    } else {
      // 使用空白模板
      // 清除所有合并状态
      selectedCells.value.clear()
      
      currentSchedule.value.data = {
        title: newScheduleForm.value.title,
        format: newScheduleForm.value.format,
        template: newScheduleForm.value.template,
        dateRange: dateRange,
        logoPosition: newScheduleForm.value.logoPosition, // 添加主播logo显示位置
        logoStreamers: newScheduleForm.value.logoStreamers, // 添加主播logo成员列表
        source: 'blank' // 添加source属性
      }
      currentSchedule.value.style = { ...newScheduleForm.value.style }

      // 如果是新建（非编辑模式），清空排班数据并清除合并样式
      if (!isEditMode.value) {
        mergedCells.value.clear()
        
        weekScheduleData.value = [
          Array(7).fill(null).map(() => ({ style: {} })), // 确保每个格子都有空的style对象
          Array(7).fill(null).map(() => ({ style: {} }))
        ]
        if (newScheduleForm.value.format === 'current_month' || newScheduleForm.value.format === 'next_month') {
          initMonthScheduleData()
          // 确保月视图的每个格子都有空的style对象
          monthScheduleData.value = monthScheduleData.value.map(day => ({
            ...day,
            slots: day.slots.map(slot => ({
              ...slot,
              style: {}
            }))
          }))
        }
      }
      
      // 更新主题色RGB值
      updateThemeColorRGB()
    }
    
    ElMessage({
      type: 'success',
      message: isEditMode.value ? '排班表已更新' : '排班表已创建'
    })
    
    newScheduleDialogVisible.value = false
    isEditMode.value = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        type: 'error',
        message: isEditMode.value ? '更新排班表时发生错误' : '创建排班表时发生错误'
      })
    }
  }
}

// 编辑排班相关状态
const editScheduleDialogVisible = ref(false)
const editScheduleForm = ref({
  time: '',
  type: 'manual',
  streamer: '',
  streamers: [],
  customContent: '',
  currentRow: -1,
  currentCell: -1,
  isImage: false,
  imageUrl: '',
  showTime: true,
  useCustomFont: false,
  fontSize: '14px',
  colorMode: 'default',
  textColor: '#000000',
  bgColorMode: 'default',
  backgroundColor: '#ffffff',
  logoType: 'none', // 新增：logo类型，可选值：none（关闭）、custom（选择主播）
  logoStreamer: '', // 新增：当logoType为custom时，选择的主播
  showAvatar: true, // 新增：显示头像
  useShortText: false, // 新增：休息类型是否使用简写文本
})

// 添加计算属性
const canUseStreamerColor = computed(() => {
  return editScheduleForm.value.type === 'manual' && editScheduleForm.value.streamers.length === 1
})

// 添加监听器
watch(() => editScheduleForm.value.backgroundColor, (newColor) => {
  // 当背景颜色为自定义，且文字颜色也为自定义，并且两个颜色相同时，文字颜色自动变为白色
  if (editScheduleForm.value.colorMode === 'custom' && 
      editScheduleForm.value.bgColorMode === 'custom' && 
      newColor === editScheduleForm.value.textColor) {
    editScheduleForm.value.textColor = '#ffffff'
  }
})

watch(() => editScheduleForm.value.textColor, (newColor) => {
  // 当文字颜色为自定义，且背景颜色也为自定义，并且两个颜色相同时，文字颜色自动变为白色
  if (editScheduleForm.value.colorMode === 'custom' && 
      editScheduleForm.value.bgColorMode === 'custom' && 
      newColor === editScheduleForm.value.backgroundColor) {
    editScheduleForm.value.textColor = '#ffffff'
  }
})

// 添加新的监听器，监听 canUseStreamerColor 的变化
watch(() => canUseStreamerColor.value, (canUse) => {
  if (!canUse) {
    // 如果不能使用主播颜色，且当前选择的是主播颜色，则切换到默认
    if (editScheduleForm.value.colorMode === 'streamer') {
      editScheduleForm.value.colorMode = 'default'
    }
    if (editScheduleForm.value.bgColorMode === 'streamer') {
      editScheduleForm.value.bgColorMode = 'default'
    }
  }
})

// 监听类型和主播选择的变化
watch(
  [
    () => editScheduleForm.value.type,
    () => editScheduleForm.value.streamers
  ],
  () => {
    if (!canUseStreamerColor.value) {
      // 如果不能使用主播颜色，且当前选择的是主播颜色，则切换到默认
      if (editScheduleForm.value.colorMode === 'streamer') {
        editScheduleForm.value.colorMode = 'default'
      }
      if (editScheduleForm.value.bgColorMode === 'streamer') {
        editScheduleForm.value.bgColorMode = 'default'
      }
    }
  }
)

// 修改编辑单元格函数
const editCell = (dayIndex, rowIndex) => {
  // 确保数据结构存在
  if (!weekScheduleData.value[rowIndex]) {
    weekScheduleData.value[rowIndex] = Array(7).fill(null).map(() => ({}))
  }
  
  const currentData = weekScheduleData.value[rowIndex][dayIndex] || {}
  const currentStyle = currentData?.style || {}
  
  editScheduleForm.value = {
    time: currentData?.type === 'rest' ? '' : (currentData?.time || ''),
    type: currentData?.type || 'manual',
    streamer: currentData?.streamer || '',
    streamers: currentData?.streamers || [],
    customContent: currentData?.customContent || '',
    currentRow: rowIndex,
    currentCell: dayIndex,
    isImage: currentData?.isImage || false,
    imageUrl: currentData?.imageUrl || '',
    showTime: currentData?.showTime ?? true,
    useCustomFont: !!currentStyle.fontSize,
    fontSize: currentStyle.fontSize || '14px',
    colorMode: currentStyle.colorMode || 'default',
    textColor: currentStyle.textColor || '#000000',
    bgColorMode: currentStyle.bgColorMode || 'default',
    backgroundColor: currentStyle.backgroundColor || '#ffffff',
    // 新增：加载logo配置
    logoType: currentData?.logoType || 'none',
    logoStreamer: currentData?.logoStreamer || '',
    showAvatar: currentData?.showAvatar ?? false,
    useShortText: currentData?.useShortText ?? false, // 当为true时显示为"休"，为false显示为"休息"
  }
  editScheduleDialogVisible.value = true
}

// 修改保存函数
const handleSaveSchedule = () => {
  const { currentRow, currentCell } = editScheduleForm.value;
  
  try {
    if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
      // 获取实际的日期索引
      const weekData = getMonthCalendarData()[currentRow];
      if (!weekData || !weekData[currentCell]) {
        throw new Error('无效的日期');
      }
      
      const date = weekData[currentCell].date;
      const dayIndex = date.getDate() - 1;
      
      // 确保数据结构存在
      if (!monthScheduleData.value[dayIndex]) {
        monthScheduleData.value[dayIndex] = {
          slots: [{}, {}]
        };
      }
      
      // 保存编辑数据
      monthScheduleData.value[dayIndex].slots[0] = {
        time: editScheduleForm.value.time,
        type: editScheduleForm.value.type,
        streamer: editScheduleForm.value.streamer,
        streamers: editScheduleForm.value.streamers,
        customContent: editScheduleForm.value.customContent,
        isImage: editScheduleForm.value.isImage,
        imageUrl: editScheduleForm.value.imageUrl,
        showTime: editScheduleForm.value.showTime,
        showAvatar: editScheduleForm.value.showAvatar, // 添加showAvatar字段
        useShortText: editScheduleForm.value.useShortText, // 添加useShortText字段
        style: {
          fontSize: editScheduleForm.value.useCustomFont ? editScheduleForm.value.fontSize : '',
          colorMode: editScheduleForm.value.colorMode,
          textColor: editScheduleForm.value.textColor,
          bgColorMode: editScheduleForm.value.bgColorMode,
          backgroundColor: editScheduleForm.value.backgroundColor,
        },
        logoType: editScheduleForm.value.logoType,
        logoStreamer: editScheduleForm.value.logoType === 'custom' ? editScheduleForm.value.logoStreamer : '',
      };
    } else {
      // 周排班表的保存逻辑保持不变
      if (!weekScheduleData.value[currentRow]) {
        weekScheduleData.value[currentRow] = Array(7).fill(null).map(() => ({}));
      }
      
      weekScheduleData.value[currentRow][currentCell] = {
        time: editScheduleForm.value.time,
        type: editScheduleForm.value.type,
        streamer: editScheduleForm.value.streamer,
        streamers: editScheduleForm.value.streamers,
        customContent: editScheduleForm.value.customContent,
        isImage: editScheduleForm.value.isImage,
        imageUrl: editScheduleForm.value.imageUrl,
        showTime: editScheduleForm.value.showTime,
        showAvatar: editScheduleForm.value.showAvatar, // 添加showAvatar字段
        useShortText: editScheduleForm.value.useShortText, // 添加useShortText字段
        style: {
          fontSize: editScheduleForm.value.useCustomFont ? editScheduleForm.value.fontSize : '',
          colorMode: editScheduleForm.value.colorMode,
          textColor: editScheduleForm.value.textColor,
          bgColorMode: editScheduleForm.value.bgColorMode,
          backgroundColor: editScheduleForm.value.backgroundColor,
        },
        logoType: editScheduleForm.value.logoType,
        logoStreamer: editScheduleForm.value.logoType === 'custom' ? editScheduleForm.value.logoStreamer : '',
      };
    }
    
    editScheduleDialogVisible.value = false;
    ElMessage({
      type: 'success',
      message: '保存成功'
    });
  } catch (error) {
    console.error('保存排班信息时发生错误:', error);
    ElMessage({
      type: 'error',
      message: '保存失败：' + error.message
    });
  }
};

// 主播管理相关方法
const loadStreamers = async () => {
  try {
    const data = localStorage.getItem('streamers')
    // 按照创建时间倒序排序（id代表创建时间戳）
    streamers.value = (data ? JSON.parse(data) : []).sort((a, b) => {
      // 确保即使id不存在也能进行排序
      const idA = a.id || 0
      const idB = b.id || 0
      return idB - idA // 倒序排序：最新创建的排在前面
    })
  } catch (error) {
    console.error('加载主播数据失败:', error)
    streamers.value = []
  }
}

const saveStreamers = async (newStreamers) => {
  try {
    localStorage.setItem('streamers', JSON.stringify(newStreamers))
    streamers.value = newStreamers
  } catch (error) {
    console.error('保存主播数据失败:', error)
    throw error
  }
}

// 成员管理相关的状态
const memberDialogVisible = ref(false)
const addMemberDialogVisible = ref(false)
const editMemberDialogVisible = ref(false)
const currentEditMember = ref(null)
const memberForm = ref({
  name: '',
  description: '',
  avatar: null,
  logo: null,
  logoText: '',
  isLogoImage: false,
  useCustomColor: false,
  color: ''
})

// 显示成员管理对话框
const showMemberModal = () => {
  memberDialogVisible.value = true
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未修改'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}

// 添加成员
const handleAddMember = async () => {
  if (!memberForm.value.name) {
    ElMessage.warning('请输入成员名称')
    return
  }

  try {
    const newMember = {
      id: Date.now(),
      name: memberForm.value.name,
      description: memberForm.value.description,
      avatar: memberForm.value.avatar,
      logo: memberForm.value.logo,
      logoText: memberForm.value.logoText,
      isLogoImage: memberForm.value.isLogoImage,
      useCustomColor: memberForm.value.useCustomColor,
      color: memberForm.value.useCustomColor ? memberForm.value.color || '' : '',
      updateTime: Date.now()
    }
    
    const newMembers = [newMember, ...streamers.value]
    await saveStreamers(newMembers)
    
    ElMessage({
      type: 'success',
      message: '成员已成功添加'
    })
    
    addMemberDialogVisible.value = false
    memberForm.value = {
      name: '',
      description: '',
      avatar: null,
      logo: null,
      logoText: '',
      isLogoImage: false,
      useCustomColor: false,
      color: ''
    }
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '添加成员时发生错误'
    })
  }
}

// 编辑成员
const handleEditMember = async () => {
  if (!memberForm.value.name) {
    ElMessage.warning('请输入成员名称')
    return
  }

  try {
    const newMembers = streamers.value.map(s => 
      s.id === currentEditMember.value.id ? {
        ...s,
        name: memberForm.value.name,
        description: memberForm.value.description,
        avatar: memberForm.value.avatar,
        logo: memberForm.value.logo,
        logoText: memberForm.value.logoText,
        isLogoImage: memberForm.value.isLogoImage,
        useCustomColor: memberForm.value.useCustomColor,
        color: memberForm.value.useCustomColor ? memberForm.value.color || '' : '',
        updateTime: Date.now()
      } : s
    )
    await saveStreamers(newMembers)
    
    ElMessage({
      type: 'success',
      message: '成员信息已更新'
    })
    
    editMemberDialogVisible.value = false
    currentEditMember.value = null
    memberForm.value = {
      name: '',
      description: '',
      avatar: null,
      logo: null,
      logoText: '',
      isLogoImage: false,
      useCustomColor: false,
      color: ''
    }
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '保存失败'
    })
  }
}

// 删除成员
const handleDeleteMember = async (id) => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要删除这个成员吗？',
      '提示',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      const newMembers = streamers.value.filter(s => s.id !== id)
      await saveStreamers(newMembers)
      
      ElMessage({
        type: 'success',
        message: '成员已被删除'
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        type: 'error',
        message: '删除成员时发生错误'
      })
    }
  }
}

// 开始编辑成员
const startEditMember = (member) => {
  currentEditMember.value = member
  memberForm.value = {
    name: member.name,
    description: member.description || '',
    avatar: member.avatar || null,
    logo: member.logo || null,
    logoText: member.logoText || '',
    isLogoImage: !!member.logo,
    useCustomColor: member.useCustomColor || false,
    color: member.color || ''
  }
  editMemberDialogVisible.value = true
}

// 开始添加成员
const startAddMember = () => {
  memberForm.value = {
    name: '',
    description: '',
    avatar: null,
    logo: null,
    logoText: '',
    isLogoImage: false,
    useCustomColor: false,
    color: ''
  }
  addMemberDialogVisible.value = true
}

// 模板管理相关状态
const templateDialogVisible = ref(false)

// 使用模板
const handleUseTemplate = async (template) => {
  try {
    // 如果当前已有排班表数据，显示确认对话框
    const hasExistingData = currentSchedule.value.data.title !== '一周排班表' || 
      weekScheduleData.value.some(row => 
        row && row.some(cell => Object.keys(cell).length > 0)
      ) ||
      monthScheduleData.value.some(day => 
        day && day.slots && day.slots.some(slot => slot && slot.streamer)
      );
    
    if (hasExistingData) {
      const result = await ElMessageBox.confirm(
        '使用模板将覆盖当前显示的排班表，是否继续？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
      
      if (result !== 'confirm') {
        return;
      }
    }

    // 在应用模板之前清除所有合并状态
    mergedCells.value.clear();
    selectedCells.value.clear();

    // 恢复模板数据
    currentSchedule.value = JSON.parse(JSON.stringify(template.data.schedule));
    currentSchedule.value.data.source = 'template';
    weekScheduleData.value = JSON.parse(JSON.stringify(template.data.weekScheduleData));
    monthScheduleData.value = JSON.parse(JSON.stringify(template.data.monthScheduleData));
    
    // 如果是周视图且有保存的weekStart，更新weekDays
    if (currentSchedule.value.data.format.includes('week') && currentSchedule.value.data.weekStart) {
      const weekStart = currentSchedule.value.data.weekStart;
      const [startMonth, startDay] = weekStart.split('.').map(Number);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), startMonth - 1, startDay);
      weekDays.value = getWeekDays(startDate);
    } else if (currentSchedule.value.data.format.includes('week')) {
      // 如果是周视图但没有weekStart，使用本周一
      const today = new Date();
      const monday = new Date(today);
      const dayOfWeek = today.getDay() || 7;
      monday.setDate(today.getDate() - dayOfWeek + 1);
      weekDays.value = getWeekDays(monday);
    }
    
    // 恢复拖拽位置
    if (template.data.dragOffset) {
      dragOffset.value = JSON.parse(JSON.stringify(template.data.dragOffset));
    } else {
      // 如果模板中没有拖拽位置信息，重置为默认位置
      dragOffset.value = { x: 0, y: 0 };
    }
    
    // 恢复放缩比例
    if (template.data.scale) {
      scale.value = template.data.scale;
      updateScheduleScale();
    } else {
      // 如果模板中没有放缩比例信息，重置为默认值
      scale.value = 100;
      updateScheduleScale();
    }

    // 恢复合并单元格信息
    if (template.data.mergedCellsData) {
      // 将序列化的合并单元格数据转换回 Map
      template.data.mergedCellsData.forEach(([key, values]) => {
        mergedCells.value.set(key, values);
      });
    }
    
    // 更新主题色RGB值
    updateThemeColorRGB();
    
    ElMessage({
      type: 'success',
      message: '模板已应用'
    });
    
    // 关闭预览弹窗和模板对话框
    viewTemplateDialogVisible.value = false;
    templateDialogVisible.value = false;
  } catch (error) {
    if (error !== 'cancel') {
      console.error('应用模板时发生错误:', error);
      ElMessage({
        type: 'error',
        message: '应用模板时发生错误...'
      }); 
    }
  }
};

// 删除模板
const handleDeleteTemplate = async (id) => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要删除这个模板吗？此操作不可恢复。',
      '提示',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      // 从 localStorage 获取现有模板
      const existingTemplates = JSON.parse(localStorage.getItem('scheduleTemplates') || '[]')
      
      // 过滤掉要删除的模板
      const newTemplates = existingTemplates.filter(t => t.id !== id)
      
      // 按创建时间倒序排序
      newTemplates.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      
      // 保存回 localStorage
      localStorage.setItem('scheduleTemplates', JSON.stringify(newTemplates))
      
      // 更新模板列表
      templates.value = newTemplates
      
      ElMessage({
        type: 'success',
        message: '模板已删除'
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板时发生错误:', error)
      ElMessage({
        type: 'error',
        message: '删除模板时发生错误'
      })
    }
  }
}

// 添加颜色获取方法
const getTextColor = (cellData, isPreview = false) => {
  if (!cellData?.style) return isPreview ? currentViewTemplate.value?.data?.schedule?.style?.themeColor : currentSchedule.value.style.themeColor
  
  const { colorMode, textColor, bgColorMode } = cellData.style
  
  // 当文字颜色和背景颜色都为"主播自带"时，返回白色
  if (colorMode === 'streamer' && bgColorMode === 'streamer' && 
      cellData.type === 'manual' && cellData.streamers?.length === 1) {
    return '#ffffff'
  }
  
  if (colorMode === 'custom') {
    return textColor
  } else if (colorMode === 'streamer' && cellData.type === 'manual' && cellData.streamers?.length === 1) {
    const streamer = streamers.value.find(s => s.name === cellData.streamers[0])
    if (streamer?.useCustomColor && streamer?.color) {
      return streamer.color
    }
    // 如果主播没有配置颜色，使用主题色
    return isPreview ? currentViewTemplate.value?.data?.schedule?.style?.themeColor : currentSchedule.value.style.themeColor
  }
  
  return isPreview ? currentViewTemplate.value?.data?.schedule?.style?.themeColor : currentSchedule.value.style.themeColor
}

const getBackgroundColor = (cellData, isPreview = false) => {

  if (!cellData?.style) return 'transparent'
  
  const { bgColorMode, backgroundColor } = cellData.style

  if (bgColorMode === 'custom') {
    return backgroundColor || 'transparent'
  } else if (bgColorMode === 'streamer' && cellData.type === 'manual' && cellData.streamers?.length === 1) {
    const streamer = streamers.value.find(s => s.name === cellData.streamers[0])
    return streamer?.useCustomColor && streamer?.color ? streamer.color : 'transparent'
  }
  
  return 'transparent'
}

// 添加获取月历数据的方法
const getMonthCalendarData = () => {
  const today = new Date()
  let targetDate = new Date(today)

  // 如果是下个月格式，调整目标日期到下个月
  if (currentSchedule.value.data.format === 'next_month') {
    targetDate.setMonth(today.getMonth() + 1)
  }

  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()
  
  // 获取目标月份的第一天
  const firstDay = new Date(year, month, 1)
  
  // 获取第一天是星期几（1-7，周一到周日）
  const firstDayWeek = firstDay.getDay() || 7
  
  // 计算日历开始日期（上月补齐的日期）
  const calendarStart = new Date(firstDay)
  calendarStart.setDate(calendarStart.getDate() - firstDayWeek + 1)
  
  // 生成日历数据（6周，确保能显示完整月份）
  const weeks = []
  let currentDate = new Date(calendarStart)
  
  for (let week = 0; week < 6; week++) {
    const weekDays = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentDate)
      const isCurrentMonth = date.getMonth() === month
      
      // 查找当前日期的排班数据
      const dayData = isCurrentMonth ? monthScheduleData.value[date.getDate() - 1] : null
      
      weekDays.push({
        date,
        isCurrentMonth,
        slots: dayData ? dayData.slots : [{}, {}]
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(weekDays)
  }
  
  return weeks
}

// 保存为历史
const saveAsHistory = async () => {
  try {
    // 显示确认对话框
    const result = await ElMessageBox.confirm(
      '确定要保存当前排班表到历史记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result !== 'confirm') {
      return
    }

    // 使用时间戳作为 ID
    const now = new Date()
    const id = Date.now()
    
    // 获取当天的日期（YYYYMMDD格式）
    const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
    
    // 将合并单元格信息转换为可序列化的格式
    const mergedCellsData = Array.from(mergedCells.value.entries())
    
    const history = {
      id,
      dayId: today, // 添加日期ID用于分组
      name: currentSchedule.value.data.title,
      date: now.toLocaleString('zh-CN'),
      data: {
        ...JSON.parse(JSON.stringify(currentSchedule.value)),
        data: {
          ...JSON.parse(JSON.stringify(currentSchedule.value.data)),
          source: 'history'
        }
      },
      weekScheduleData: JSON.parse(JSON.stringify(weekScheduleData.value)),
      monthScheduleData: JSON.parse(JSON.stringify(monthScheduleData.value)),
      dragOffset: JSON.parse(JSON.stringify(dragOffset.value)), // 保存拖拽位置
      scale: scale.value, // 保存放缩比例
      mergedCellsData // 保存合并单元格信息
    }
    
    // 如果是周视图，保存周的开始日期
    if (currentSchedule.value.data.format.includes('week')) {
      const weekStart = weekDays.value[0].date
      history.data.data.weekStart = weekStart
    }
    
    // 从本地存储获取历史记录
    const histories = JSON.parse(localStorage.getItem('scheduleHistories') || '[]')
    
    // 按日期分组历史记录
    const groupedHistories = histories.reduce((groups, item) => {
      const dayId = item.dayId || Math.floor(item.id / 10000) // 兼容旧数据
      if (!groups[dayId]) {
        groups[dayId] = []
      }
      groups[dayId].push(item)
      return groups
    }, {})
    
    // 如果当天已有记录，只保留最新的5条
    if (groupedHistories[today]) {
      groupedHistories[today].push(history)
      groupedHistories[today].sort((a, b) => b.id - a.id) // 按时间戳降序排序
      groupedHistories[today] = groupedHistories[today].slice(0, 5) // 只保留前5条
    } else {
      groupedHistories[today] = [history]
    }
    
    // 将分组后的记录重新组合成数组
    const newHistories = Object.values(groupedHistories).flat()
    
    // 保存到本地存储
    localStorage.setItem('scheduleHistories', JSON.stringify(newHistories))

    ElMessage({
      type: 'success',
      message: '已保存到历史记录'
    })

    // 保存成功后打开历史记录抽屉
    showHistoryDrawer()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存历史记录时发生错误:', error)
      ElMessage({
        type: 'error',
        message: '保存历史记录时发生错误'
      })
    }
  }
}

// 编辑排班表
const editSchedule = () => {
  isEditMode.value = true;
  newScheduleForm.value = {
    template: '',
    format: currentSchedule.value.data.format,
    title: currentSchedule.value.data.title,
    logoPosition: currentSchedule.value.data.logoPosition || 'none', // 加载已有的主播logo显示位置设置
    logoStreamers: currentSchedule.value.data.logoStreamers || [], // 加载已有的主播logo成员列表设置
    style: { ...currentSchedule.value.style },
    weekdayFontSize: currentSchedule.value.style.weekdayFontSize || '16px' // 加载已有的星期字体大小设置
  };
  newScheduleDialogVisible.value = true;
}

// 历史记录相关
const historySidebarRef = ref(null)

// 显示历史记录抽屉
const showHistoryDrawer = () => {
  historySidebarRef.value?.open()
}

// 处理恢复历史记录
const handleRestoreHistory = async (history) => {
  try {
    // 恢复历史数据
    currentSchedule.value = JSON.parse(JSON.stringify(history.data))
    currentSchedule.value.data.source = 'history' // 设置数据来源为history
    
    // 如果是周视图且有保存的周开始日期信息，更新 weekDays
    if (currentSchedule.value.data.format.includes('week') && currentSchedule.value.data.weekStart) {
      
      const weekStart = currentSchedule.value.data.weekStart
      const [startMonth, startDay] = weekStart.split('.').map(Number)
      
      // 计算中间日期
      const now = new Date()
      const startDate = new Date(now.getFullYear(), startMonth - 1, startDay)
      const dates = []
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        dates.push(currentDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '.'))
      }
      
      weekDays.value = weekDays.value.map((day, index) => ({
        name: day.name,
        date: dates[index]
      }))
    }
    
    // 恢复周排班数据
    if (history.weekScheduleData) {
      weekScheduleData.value = JSON.parse(JSON.stringify(history.weekScheduleData))
    }
    
    // 恢复月排班数据
    if (history.monthScheduleData) {
      monthScheduleData.value = JSON.parse(JSON.stringify(history.monthScheduleData))
    }
    
    // 恢复拖拽位置
    if (history.dragOffset) {
      dragOffset.value = JSON.parse(JSON.stringify(history.dragOffset))
    }
    
    // 恢复放缩比例
    if (history.scale) {
      scale.value = history.scale
      updateScheduleScale()
    }
    
    // 恢复合并单元格信息
    mergedCells.value.clear()
    if (history.mergedCellsData) {
      history.mergedCellsData.forEach(([key, values]) => {
        mergedCells.value.set(key, values)
      })
    }
    
    ElMessage({
      type: 'success',
      message: '历史记录已恢复'
    })
  } catch (error) {
    console.error('恢复历史记录时发生错误:', error)
    ElMessage({
      type: 'error',
      message: '恢复历史记录时发生错误'
    })
  }
}

// 添加编辑模式状态
const isEditMode = ref(false)

// 监听对话框关闭
watch(newScheduleDialogVisible, (val) => {
  if (!val) {
    isEditMode.value = false
  }
})

// 添加缩放相关的状态和方法
const scale = ref(100)
const MIN_SCALE = 50
const MAX_SCALE = 150

const handleZoomIn = () => {
  if (scale.value < MAX_SCALE) {
    scale.value = Math.min(scale.value + 10, MAX_SCALE)
    updateScheduleScale()
  }
}

const handleZoomOut = () => {
  if (scale.value > MIN_SCALE) {
    scale.value = Math.max(scale.value - 10, MIN_SCALE)
    updateScheduleScale()
  }
}

const updateScheduleScale = () => {
  if (scheduleTableRef.value) {
    const content = scheduleTableRef.value.$el.querySelector('.schedule-content')
    if (content) {
      content.style.transform = `translate(${dragOffset.value.x}px, ${dragOffset.value.y}px) scale(${scale.value / 100})`
    }
  }
}

// 这是新版本的handleDragEnd，包含缩放功能
const handleDragEnd = (event) => {
  dragOffset.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y
  }
  updateScheduleScale()
}

// 居中排班表
const centerSchedule = () => {
  dragOffset.value = { x: 0, y: 0 }
  updateScheduleScale()
  ElMessage({
    type: 'success',
    message: '排班表已居中'
  })
}

// 添加保存模板对话框
const saveTemplateDialogVisible = ref(false)
const saveTemplateForm = ref({
  name: '',
  description: ''
})

// 添加查看模板相关状态
const viewTemplateDialogVisible = ref(false)
const currentViewTemplate = ref(null)

// 查看模板
const handleViewTemplate = (template) => {
  currentViewTemplate.value = template
  viewTemplateDialogVisible.value = true
}

// 导入模板
const handleImportTemplate = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const importedTemplates = JSON.parse(e.target.result)
          
          // 验证导入的数据格式
          if (!Array.isArray(importedTemplates)) {
            throw new Error('导入的文件格式不正确')
          }
          
          // 从 localStorage 获取现有模板
          const existingTemplates = JSON.parse(localStorage.getItem('scheduleTemplates') || '[]')
          
          // 合并模板并去重
          const mergedTemplates = [...existingTemplates]
          for (const template of importedTemplates) {
            if (!mergedTemplates.some(t => t.id === template.id)) {
              mergedTemplates.push(template)
            }
          }
          
          // 保存回 localStorage
          localStorage.setItem('scheduleTemplates', JSON.stringify(mergedTemplates))
          
          // 更新模板列表并按创建时间倒序排序
          templates.value = mergedTemplates.sort((a, b) => {
            return new Date(b.createTime) - new Date(a.createTime)
          })
          
          ElMessage({
            type: 'success',
            message: '模板导入成功'
          })
        } catch (error) {
          console.error('解析导入文件时发生错误:', error)
          ElMessage({
            type: 'error',
            message: '导入失败：文件格式不正确'
          })
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('导入模板时发生错误:', error)
      ElMessage({
        type: 'error',
        message: '导入模板时发生错误'
      })
    }
  }
  input.click()
}

// 导出模板
const handleExportTemplates = () => {
  try {
    const templatesJson = JSON.stringify(templates.value, null, 2)
    const blob = new Blob([templatesJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `排班表模板_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage({
      type: 'success',
      message: '模板导出成功'
    })
  } catch (error) {
    console.error('导出模板时发生错误:', error)
    ElMessage({
      type: 'error',
      message: '导出模板时发生错误'
    })
  }
}

// 添加放缩比例设置相关状态
const scaleDialogVisible = ref(false)
const scaleInputValue = ref(100)

// 添加放缩比例设置方法
const showScaleDialog = () => {
  scaleInputValue.value = scale.value
  scaleDialogVisible.value = true
}

const handleScaleChange = () => {
  // 确保输入值在有效范围内
  let value = parseFloat(scaleInputValue.value)
  if (isNaN(value)) {
    ElMessage.error('请输入有效的数字')
    return
  }
  
  if (value < MIN_SCALE || value > MAX_SCALE) {
    ElMessage.error(`请输入 ${MIN_SCALE}% - ${MAX_SCALE}% 之间的数值`)
    return
  }
  
  value = parseFloat(value.toFixed(2))
  scale.value = value
  scaleInputValue.value = value
  updateScheduleScale()
  scaleDialogVisible.value = false
}

// 在 template 中修改放缩控制部分
const handleScaleInput = (value) => {
  // 只允许输入数字和小数点
  let numValue = value.toString().replace(/[^\d.]/g, '')
  // 确保只有一个小数点
  const parts = numValue.split('.')
  if (parts.length > 2) {
    numValue = parts[0] + '.' + parts.slice(1).join('')
  }
  // 限制小数位数为2位
  if (parts.length === 2 && parts[1].length > 2) {
    numValue = parts[0] + '.' + parts[1].slice(0, 2)
  }
  scaleInputValue.value = numValue || ''
}

// 在 script setup 中添加新的状态
const selectedCells = ref(new Set()) // 存储选中的格子
const isCtrlPressed = ref(false) // 是否按下 Ctrl 键
const isDragging = ref(false) // 是否正在拖动选择
const isMouseDown = ref(false) // 添加鼠标按下状态
const dragStartCell = ref(null) // 拖动选择的起始格子
const mergedCells = ref(new Map()) // 存储合并的格子信息，key 为主格子的坐标，value 为被合并格子的坐标数组

// 处理格子点击事件
const handleCellClick = (dayIndex, rowIndex) => {
  // 如果是月视图，使用月视图的处理函数
  if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
    return handleMonthCellClick(rowIndex, dayIndex);
  }

  // 如果正在进行合并操作，不处理点击事件
  if (isMouseDown.value) {
    return;
  }

  // 获取当前格子的数据
  const currentCellData = weekScheduleData.value[rowIndex]?.[dayIndex];
  const currentStyle = currentCellData?.style || {};
  
  // 打开编辑对话框
  openEditDialog(rowIndex, dayIndex, currentCellData, currentStyle);
}

// 在 script setup 中修改相关方法
// 判断是否是合并的主单元格
const isMergedMainCell = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  return mergedCells.value.has(key)
}

// 判断是否是被合并后隐藏的单元格
const isMergedHiddenCell = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  return Array.from(mergedCells.value.values()).some(mergedKeys => 
    mergedKeys.includes(key)
  )
}

// 获取合并单元格的样式
const getMergedCellStyle = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  // 如果是被合并的格子，返回透明样式
  if (isMergedHiddenCell(rowIndex, cellIndex)) {
    return {
      backgroundColor: 'transparent',
      color: 'transparent'
    }
  }
  
  // 如果不是主格子，返回默认样式
  if (!mergedCells.value.has(key)) {
    return {}
  }

  // 获取主格子的数据
  let mainCellData;
  if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
    // 获取月排班表的数据
    const weekData = getMonthCalendarData()[rowIndex];
    if (weekData && weekData[cellIndex]) {
      const date = weekData[cellIndex].date;
      mainCellData = monthScheduleData.value[date.getDate() - 1]?.slots[0];
    }
  } else {
    // 获取周排班表的数据
    mainCellData = weekScheduleData.value[rowIndex][cellIndex];
  }

  if (!mainCellData) {
    return {}
  }

  // 返回主格子的样式
  return {
    backgroundColor: getBackgroundColor(mainCellData),
    color: getTextColor(mainCellData),
    fontSize: mainCellData.style?.fontSize || 'inherit'
  }
}

// 获取列跨度
const getColSpan = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (mergedCells.value.has(key)) {
    const mergedKeys = mergedCells.value.get(key)
    const positions = [key, ...mergedKeys].map(k => {
      const [row, col] = k.split(',').map(Number)
      return { row, col }
    })
    
    const cols = positions.map(p => p.col)
    return Math.max(...cols) - Math.min(...cols) + 1
  }
  
  return 1
}

// 获取行跨度
const getRowSpan = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (mergedCells.value.has(key)) {
    const mergedKeys = mergedCells.value.get(key)
    const positions = [key, ...mergedKeys].map(k => {
      const [row, col] = k.split(',').map(Number)
      return { row, col }
    })
    
    const rows = positions.map(p => p.row)
    return Math.max(...rows) - Math.min(...rows) + 1
  }
  
  return 1
}

// 添加计算rest-text宽度的方法
const getRestTextWidth = (cellData) => {
  // 直接从cellData获取字体大小,默认为24
  const fontSize = cellData?.style?.fontSize ? parseFloat(cellData.style.fontSize) : 24;
  
  // 返回字体大小加30px
  return `${fontSize + 30}px`;
}

// 获取合并格子的日期范围
const getMergedDateRange = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (!mergedCells.value.has(key)) {
    return ''
  }
  
  const mergedKeys = mergedCells.value.get(key)
  const allKeys = [key, ...mergedKeys]
  
  // 获取所有日期
  const dates = []
  allKeys.forEach(k => {
    const [row, col] = k.split(',').map(Number)
    const weekData = getMonthCalendarData()[row]
    if (weekData && weekData[col]) {
      dates.push(weekData[col].date.getDate())
    }
  })
  
  // 排序日期
  dates.sort((a, b) => a - b)
  
  // 如果只有一个日期，直接返回
  if (dates.length === 1) {
    return `${dates[0]}日`
  }
  
  // 寻找连续的日期范围
  const ranges = []
  let startDate = dates[0]
  let endDate = dates[0]
  
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] === endDate + 1) {
      endDate = dates[i]
    } else {
      ranges.push([startDate, endDate])
      startDate = dates[i]
      endDate = dates[i]
    }
  }
  ranges.push([startDate, endDate])
  
  // 格式化输出
  return ranges.map(range => {
    if (range[0] === range[1]) {
      return `${range[0]}日`
    } else {
      return `${range[0]}~${range[1]}日`
    }
  }).join('、')
}

// 监听格式变化，自动设置正确的主题样式
watch(() => newScheduleForm.value.format, (newFormat) => {
  if (newFormat === 'month' || newFormat === 'current_month' || newFormat === 'next_month') {
    newScheduleForm.value.style.themeStyle = 'top-weekday'
    newScheduleForm.value.style.weekdayLayout = 'single' // 自动设置为一行
  }
  if (!isEditMode.value && !newScheduleForm.value.template) {
    newScheduleForm.value.title = newFormat === 'current_week' ? '一周排班表' : '本月排班表'
  }
})

// 处理页面点击事件
const handlePageClick = (e) => {
  // 如果点击的不是右键菜单，且是鼠标左键
  if (!e.target.closest('.context-menu') && e.button === 0) {
    selectedCells.value.clear()
  }
}

// 新增：获取主播Logo的方法
const getStreamerLogo = (streamerName) => {
  const streamer = streamers.value.find(s => s.name === streamerName)
  // 检查主播是否存在logo字段，不再检查isLogoImage字段
  if (streamer?.logo) {
    return streamer.logo
  }
  return null
}

// 修改获取主播Logo文字的方法
const getStreamerLogoText = (streamerName) => {
  const streamer = streamers.value.find(s => s.name === streamerName)
  // 如果是文字类型的logo且设置了logoText，返回logoText
  if (!streamer?.isLogoImage && streamer?.logoText) {
    return streamer.logoText
  }
  // 否则返回主播名的第一个字
  return streamerName?.charAt(0) || 'L'
}

// 修改获取Logo样式的方法
const getLogoStyle = (streamerName, isPreview = false) => {
  const streamer = streamers.value.find(s => s.name === streamerName)
  if (streamer?.useCustomColor && streamer?.color) {
    return {
      backgroundColor: streamer.color,
      color: '#ffffff'
    }
  }
  // 如果是在预览模式下
  if (isPreview && currentViewTemplate.value?.data?.schedule?.style?.themeColor) {
    return {
      backgroundColor: currentViewTemplate.value.data.schedule.style.themeColor,
      color: '#ffffff'
    }
  }
  // 如果是在正常模式下
  return {
    backgroundColor: currentSchedule.value?.style?.themeColor || '#409EFF',
    color: '#ffffff'
  }
}

// 添加监听器
watch(() => newScheduleForm.value.template, (newTemplateId) => {
  if (newTemplateId) {
    // 找到选中的模板
    const selectedTemplate = templates.value.find(t => t.id === newTemplateId)
    if (selectedTemplate) {
      // 填充模板数据到表单
      const templateSchedule = selectedTemplate.data.schedule
      
      // 更新格式
      newScheduleForm.value.format = templateSchedule.data.format
      
      // 如果是本月周格式，设置选中的周
      if (templateSchedule.data.format === 'month_week') {
        selectedMonthWeek.value = templateSchedule.data.selectedWeek || 1
      }
      
      // 更新标题（如果不是编辑模式）
      if (!isEditMode.value) {
        newScheduleForm.value.title = templateSchedule.data.title
      }
      
      // 提示用户排班表格式已根据模板自动设置
      ElMessage({
        message: '已根据模板自动设置排班表格式',
        type: 'info',
        duration: 2000
      })
    }
  }
})

// 添加获取月历数据的方法
const getMonthCalendarWeeks = (monthScheduleData) => {
  if (!monthScheduleData || !monthScheduleData.length) return []
  
  const today = new Date()
  const year = today.getFullYear()
  let month = today.getMonth()

  // 根据格式决定是显示本月还是下个月
  if (currentViewTemplate.value?.data?.schedule?.data?.format === 'next_month') {
    month = month + 1
  }

  // 获取当月第一天
  const firstDay = new Date(year, month, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  
  // 获取第一天是星期几（0-6，周日-周六）
  const firstDayWeek = firstDay.getDay() || 7 // 将周日的0转换为7
  
  // 计算日历开始日期（上月补齐的日期）
  const calendarStart = new Date(firstDay)
  calendarStart.setDate(calendarStart.getDate() - firstDayWeek + 1)
  
  // 生成日历数据（6周，确保能显示完整月份）
  const weeks = []
  let currentDate = new Date(calendarStart)
  
  for (let week = 0; week < 6; week++) {
    const weekDays = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentDate)
      const isCurrentMonth = date.getMonth() === month
      
      // 查找当前日期的排班数据
      const dayData = isCurrentMonth ? monthScheduleData[date.getDate() - 1] : null
      
      weekDays.push({
        date: date.getDate(),
        isCurrentMonth,
        // 如果有排班数据，使用slots[0]的数据
        ...(dayData?.slots?.[0] || {})
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(weekDays)
    
    // 如果已经超过当月最后一天，且当前周都不是当月，则结束循环
    if (currentDate > lastDay && weeks[week].every(day => !day.isCurrentMonth)) {
      break
    }
  }
  
  return weeks
}

// 添加格式化类型的方法
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

// 监听当前排班表格式变化，自动调整放缩比例
watch(() => currentSchedule.value.data.format, (newFormat) => {
  if (newFormat === 'current_month' || newFormat === 'next_month') {
    scale.value = 70;
    updateScheduleScale();
  } else {
    scale.value = 100;
    updateScheduleScale();
  }
})

// 添加模板预览对话框状态监听
watch(viewTemplateDialogVisible, async (newVal) => {
  if (newVal && currentViewTemplate.value) {
    await nextTick()
    // 确保预览内容已渲染
    const previewContent = document.querySelector('.preview-schedule-table')
    if (!previewContent) {
      console.warn('预览内容未找到，可能需要重试')
      ElMessage({
        type: 'warning',
        message: '预览加载可能不完整，请重试'
      })
    }
  }
})

// 添加预览关闭处理函数
const handlePreviewClose = () => {
  viewTemplateDialogVisible.value = false
  currentViewTemplate.value = null
}

// 打开单元格编辑对话框
const openEditDialog = (rowIndex, cellIndex, currentData = null, currentStyle = {}) => {
  // 初始化编辑表单
  editScheduleForm.value = {
    time: currentData?.time || '',
    type: currentData?.type || 'manual',
    streamer: currentData?.streamer || '',
    streamers: currentData?.streamers || [],
    customContent: currentData?.customContent || '',
    currentRow: rowIndex,
    currentCell: cellIndex,
    isImage: currentData?.isImage || false,
    imageUrl: currentData?.imageUrl || '',
    showTime: currentData?.showTime ?? true,
    useCustomFont: !!currentStyle.fontSize,
    fontSize: currentStyle.fontSize || '14px',
    colorMode: currentStyle.colorMode || 'default',
    textColor: currentStyle.textColor || '#000000',
    bgColorMode: currentStyle.bgColorMode || 'default',
    backgroundColor: currentStyle.backgroundColor || '#ffffff',
    // 新增：加载logo配置
    logoType: currentData?.logoType || 'none',
    logoStreamer: currentData?.logoStreamer || '',
    showAvatar: currentData?.showAvatar ?? false,
    useShortText: currentData?.useShortText ?? false, // 当为true时显示为"休"，为false显示为"休息"
  }
  editScheduleDialogVisible.value = true
}

// 在月视图中编辑单元格
const handleMonthCellClick = (rowIndex, dayIndex) => {
  // 当前周数据
  const weekData = getMonthCalendarData()[rowIndex]
  if (!weekData || !weekData[dayIndex]) {
    return
  }
  
  // 获取点击的日期
  const date = weekData[dayIndex].date
  
  // 如果不是当月的日期，不响应点击
  if (!weekData[dayIndex].isCurrentMonth) {
    return
  }

  // 如果正在进行合并操作，不处理点击事件
  if (isMouseDown.value) {
    return;
  }

  // 获取当前格子的数据
  const dayIndex2 = date.getDate() - 1;
  const currentCellData = monthScheduleData.value[dayIndex2]?.slots[0];
  const currentStyle = currentCellData?.style || {};
  
  // 打开编辑对话框
  openEditDialog(rowIndex, dayIndex, currentCellData, currentStyle);
}

// 新增：获取主播头像的方法
const getStreamerAvatarByName = (streamerName) => {
  const streamer = streamers.value.find(s => s.name === streamerName)
  return streamer?.avatar || ''
}

// 添加更新主题色RGB值的方法
const updateThemeColorRGB = () => {
  if (!currentSchedule.value?.style?.themeColor) return
  
  // 将十六进制颜色转换为RGB
  const hexToRgb = (hex) => {
    // 移除可能的#前缀
    hex = hex.replace(/^#/, '')
    
    // 将3位色值转换为6位
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    
    // 解析RGB值
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    return [r, g, b]
  }
  
  try {
    const rgb = hexToRgb(currentSchedule.value.style.themeColor)
    document.documentElement.style.setProperty('--el-color-primary-rgb', rgb.join(', '))
  } catch (error) {
    console.error('更新主题色RGB值时发生错误:', error)
  }
}

// 监听主题色变化，更新RGB值
watch(() => currentSchedule.value?.style?.themeColor, (newColor) => {
  if (newColor) {
    updateThemeColorRGB()
  }
}, { immediate: true })

// 添加监听器，当useShortText或type改变时，自动设置文字颜色为默认
watch(
  [
    () => editScheduleForm.value.useShortText,
    () => editScheduleForm.value.type
  ],
  ([newUseShortText, newType]) => {
    if (newType === 'rest' && newUseShortText) {
      editScheduleForm.value.colorMode = 'default'
    }
  }
)

// 添加转换主题色为RGB的方法
const getThemeColorRGB = (hexColor) => {
  if (!hexColor) return '64, 158, 255' // 默认蓝色

  // 移除可能的#前缀
  hexColor = hexColor.replace(/^#/, '')
  
  // 将3位色值转换为6位
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(char => char + char).join('')
  }
  
  try {
    // 解析RGB值
    const r = parseInt(hexColor.substring(0, 2), 16)
    const g = parseInt(hexColor.substring(2, 4), 16)
    const b = parseInt(hexColor.substring(4, 6), 16)
    
    return `${r}, ${g}, ${b}`
  } catch (error) {
    console.error('转换主题色RGB值时发生错误:', error)
    return '64, 158, 255' // 发生错误时返回默认蓝色
  }
}

// 添加新的方法
const getCellStyle = (cellData, scheduleStyle, isPreview = false) => {
  return {
    borderColor: isPreview ? currentViewTemplate.value?.data?.schedule?.style?.themeColor : scheduleStyle?.themeColor,
    borderWidth: scheduleStyle?.borderWidth + 'px',
    backgroundColor: getBackgroundColor(cellData, isPreview)
  }
}

// 获取单元格背景颜色
const getCellBackgroundColor = (rowIndex, cellIndex) => {
  let cellData;
  if (currentSchedule.value.data.format === 'current_month' || currentSchedule.value.data.format === 'next_month') {
    // 获取月排班表的数据
    const weekData = getMonthCalendarData()[rowIndex];
    if (weekData && weekData[cellIndex]) {
      const date = weekData[cellIndex].date;
      cellData = monthScheduleData.value[date.getDate() - 1]?.slots[0];
    }
  } else {
    // 获取周排班表的数据
    cellData = weekScheduleData.value[rowIndex][cellIndex];
  }

  return getBackgroundColor(cellData)
}

// 预览模式：获取列跨度
const getViewColSpan = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (currentViewTemplate.value?.data?.mergedCellsData) {
    // 将数组形式的合并单元格数据转换为Map
    const mergedCellsMap = new Map(currentViewTemplate.value.data.mergedCellsData)
    
    // 检查是否是主单元格
    if (mergedCellsMap.has(key)) {
      const mergedKeys = mergedCellsMap.get(key)
      const positions = [key, ...mergedKeys].map(k => {
        const [row, col] = k.split(',').map(Number)
        return { row, col }
      })
      
      // 计算列跨度：找到最大列和最小列的差值加1
      const cols = positions.map(p => p.col)
      return Math.max(...cols) - Math.min(...cols) + 1
    }
  }
  
  return 1
}

// 预览模式：获取行跨度
const getViewRowSpan = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (currentViewTemplate.value?.data?.mergedCellsData) {
    // 将数组形式的合并单元格数据转换为Map
    const mergedCellsMap = new Map(currentViewTemplate.value.data.mergedCellsData)
    
    // 检查是否是主单元格
    if (mergedCellsMap.has(key)) {
      const mergedKeys = mergedCellsMap.get(key)
      const positions = [key, ...mergedKeys].map(k => {
        const [row, col] = k.split(',').map(Number)
        return { row, col }
      })
      
      // 计算行跨度：找到最大行和最小行的差值加1
      const rows = positions.map(p => p.row)
      return Math.max(...rows) - Math.min(...rows) + 1
    }
  }
  
  return 1
}

// 预览模式：判断是否是被合并后隐藏的单元格
const isViewMergedHiddenCell = (rowIndex, cellIndex) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (currentViewTemplate.value?.data?.mergedCellsData) {
    // 将数组形式的合并单元格数据转换为Map
    const mergedCellsMap = new Map(currentViewTemplate.value.data.mergedCellsData)
    
    // 检查当前单元格是否是某个合并集合中的成员（不是主单元格）
    for (const [mainKey, mergedKeys] of mergedCellsMap.entries()) {
      if (mergedKeys.includes(key)) {
        return true
      }
    }
  }
  
  return false
}

// 预览模式：获取合并单元格的样式
const getViewMergedCellStyle = (rowIndex, cellIndex, day) => {
  const key = `${rowIndex},${cellIndex}`
  
  if (currentViewTemplate.value?.data?.mergedCellsData) {
    const mergedCellsMap = new Map(currentViewTemplate.value.data.mergedCellsData)
    
    // 如果是被合并的格子，返回透明样式
    if (isViewMergedHiddenCell(rowIndex, cellIndex)) {
      return {
        backgroundColor: 'transparent',
        color: 'transparent',
        visibility: 'hidden'
      }
    }
    
    // 如果是主格子，返回正常样式
    if (mergedCellsMap.has(key)) {
      // 获取所有合并的单元格
      const mergedKeys = mergedCellsMap.get(key)
      const positions = [key, ...mergedKeys].map(k => {
        const [row, col] = k.split(',').map(Number)
        return { row, col }
      })
      
      // 获取日期范围
      const dates = positions.map(pos => {
        const weekData = getMonthCalendarWeeks(currentViewTemplate.value?.data?.monthScheduleData)[pos.row]
        return weekData?.[pos.col]?.date
      }).filter(Boolean)
      // 排序日期
      dates.sort((a, b) => a - b)
      
      // 构建日期范围字符串
      let dateRange = ''
      if (dates.length === 1) {
        dateRange = `${dates[0]}日`
      } else {
        const ranges = []
        let start = dates[0]
        let prev = dates[0]

        for (let i = 1; i < dates.length; i++) {
          if (dates[i] !== prev + 1) {
            ranges.push(start === prev ? `${start}日` : `${start}~${prev}日`)
            start = dates[i]
          }
          prev = dates[i]
        }
        ranges.push(start === prev ? `${start}日` : `${start}~${prev}日`)
        dateRange = ranges.join('、')
      }

      return {
        backgroundColor: currentViewTemplate.value?.data?.schedule?.style?.backgroundColor || 'unset',
        color: currentViewTemplate.value?.data?.schedule?.style?.themeColor || '#000000',
        dateRange: dateRange
      }
    }
  }
  
  return {
    dateRange: day?.date ? `${day.date}日` : ''
  }
}

// 监听排班表格式变化，取消所有合并的格子
watch(() => currentSchedule.value.data.format, async (newFormat, oldFormat) => {
  // 如果存在合并的格子，且格式发生了变化
  let formatChangeFlag = true
  if ((newFormat.includes('_week') && oldFormat.includes('_week')) || 
      (newFormat.includes('_month') && oldFormat.includes('_month'))) {
    formatChangeFlag = false
  }

  if (mergedCells.value.size > 0 && newFormat !== oldFormat && 
    currentSchedule.value.data.source !== 'history' && 
    currentSchedule.value.data.source !== 'template'
  ) {
    console.log(currentSchedule.value.data.source)
    try {
      let result = 'confirm'
      if (!formatChangeFlag) {
        result = await ElMessageBox.confirm(
          '是否取消所有已合并的格子？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
      }
      
      if (result !== 'confirm') {
        // 如果用户取消，恢复之前的格式
        currentSchedule.value.data.format = oldFormat;
        return;
      }

      // 清除所有合并状态
      mergedCells.value.clear();
      selectedCells.value.clear();
      
      // 重新初始化数据，保留原有内容
      if (newFormat.includes('week')) {
        const tempData = JSON.parse(JSON.stringify(weekScheduleData.value));
        weekScheduleData.value = [
          Array(7).fill(null).map((_, index) => ({
            ...tempData[0][index],
            style: {} // 清除可能存在的合并样式
          })),
          Array(7).fill(null).map((_, index) => ({
            ...tempData[1][index],
            style: {} // 清除可能存在的合并样式
          }))
        ];
      } else {
        // 月视图数据处理
        const tempData = JSON.parse(JSON.stringify(monthScheduleData.value));
        monthScheduleData.value = tempData.map(day => ({
          ...day,
          slots: day.slots.map(slot => ({
            ...slot,
            style: {} // 清除可能存在的合并样式
          }))
        }));
      }

      // 强制重新渲染表格
      await nextTick();
      
      ElMessage.success('已取消所有合并的格子');
    } catch (error) {
      if (error !== 'cancel') {
        console.error('切换排班表格式时发生错误:', error);
        ElMessage.error('切换排班表格式失败');
      }
    }
  }
});

// 导入成员
const handleImportMember = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const importedMembers = JSON.parse(e.target.result)
          
          // 验证导入的数据格式
          if (!Array.isArray(importedMembers)) {
            throw new Error('导入的文件格式不正确')
          }
          
          // 从 localStorage 获取现有成员
          const existingMembers = JSON.parse(localStorage.getItem('streamers') || '[]')
          
          // 合并成员并去重
          const mergedMembers = [...existingMembers]
          for (const member of importedMembers) {
            if (!mergedMembers.some(m => m.id === member.id)) {
              mergedMembers.push(member)
            }
          }
          
          // 保存回 localStorage
          localStorage.setItem('streamers', JSON.stringify(mergedMembers))
          
          // 更新成员列表并按创建时间倒序排序
          streamers.value = mergedMembers.sort((a, b) => {
            return new Date(b.updateTime || b.id) - new Date(a.updateTime || a.id)
          })
          
          ElMessage({
            type: 'success',
            message: '成员导入成功'
          })
        } catch (error) {
          console.error('解析导入文件时发生错误:', error)
          ElMessage({
            type: 'error',
            message: '导入失败：文件格式不正确'
          })
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('导入成员时发生错误:', error)
      ElMessage({
        type: 'error',
        message: '导入成员时发生错误'
      })
    }
  }
  input.click()
}

// 导出成员
const handleExportMember = () => {
  try {
    const membersJson = JSON.stringify(streamers.value, null, 2)
    const blob = new Blob([membersJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `成员列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage({
      type: 'success',
      message: '成员导出成功'
    })
  } catch (error) {
    console.error('导出成员时发生错误:', error)
    ElMessage({
      type: 'error',
      message: '导出成员时发生错误'
    })
  }
}

</script>

<style scoped>

:root {
  --el-color-primary-rgb: 64, 158, 255; /* 默认蓝色 */
}

@font-face {
  font-family: 'AlibabaSans-Thin';
  src: url('../assets/fonts/AlibabaPuHuiTi-3-35-Thin.ttf') format('truetype');
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'AlibabaSans-Light';
  src: url('../assets/fonts/AlibabaPuHuiTi-3-45-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'AlibabaSans-Regular';
  src: url('../assets/fonts/AlibabaPuHuiTi-3-55-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'AlibabaSans-Medium';
  src: url('../assets/fonts/AlibabaPuHuiTi-3-65-Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'AlibabaSans-Bold';
  src: url('../assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'AlibabaSans-Black';
  src: url('../assets/fonts/AlibabaPuHuiTi-3-115-Black.ttf') format('truetype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

/* 华为鸿蒙Sans */
@font-face {
  font-family: 'HarmonyOS_Sans_Thin';
  src: url('../assets/fonts/HarmonyOS_SansSC_Thin.ttf') format('truetype');
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'HarmonyOS_Sans_Light';
  src: url('../assets/fonts/HarmonyOS_SansSC_Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'HarmonyOS_Sans_Regular';
  src: url('../assets/fonts/HarmonyOS_SansSC_Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'HarmonyOS_Sans_Medium';
  src: url('../assets/fonts/HarmonyOS_SansSC_Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'HarmonyOS_Sans_Bold';
  src: url('../assets/fonts/HarmonyOS_SansSC_Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'HarmonyOS_Sans_Black';
  src: url('../assets/fonts/HarmonyOS_SansSC_Black.ttf') format('truetype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

/* 移除全局字体设置，改为在需要的地方单独设置 */
.schedule-table {
  font-family: var(--schedule-font-family, 'AlibabaSans-Regular');
}

/* 确保字体应用到排班表的所有内容 */
.schedule-table :deep(*) {
  font-family: inherit;
}

/* 设置标题字体 */
.schedule-table h2 {
  font-family: inherit;
}

/* 确保单元格内容继承字体 */
.cell-content,
.cell-content .text-sm,
.cell-content .font-medium {
  font-family: inherit;
}

/* 确保日期和星期标题继承字体 */
.schedule-header,
.date-header {
  font-family: inherit;
}

/* 移除星期表头的加粗样式 */
.schedule-header {
  font-weight: unset;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0;
  width: 100%;
  z-index: 100;
  flex-shrink: 0;
  height: 60px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.main-container {
  flex: 1;
  min-height: 0;
  display: flex;
}

.history-sidebar,
.component-sidebar {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  height: 100%;
  position: relative;
  flex-shrink: 0;
  overflow-y: auto;
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.2);
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.5);
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.history-sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  height: 100%;
  position: relative;
  flex-shrink: 0;
  overflow-y: auto;
}

.component-sidebar {
  transform: translateX(0);
}

.history-sidebar.open,
.component-sidebar.open {
  transform: translateX(0);
}

.sidebar-toggle {
  display: none;
}

.main-content {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 10px;
  flex-wrap: wrap;
}

.left-tools,
.right-tools {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin: 0 2px;
}

.schedule-table {
  flex: 1;
  min-height: 0;
  display: flex;
  padding: 2rem;
  align-items: center;
  justify-content: center;
}

.schedule-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.schedule-table-container {
  width: 100%;
}

.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.schedule-header,
.schedule-cell {
  padding: 0.75rem;
  text-align: center;
  vertical-align: middle;
  border-width: v-bind('currentSchedule.style.borderWidth + "px"');
  border-style: solid;
}

/* 为模板预览添加单独的样式规则 */
.preview-schedule-table .schedule-header,
.preview-schedule-table .schedule-cell {
  border-width: v-bind('currentViewTemplate?.data?.schedule?.style?.borderWidth + "px" || "1px"');
}

.schedule-header {
  width: calc(100% / 4);
  /* 移除背景颜色 */
  /* background-color: var(--el-bg-color-overlay); */
}

.schedule-cell {
  height: 100px;
  padding: 8px;
  position: relative;
  vertical-align: top;
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 8px;
  min-height: 80px;
}

.cell-content:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 添加表格单元格内容样式 */
.cell-content .font-medium {
  white-space: pre-wrap;
  word-break: break-all;
  text-align: center;
  width: 100%;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 768px) {
  .history-sidebar,
  .component-sidebar {
    position: fixed;
    top: 60px;
    bottom: 0;
    left: 0;
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .history-sidebar.open {
    transform: translateX(0);
  }
  
  .component-sidebar {
    right: 0;
    transform: translateX(100%);
  }
  
  .sidebar-toggle {
    display: block;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .history-sidebar .sidebar-toggle {
    right: -20px;
  }
  
  .component-sidebar .sidebar-toggle {
    left: -20px;
  }
  
  .schedule-cell {
    height: auto;
  }
}

.color-preview {
  display: inline-block;
  min-width: 2rem;
  min-height: 2rem;
}

.description-textarea :deep(.el-textarea__inner) {
  min-height: 50px !important;
  max-height: 100px !important;
  overflow-y: auto;
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.2);
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.5);
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

/* 添加新的样式 */
.member-dialog-form {
  min-height: 420px;
}

.toggle-content {
  height: 40px;
  opacity: 1;
  transition: all 0.3s ease;
  overflow: hidden;
}

.toggle-content.hidden {
  height: 0;
  opacity: 0;
  margin: 0;
}

.logo-input-container {
  display: flex;
  align-items: center;
  height: 32px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.logo-input-container :deep(.el-input) {
  width: 100%;
}

.logo-input-container :deep(.el-input__wrapper) {
  width: 100%;
}

.member-dialog-form :deep(.el-form-item__content) {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.member-dialog-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.member-dialog-form :deep(.el-form-item.is-required) .el-form-item__label:before {
  margin-right: 4px;
}

.color-form-item :deep(.el-form-item__content) {
  height: 32px;
  display: flex;
  align-items: center;
}

.color-switch-container {
  display: flex;
  align-items: center;
  height: 100%;
}

.color-input-container {
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  margin-left: 8px;
  height: 100%;
}

.color-input-container.hidden {
  width: 0;
  opacity: 0;
  margin-left: 0;
  overflow: hidden;
}

/* 添加编辑排班对话框的样式 */
.edit-schedule-dialog :deep(.el-dialog__body) {
  padding: 30px 20px;
}

.edit-schedule-dialog :deep(.el-dialog__footer) {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.edit-schedule-dialog :deep(.el-select) {
  width: 100%;
}

.edit-schedule-dialog :deep(.el-time-picker) {
  width: 100%;
}

/* 多选下拉框标签样式 */
.edit-schedule-dialog :deep(.el-select .el-select__tags) {
  flex-wrap: wrap;
  max-height: 80px;
  overflow-y: auto;
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.2);
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.5);
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

:deep(.el-tag) {
  --el-tag-text-color: #409EFF !important;
  --el-tag-bg-color: #f0f2f5 !important;
}

:deep(.el-tag__close) {
  color: var(--el-text-color-secondary) !important;
  background-color: transparent !important;
}

:deep(.el-tag__close:hover) {
  color: #fff !important;
  background-color: var(--el-text-color-secondary) !important;
}

/* 添加图片相关样式 */
.cell-image {
  display: block;
  margin: 0 auto;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  height: 60px;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

/* 添加时间选择器右边距样式 */
:deep(.el-input),
:deep(.el-input--prefix),
:deep(.el-input--suffix),
:deep(.el-date-editor),
:deep(.el-date-editor--time),
:deep(.el-tooltip__trigger) {
  margin-right: 10px;
}

/* 添加新的样式设置相关样式 */
.style-form-item :deep(.el-form-item__content) {
  height: 32px;
  display: flex;
  align-items: center;
}

.style-switch-container {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 16px;
}

.style-input-container {
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  overflow: hidden;
}

.style-input-container.hidden {
  width: 0;
  opacity: 0;
  margin-left: 0;
}

.style-input-container :deep(.el-select),
.style-input-container :deep(.el-color-picker) {
  width: 135px !important;
}

/* 调整单元格内容的样式 */
.cell-content {
  padding: 8px;
  min-height: 80px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cell-content .space-y-1 {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.cell-content .font-medium {
  padding: 0 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 调整开关的间距 */
:deep(.el-switch) {
  margin-right: 8px;
}

/* 添加新的颜色设置相关样式 */
.style-form-item :deep(.el-radio-group) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.style-form-item :deep(.el-radio) {
  display: flex;
  align-items: center;
  margin-right: 0;
  height: 32px;
}

.style-form-item :deep(.el-radio__label) {
  display: flex;
  align-items: center;
}

/* 调整颜色选择器的样式 */
.style-form-item :deep(.el-color-picker) {
  margin: 0;
}

.style-form-item :deep(.el-color-picker__trigger) {
  width: 32px;
  height: 32px;
  padding: 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

/* 编辑排班弹窗样式优化 */
.edit-schedule-dialog {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-select),
  :deep(.el-time-picker) {
    width: 100%;
  }

  :deep(.el-form-item__content) {
    display: flex;
    align-items: center;
  }

  /* 多选下拉框标签样式优化 */
  :deep(.el-select .el-select__tags) {
    flex-wrap: wrap;
    max-height: 80px;
    overflow-y: auto;
    padding: 2px;
  }

  :deep(.el-tag) {
    margin: 2px;
  }
}

/* 样式设置相关样式优化 */
.style-form-item {
  :deep(.el-form-item__content) {
    height: 32px;
    display: flex;
    align-items: center;
  }

  :deep(.el-select) {
    width: 100px;
  }

  :deep(.el-radio-group) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  :deep(.el-radio) {
    display: flex;
    align-items: center;
    margin-right: 0;
    height: 32px;
  }

  :deep(.el-radio__label) {
    display: flex;
    align-items: center;
  }

  :deep(.el-color-picker) {
    margin: 0;
  }

  :deep(.el-color-picker__trigger) {
    width: 32px;
    height: 32px;
    padding: 4px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }
}

/* 调整样式容器 */
.style-switch-container {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 16px;
}

.style-input-container {
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  overflow: hidden;

  &.hidden {
    width: 0;
    opacity: 0;
    margin-left: 0;
  }

  :deep(.el-select),
  :deep(.el-color-picker) {
    width: 120px;
  }
}

/* 添加月视图日历样式 */
.month-view {
  .schedule-grid {
    width: 100%;
    table-layout: fixed;
    max-width: 100%;
  }

  .schedule-header {
    padding: 6px 4px;
    font-size: 0.85rem;
    border-width: v-bind('currentSchedule.style.borderWidth + "px"');
    border-style: solid;
  }

  .calendar-cell {
    height: 120px;
    padding: 8px;
    position: relative;
    vertical-align: top;
    border-width: v-bind('currentSchedule.style.borderWidth + "px"');
    border-style: solid;
  }

  .calendar-cell.bg-gray-50 {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .date-header {
    font-size: 0.8rem;
    text-align: right;
    padding-right: 2px;
  }

  .cell-content {
    width: 100%;
    height: calc(100% - 20px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 8px;
    margin-top: 20px;
    min-height: 80px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    &.selected {
      background-color: rgba(64, 158, 255, 0.1);
    }
  }

  .space-y-1 {
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .font-medium {
    padding: 0 4px;
    border-radius: 4px;
    transition: all 0.3s ease;
    text-align: center;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .image-error {
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
  }

  :deep(.cell-image) {
    max-height: 24px !important;
  }
}

/* 添加菜单按钮的响应式样式 */
.menu-button {
  display: none;
}

@media (max-width: 768px) {
  .menu-button {
    display: inline-flex;
  }
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 0 0 8px;
}

.zoom-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 36px;
  text-align: center;
  transition: color 0.3s ease;
  padding: 0;
  height: 28px;
  line-height: 28px;
}

.zoom-text:hover {
  color: var(--el-color-primary);
}

:deep(.el-button + .el-button) {
  margin-left: 10px !important;
}

.logo h1 {
  background: linear-gradient(45deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  color: transparent;
  position: relative;
  display: inline-block;
  padding: 0 2px;
  transition: all 0.3s ease;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.logo h1:hover {
  transform: scale(1.05);
  background: linear-gradient(45deg, #67C23A, #409EFF);
  -webkit-background-clip: text;
}

/* 添加模板描述 textarea 样式 */
.template-description :deep(.el-textarea__inner) {
  min-height: 50px !important;
  max-height: 100px !important;
  height: 50px;
  resize: vertical;
  overflow-y: auto;
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.2);
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.5);
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

/* 添加查看模板对话框样式 */
.view-template-content {
  padding: 10px;
}

.view-template-content h3 {
  color: var(--el-text-color-primary);
  font-size: 14px;
  margin-bottom: 8px;
}

.view-template-content p {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 添加预览表格样式 */
.preview-schedule-table {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  
  :deep(.el-card__body) {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .schedule-header,
  .schedule-cell {
    transition: all 0.3s ease;
  }

  .cell-content {
    min-height: 80px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    
    .font-medium {
      padding: 0 8px;
      border-radius: 4px;
      width: 100%;
      text-align: center;
      transition: all 0.3s ease;
    }
  }
}

/* 修改预览中的休息标记样式 */
.preview-schedule-table :deep(.rest-text) {
  background-color: rgba(var(--preview-theme-color-rgb), 0.5);
  border: 2px solid rgba(var(--preview-theme-color-rgb), 0.5);
  box-shadow: 0 0 0 2px rgba(var(--preview-theme-color-rgb), 0.5);
}

/* 添加预览对话框样式 */
.template-preview-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
    max-height: 80vh;
    overflow-y: auto;
  }
}

.margin-t-b-5 {
    margin-top: 5px;
    margin-bottom: 5px;
}

.schedule-content {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.schedule-table-container {
  width: 100%;
}

.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.schedule-header {
  padding: 12px;
  text-align: center;
}

.schedule-cell {
  height: 100px;
  padding: 8px;
  vertical-align: top;
  position: relative;
}

.calendar-cell {
  height: 120px;
}

.cell-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.date-header {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}

.slots-container {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-item {
  padding: 4px;
  border-radius: 4px;
}

.slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.other-month {
  background-color: var(--el-bg-color-page);
}

/* 添加按钮间距样式 */
:deep(.el-button + .el-button) {
  margin-left: 10px;
}

/* 添加选中和合并状态的样式 */
.cell-content.selected {
  background-color: rgba(64, 158, 255, 0.1);
}

.merged-main {
  position: relative;
}

.merged-main::after {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  pointer-events: none;
  z-index: 1;
}

.merged-hidden {
  border-color: transparent !important;
}

/* 添加右键菜单样式 */
.context-menu {
  min-width: 120px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

/* 两行布局特定样式 */
.schedule-grid[data-layout="double"] {
  .schedule-header {
    padding: 0.5rem; /* 减小表头内边距 */
  }
  
  .schedule-cell {
    height: 80px; /* 减小格子高度 */
    padding: 6px; /* 减小格子内边距 */
  }
  
  .cell-content {
    min-height: 60px; /* 减小内容最小高度 */
  }

  /* 两行布局时的logo位置 */
  .logo-container {
    bottom: -24px;
  }
}

/* 新增：Logo样式 */
.logo-container {
  position: absolute;
  right: -10px;
  bottom: -24px;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  transform: rotate(30deg); /* 添加30度旋转 */
}

.logo-image {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 50%;
}

.logo-text {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  transition: all 0.3s ease;
}

/* 调整单元格内容样式以适应Logo */
.cell-content {
  position: relative;
  padding: 8px;
  min-height: 80px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cell-content .space-y-1 {
  width: 100%;
  height: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
}

/* 新增：休息文本样式 */
.rest-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(var(--el-color-primary-rgb), 0.5);
  color: #fff;
  font-weight: bold;
  transform: rotate(30deg);
  position: relative;
  box-sizing: border-box;
  border: 2px solid rgba(var(--el-color-primary-rgb), 0.5);
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.5);
  width: v-bind('getRestTextWidth()');
  aspect-ratio: 1/1;
}

.rest-text::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  border: 5px solid #fff;
  pointer-events: none;
}

/* 修改休印样式 */
.preview-schedule-table :deep(.rest-text) {
  background-color: rgba(var(--preview-theme-color-rgb), 0.5);
  border: 2px solid rgba(var(--preview-theme-color-rgb), 0.5);
  box-shadow: 0 0 0 2px rgba(var(--preview-theme-color-rgb), 0.5);
}

/* 添加模板对话框样式 */
.template-dialog {
  :deep(.el-dialog__body) {
    height: 70vh;
    overflow-y: auto;
    padding: 20px;
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;
  }

  :deep(.el-table) {
    height: 100% !important;
  }
}

/* 添加成员管理对话框样式 */
.member-dialog {
  :deep(.el-dialog__body) {
    height: 70vh;
    overflow-y: auto;
    padding: 20px;
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;
  }

  :deep(.el-table) {
    height: 100% !important;
  }
}

/* 添加模板描述 textarea 样式 */
.template-description :deep(.el-textarea__inner) {
  min-height: 50px !important;
  max-height: 100px !important;
  height: 50px;
  resize: vertical;
  overflow-y: auto;
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.2);
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.5);
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

/* 新增：休息文本样式 */
.rest-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  background-color: rgba(var(--el-color-primary-rgb), 0.5);
  color: #fff;
  font-weight: bold;
  transform: rotate(30deg);
}

.streamers-logo-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.streamer-logo-item {
  display: inline-flex; /* 改为行内弹性盒子 */
  align-items: center;
  margin: 0 4px; /* 添加水平间距 */
}

.streamer-logo-item img,
.streamer-logo-item .streamer-logo-text {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 0; /* 移除底部边距 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.streamer-logo-item .text {
  font-size: 12px;
  color: #333;
}

/* 确保头像有固定宽度，不会被挤压 */
.flex.items-center.space-x-4 .el-avatar {
  flex-shrink: 0;
}

.color-form-item :deep(.el-form-item__content) {
  height: 32px;
  display: flex;
  align-items: center;
}

/* 添加成员表单输入控件宽度样式 */
.form-input-container {
  width: 100%;
}

.form-input-container :deep(.el-input),
.form-input-container :deep(.el-textarea) {
  width: 100%;
}

.grid-avatar-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  width: fit-content;
  margin: 0 auto;
}

.single-row-avatars {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: nowrap;
}

.multi-row-avatars {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  width: 100%;
}

.multi-row-avatars .el-avatar {
  margin: 1px;
  transform: scale(0.9);
}

/* 当包含rest-text时移除内边距 */
.schedule-cell:has(.rest-text) {
  padding: 0 !important;
}

.schedule-cell:has(.rest-text) .cell-content {
  padding: 0 !important;
}

.schedule-cell:has(.el-avatar--circle) {
  padding: 0 !important;

  :deep(.logo-container) {
    bottom: -8px;
    right: 6px;
  }
}

.schedule-cell:has(.el-avatar--circle) .cell-content {
  padding: 0 !important;
}

</style>
