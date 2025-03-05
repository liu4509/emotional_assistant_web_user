<template>
  <a-layout class="video-container">
    <a-card title="心理视频" :bordered="false">
      <div class="filter-section">
        <a-select v-model:value="currentCategory" placeholder="选择视频分类" style="width: 200px">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option value="情绪管理">情绪管理</a-select-option>
          <a-select-option value="压力应对">压力应对</a-select-option>
          <a-select-option value="人际关系">人际关系</a-select-option>
        </a-select>
      </div>
      <a-empty
        v-if="filteredVideos.length === 0"
        description="暂无相关文章"
        style="margin-top: 20px"
      />
      <a-row v-else :gutter="[16, 16]" class="video-list">
        <a-col
          v-for="(item, index) in filteredVideos"
          :key="index"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card hoverable class="video-card" @click="handlePlay(item)">
            <template #cover>
              <img :src="item.cover" class="video-cover" />
              <div class="play-overlay">
                <play-circle-outlined class="play-icon" />
              </div>
            </template>

            <a-card-meta :title="item.title">
              <template #description>
                <div class="video-meta">
                  <a-tag :color="getCategoryColor(item.category)">{{ item.category }}</a-tag>
                  <span class="play-count"> <eye-outlined /> {{ item.playCount }} </span>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>

      <a-modal
        v-model:visible="previewVisible"
        :title="currentVideo?.title"
        width="800px"
        :footer="null"
      >
        <video :src="currentVideo?.url" controls class="preview-player" />
      </a-modal>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
const previewVisible = ref(false)
const currentVideo = ref(null)

const videoList = ref([
  {
    title: '情绪管理技巧',
    category: '情绪管理',
    cover: 'https://picsum.photos/400/300?random=4',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    playCount: 345,
  },
])
const currentCategory = ref('all')

const filteredVideos = computed(() => {
  return videoList.value
    .filter((video) => currentCategory.value === 'all' || video.category === currentCategory.value)
    .sort((a, b) => b.playCount - a.playCount)
})

const handlePlay = (item) => {
  item.playCount++
  currentVideo.value = item
  previewVisible.value = true
}

// 新增分类颜色匹配
const getCategoryColor = (category) => {
  const colors = {
    情绪管理: 'green',
    压力应对: 'orange',
    人际关系: 'blue',
  }
  return colors[category] || 'default'
}
</script>

<style scoped>
.video-container {
  padding: 24px;
  min-height: 80vh;
}

.article-content {
  padding: 20px;
  line-height: 1.8;

  h2 {
    color: #1890ff;
    margin: 16px 0;
  }

  p {
    margin: 8px 0;
  }
}

.video-list {
  margin-top: 24px;
}

.video-cover {
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

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.8);
}

.video-meta {
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
