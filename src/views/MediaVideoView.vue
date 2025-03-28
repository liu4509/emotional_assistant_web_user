<template>
  <a-layout class="media-container">
    <a-card title="发现视频" :bordered="false">
      <div class="filter-section">
        <a-select v-model:value="currentCategory" placeholder="选择视频分类" style="width: 200px"
          @change="handleCategoryChange">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
            {{ category.label }}
          </a-select-option>
        </a-select>
        <a-spin :spinning="isLoading" style="margin-left: 12px" />
      </div>

      <a-empty v-if="videos.length === 0 && !isLoading" description="暂无相关视频" style="margin-top: 20px" />
      <a-row v-else :gutter="[16, 16]" class="media-list">
        <a-col v-for="item in videos" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <a-card hoverable class="media-card">
            <template #cover>
              <div class="cover-container">
                <img :src="item.cover" class="media-cover" />
                <div class="play-overlay" @click="handlePlay(item)">
                  <play-circle-outlined class="play-icon" />
                </div>
              </div>
            </template>

            <a-card-meta :title="item.title">
              <template #description>
                <div class="media-meta">
                  <a-tag v-if="item.categorys && item.categorys.length > 0"
                    :color="getCategoryColor(item.categorys[0].value)">
                    {{ item.categorys[0].label }}
                  </a-tag>
                  <span class="play-count">
                    <eye-outlined /> {{ item.playCount || 0 }}
                  </span>
                </div>
                <div class="summary">{{ item.description }}</div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>

      <a-modal v-model:visible="previewVisible" :title="currentMedia?.title" width="800px" :footer="null">
        <div class="media-preview">
          <video :src="currentMedia?.url" controls class="preview-player" />
        </div>
      </a-modal>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlayCircleOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getVideoList, getVideosByCategory } from '@/api/video'
import { useRoute } from 'vue-router'

// 获取路由对象
const route = useRoute()

// 情绪状态与分类值的映射
const emotionCategoryMap = {
  'veryPositive': 'very_positive',
  'positive': 'positive',
  'neutral': 'neutral',
  'negative': 'negative',
  'veryNegative': 'very_negative'
}

// 状态变量
const currentCategory = ref('all')
const previewVisible = ref(false)
const currentMedia = ref(null)
const videos = ref([])
const isLoading = ref(false)
const categoryOptions = ref([])

// 获取所有视频
const fetchVideoList = async () => {
  try {
    isLoading.value = true
    const response = await getVideoList()

    if (response.code === 200 && response.data) {
      videos.value = response.data.article

      // 提取分类选项
      categoryOptions.value = extractCategoryOptions(videos.value)
    } else {
      message.error(response.message || '获取视频列表失败')
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
    message.error('获取视频列表失败')
  } finally {
    isLoading.value = false
  }
}

// 按分类获取视频
const fetchVideosByCategory = async (categoryValue) => {
  if (!categoryValue || categoryValue === 'all') {
    return fetchVideoList()
  }

  try {
    isLoading.value = true
    const response = await getVideosByCategory({ value: categoryValue })

    if (response.code === 200 && response.data) {
      videos.value = response.data
    } else {
      message.error(response.message || '获取分类视频失败')
    }
  } catch (error) {
    console.error('获取分类视频失败:', error)
    message.error('获取分类视频失败')
  } finally {
    isLoading.value = false
  }
}

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

// 处理分类变化
const handleCategoryChange = (value) => {
  fetchVideosByCategory(value)
}

// 处理播放
const handlePlay = (item) => {
  if (!item.playCount) item.playCount = 0
  item.playCount++
  currentMedia.value = item
  previewVisible.value = true
}

// 初始化
onMounted(() => {
  fetchVideoList().then(() => {
    // 获取URL中的情绪参数并映射到对应的分类
    const emotionParam = route.query.emotion
    if (emotionParam && emotionCategoryMap[emotionParam]) {
      // 获取映射后的分类值
      const categoryValue = emotionCategoryMap[emotionParam]

      // 检查该分类是否存在于选项中
      const categoryExists = categoryOptions.value.some(cat => cat.value === categoryValue)

      if (categoryExists) {
        // 设置当前分类并加载对应的视频
        currentCategory.value = categoryValue
        fetchVideosByCategory(categoryValue)
      }
    }
  })
})
</script>

<style scoped>
.media-container {
  padding: 24px;
  min-height: 80vh;
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.media-list {
  margin-top: 24px;
}

.media-card {
  transition: all 0.3s ease;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.media-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.cover-container {
  position: relative;
  width: 100%;
  height: 180px;
}

.media-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  transition: all 0.4s ease;
}

.media-card:hover .media-cover {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
}

.media-card:hover .play-overlay {
  opacity: 1;
  background: rgba(0, 0, 0, 0.5);
}

.play-icon {
  font-size: 56px;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.2s ease;
}

.play-icon:hover {
  transform: scale(1.1);
  color: #ffffff;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 0 4px;
}

.summary {
  color: #666;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
  padding: 0 4px;
}

.preview-player {
  width: 100%;
  max-height: 70vh;
  border-radius: 8px;
}
</style>
