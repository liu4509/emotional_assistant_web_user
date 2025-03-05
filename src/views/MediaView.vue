<template>
  <a-layout class="media-container">
    <a-card title="推荐内容" :bordered="false">
      <div class="filter-section">
        <a-select
          v-model:value="currentMood"
          placeholder="选择当前心情"
          style="width: 200px"
        >
          <a-select-option value="happy">😊 快乐</a-select-option>
          <a-select-option value="anxious">😟 焦虑</a-select-option>
          <a-select-option value="sad">😢 悲伤</a-select-option>
        </a-select>
      </div>

      <a-row :gutter="[16, 16]" class="media-list">
        <a-col
          v-for="(item, index) in sortedMedia"
          :key="index"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card hoverable class="media-card">
            <template #cover>
              <img :src="item.cover" class="media-cover" />
              <div class="play-overlay" @click="handlePlay(item)">
                <play-circle-outlined class="play-icon" />
              </div>
            </template>
            
            <a-card-meta :title="item.title">
              <template #description>
                <div class="media-meta">
                  <a-tag :color="getMoodColor(item.mood)">{{ item.mood }}</a-tag>
                  <span class="play-count">
                    <eye-outlined /> {{ item.playCount }}
                  </span>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>

      <a-modal
        v-model:visible="previewVisible"
        :title="currentMedia?.title"
        width="800px"
        :footer="null"
      >
        <div class="media-preview">
          <video
            v-if="currentMedia?.type === 'video'"
            :src="currentMedia?.url"
            controls
            class="preview-player"
          />
          <audio
            v-else
            :src="currentMedia?.url"
            controls
            class="preview-player"
          />
        </div>
      </a-modal>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  PlayCircleOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'

const currentMood = ref('happy')
const previewVisible = ref(false)
const currentMedia = ref(null)

const mediaList = ref([
  {
    type: 'music',
    title: '放松钢琴曲',
    cover: 'https://picsum.photos/400/300?random=1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    mood: 'anxious',
    playCount: 245
  },
  {
    type: 'video',
    title: '趣味科普视频',
    cover: 'https://picsum.photos/400/300?random=2',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mood: 'happy',
    playCount: 189
  }
])

const sortedMedia = computed(() => {
  return [...mediaList.value].sort((a, b) => {
    // 根据当前心情和播放量综合排序
    const moodScoreA = a.mood === currentMood.value ? 2 : 0
    const moodScoreB = b.mood === currentMood.value ? 2 : 0
    return (b.playCount + moodScoreB) - (a.playCount + moodScoreA)
  })
})

const getMoodColor = (mood) => {
  const colors = {
    happy: 'green',
    anxious: 'orange',
    sad: 'blue'
  }
  return colors[mood] || 'default'
}

const handlePlay = (item) => {
  currentMedia.value = item
  previewVisible.value = true
}
</script>

<style scoped>
.media-container {
  padding: 24px;
}

.media-list {
  margin-top: 24px;
}

.media-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
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
}

.media-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.8);
}

.media-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.preview-player {
  width: 100%;
  max-height: 70vh;
}
</style>
