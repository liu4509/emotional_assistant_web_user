<template>
  <a-layout class="media-container">
    <a-card title="发现音乐" :bordered="false">
      <div class="filter-section">
        <!-- 分类选择器 -->
        <div class="selectors">
          <a-select v-model:value="currentCategory" placeholder="选择音乐分类" style="width: 200px; margin-right: 16px;"
            @change="handleCategoryChange">
            <a-select-option value="">全部分类</a-select-option>
            <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
              {{ category.label }}
            </a-select-option>
          </a-select>

          <a-select v-model:value="currentMood" placeholder="选择当前心情" style="width: 200px">
            <a-select-option value="happy">😊 快乐</a-select-option>
            <a-select-option value="anxious">😟 焦虑</a-select-option>
            <a-select-option value="sad">😢 悲伤</a-select-option>
          </a-select>
        </div>

        <!-- 加载状态 -->
        <a-spin :spinning="isLoading" />
      </div>

      <a-row :gutter="[16, 16]" class="music-list">
        <a-col v-for="(item, index) in filteredMusic" :key="index" :xs="24" :sm="12" :md="8" :lg="6">
          <a-card hoverable class="music-card">
            <div class="album-cover-container">
              <img :src="item.cover" class="album-cover" :class="{ 'rotating': isCurrentlyPlaying(item) }"
                :style="getRotationStyle(item)" />
              <div class="play-overlay" @click="handlePlay(item)">
                <pause-circle-outlined v-if="isCurrentlyPlaying(item)" class="play-icon" />
                <play-circle-outlined v-else class="play-icon" />
              </div>
            </div>

            <div class="music-info">
              <div class="music-title">{{ item.title }}</div>
              <div class="music-artist">{{ item.artist || '未知艺术家' }}</div>

              <div class="music-controls" v-if="isCurrentlyPlaying(item) || isPaused(item)">
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: `${progressPercentage}%` }"></div>
                </div>
                <div class="time-display">
                  <span class="current-time">{{ formatTime(currentTime) }}</span>
                  <span class="total-time">{{ formatTime(duration) }}</span>
                </div>
              </div>

              <div class="music-tags">
                <a-tag v-for="category in item.categorys" :key="category.id" :color="getCategoryColor(category.value)">
                  {{ category.label }}
                </a-tag>
                <span class="play-count">
                  <sound-outlined /> {{ item.duration ? formatTime(item.duration) : '00:00' }}
                </span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 空数据提示 -->
      <a-empty v-if="filteredMusic.length === 0 && !isLoading" description="没有找到符合条件的音乐" />

      <!-- 隐藏的音频播放器 -->
      <audio ref="audioPlayer" :src="currentlyPlaying?.url" @timeupdate="updateProgress" @loadedmetadata="setDuration"
        @ended="handleEnded"></audio>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getMediaList, getMediasByCategory } from '@/api/media'

// 状态变量
const currentMood = ref('happy')
const currentCategory = ref('')
const currentlyPlaying = ref(null)
const isPlaying = ref(false)
const audioPlayer = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const progressPercentage = ref(0)
const isLoading = ref(false)
const rotationAngles = ref({}) // 存储每个音乐项目的旋转角度
const lastPlayingItem = ref(null) // 记录最后播放的项目

// 音频数据
const musicList = ref([])
const categoryOptions = ref([])

// 获取所有唯一的分类选项
const extractCategoryOptions = (list) => {
  const categories = new Map()

  list.forEach(item => {
    if (item.categorys && item.categorys.length > 0) {
      item.categorys.forEach(category => {
        categories.set(category.value, {
          value: category.value,
          label: category.label
        })
      })
    }
  })

  return Array.from(categories.values())
}

// 根据分类获取颜色
const getCategoryColor = (categoryValue) => {
  const colorMap = {
    'very_positive': '#52c41a',  // 绿色
    'positive': '#1890ff',       // 蓝色
    'neutral': '#faad14',        // 黄色
    'negative': '#fa8c16',       // 橙色
    'very_negative': '#f5222d',  // 红色
  }
  return colorMap[categoryValue] || '#d9d9d9'
}

// 根据心情获取颜色
const getMoodColor = (mood) => {
  const colors = {
    happy: 'green',
    anxious: 'orange',
    sad: 'blue'
  }
  return colors[mood] || 'default'
}

// 获取音频数据
const fetchMediaList = async () => {
  try {
    isLoading.value = true
    const response = await getMediaList()

    if (response.code === 200 && response.data) {
      musicList.value = response.data

      // 初始化每个音乐项的旋转角度
      musicList.value.forEach(item => {
        if (!rotationAngles.value[item.id]) {
          rotationAngles.value[item.id] = 0
        }
      })

      // 提取分类选项
      categoryOptions.value = extractCategoryOptions(musicList.value)
    } else {
      message.error(response.message || '获取音频列表失败')
    }
  } catch (error) {
    console.error('获取音频列表失败:', error)
    message.error('获取音频列表失败')
  } finally {
    isLoading.value = false
  }
}

