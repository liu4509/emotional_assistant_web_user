<template>
  <a-layout class="travel-container">
    <a-card title="推荐景点" :bordered="false">
      <a-list :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }" :data-source="sortedAttractions">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card hoverable>
              <template #cover>
                <img
                  :src="item.image"
                  alt="景点图片"
                  style="width: 100%; height: 200px; object-fit: cover"
                />
              </template>
              <a-card-meta :title="item.name">
                <template #description>
                  <div class="attraction-info">
                    <div class="description">{{ item.description }}</div>
                    <div class="rating">
                      <star-outlined />
                      {{ item.rating.toFixed(1) }}
                    </div>
                    <div class="tags">
                      <a-tag v-for="(tag, index) in item.tags" :key="index" color="blue">
                        {{ tag }}
                      </a-tag>
                    </div>
                  </div>
                </template>
              </a-card-meta>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { StarOutlined, PlusOutlined } from '@ant-design/icons-vue'

// 模拟景点数据
const attractions = ref([
  {
    name: '西湖风景区',
    description: '中国首批国家重点风景名胜区，四季景色各异',
    image: 'https://cdn.example.com/scene1.jpg',
    rating: 4.8,
    tags: ['自然景观', '放松心情'],
  },
  {
    name: '故宫博物院',
    description: '世界文化遗产，明清皇家宫殿建筑群',
    image: 'https://cdn.example.com/scene2.jpg',
    rating: 4.7,
    tags: ['历史文化', '人文景观'],
  },
])

// 排序逻辑（后续接入问卷数据）
const sortedAttractions = computed(() => {
  return [...attractions.value].sort((a, b) => b.rating - a.rating)
})

// 上传相关逻辑
const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    alert('仅支持图片格式文件!')
    return false
  }
  return true
}

const handlePreview = async (file) => {
  previewImage.value = file.url || file.thumbUrl
  previewVisible.value = true
}
</script>

<style scoped>
.travel-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.ant-card {
  margin-bottom: 16px;
}

.attraction-info {
  padding: 8px 0;
}

.rating {
  color: #faad14;
  font-weight: 500;
  margin: 8px 0;
}

.tags {
  margin-top: 8px;
}

.description {
  color: #666;
  font-size: 13px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