// 按分类获取音频
const fetchMediaByCategory = async (categoryValue) => {
  if (!categoryValue) {
    return fetchMediaList()
  }

  try {
    isLoading.value = true
    const response = await getMediasByCategory({ value: categoryValue })

    if (response.code === 200 && response.data) {
      musicList.value = response.data

      // 初始化每个音乐项的旋转角度
      musicList.value.forEach(item => {
        if (!rotationAngles.value[item.id]) {
          rotationAngles.value[item.id] = 0
        }
      })
    } else {
      message.error(response.message || '获取分类音频失败')
    }
  } catch (error) {
    console.error('获取分类音频失败:', error)
    message.error('获取分类音频失败')
  } finally {
    isLoading.value = false
  }
}

// 处理分类变化
const handleCategoryChange = (value) => {
  fetchMediaByCategory(value)
}

// 过滤音频列表
const filteredMusic = computed(() => {
  return [...musicList.value]
    .sort((a, b) => {
      // 根据当前心情和播放量综合排序
      const moodScoreA = a.mood === currentMood.value ? 2 : 0
      const moodScoreB = b.mood === currentMood.value ? 2 : 0
      return (b.moodScore + moodScoreB) - (a.moodScore + moodScoreA)
    })
})

// 更新旋转角度
const updateRotationAngle = () => {
  if (!currentlyPlaying.value || !isPlaying.value) return;

  // 计算当前旋转角度 - 基于已播放时间百分比
  if (duration.value > 0) {
    const playedPercent = (currentTime.value / duration.value);
    // 为了视觉效果，让一首歌在播放过程中旋转多圈
    const fullRotations = Math.floor(playedPercent * 5); // 假设一首歌旋转5圈
    const currentDegrees = (playedPercent * 5 * 360) % 360;

    rotationAngles.value[currentlyPlaying.value.id] = currentDegrees;
  }
}

// 定时更新旋转角度
let rotationTimer;
onMounted(() => {
  rotationTimer = setInterval(updateRotationAngle, 100); // 每100ms更新一次角度
})

onUnmounted(() => {
  clearInterval(rotationTimer);
})

// 获取旋转样式
const getRotationStyle = (item) => {
  if (isCurrentlyPlaying(item)) {
    // 正在播放，使用CSS动画
    return {};
  } else if (isPaused(item)) {
    // 暂停状态，应用当前角度
    const angle = rotationAngles.value[item.id] || 0;
    return { transform: `rotate(${angle}deg)` };
  }
  return {};
}

// 判断是否是暂停状态的项目
const isPaused = (item) => {
  return !isPlaying.value &&
    currentlyPlaying.value &&
    currentlyPlaying.value.id === item.id;
}

// 播放控制
const handlePlay = (item) => {
  if (isCurrentlyPlaying(item)) {
    // 如果点击当前正在播放的歌曲，则暂停
    togglePlayPause()
  } else if (isPaused(item)) {
    // 如果是暂停的歌曲，则继续播放
    togglePlayPause()
  } else {
    // 播放新的歌曲
    if (currentlyPlaying.value) {
      lastPlayingItem.value = currentlyPlaying.value;
    }
    currentlyPlaying.value = item

    // 初始化角度（如果是新歌曲）
    if (rotationAngles.value[item.id] === undefined) {
      rotationAngles.value[item.id] = 0;
    }

    // 需要等待DOM更新后再播放
    setTimeout(() => {
      isPlaying.value = true
      audioPlayer.value.play().catch(err => {
        console.error('播放失败:', err)
        message.error('播放失败，请稍后重试')
        isPlaying.value = false
      })
    }, 50)
  }
}

const togglePlayPause = () => {
  if (isPlaying.value) {
    audioPlayer.value.pause()
    // 暂停时记录当前角度
    updateRotationAngle();
  } else {
    audioPlayer.value.play().catch(err => {
      console.error('播放失败:', err)
      message.error('播放失败，请稍后重试')
    })
  }
  isPlaying.value = !isPlaying.value
}

const isCurrentlyPlaying = (item) => {
  return currentlyPlaying.value &&
    currentlyPlaying.value.id === item.id &&
    isPlaying.value;
}

const updateProgress = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
    progressPercentage.value = (currentTime.value / duration.value) * 100
  }
}

const setDuration = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration
  }
}

const handleEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  progressPercentage.value = 0
}

const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 在组件挂载时获取音频数据
onMounted(() => {
  fetchMediaList()
})

// 组件卸载时停止音频播放
onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.src = ''
  }
})
</script>

<style scoped>
.media-container {
  padding: 24px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.selectors {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.music-list {
  margin-top: 24px;
}

.music-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.music-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.album-cover-container {
  position: relative;
  padding-top: 100%;
  /* 1:1 比例，正方形 */
  overflow: hidden;
  border-radius: 4px;
}

.album-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transition: all 0.3s;
}

.rotating {
  animation: rotate 15s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 50%;
}

.album-cover-container:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.9);
}

.music-info {
  padding: 12px 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.music-title {
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-artist {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.music-controls {
  margin: 8px 0;
}

.progress-bar-container {
  height: 4px;
  background-color: #e5e5e5;
  border-radius: 2px;
  margin-bottom: 4px;
}

.progress-bar {
  height: 100%;
  background-color: #1890ff;
  border-radius: 2px;
  transition: width 0.1s;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.music-tags {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  flex-wrap: wrap;
}

.play-count {
  font-size: 12px;
  color: #999;
}
</style>
