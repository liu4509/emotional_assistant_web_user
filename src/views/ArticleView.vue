<template>
  <a-layout class="article-container">
    <a-card title="心理文章" :bordered="false">
      <div class="filter-section">
        <a-select v-model:value="currentCategory" placeholder="选择文章分类" style="width: 200px">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option value="情绪管理">情绪管理</a-select-option>
          <a-select-option value="压力应对">压力应对</a-select-option>
          <a-select-option value="人际关系">人际关系</a-select-option>
        </a-select>
      </div>

      <a-empty
        v-if="filteredArticles.length === 0"
        description="暂无相关文章"
        style="margin-top: 20px"
      />
      <a-row v-else :gutter="[16, 16]" class="article-list">
        <a-col
          v-for="(item, index) in filteredArticles"
          :key="index"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card hoverable class="article-card" @click="showDetail(item)">
            <template #cover>
              <img src="https://picsum.photos/400/300?random=3" class="article-cover" />
            </template>

            <a-card-meta :title="item.title">
              <template #description>
                <div class="article-meta">
                  <a-tag :color="getCategoryColor(item.category)">{{ item.category }}</a-tag>
                  <span class="read-count"> <eye-outlined /> {{ item.readCount }} </span>
                </div>
                <div class="summary">{{ item.summary }}</div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <a-modal
      v-model:visible="previewVisible"
      :title="currentArticle?.title"
      width="800px"
      :footer="null"
    >
      <div class="article-content" v-html="currentArticle?.content"></div>
    </a-modal>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
const currentCategory = ref('all')

const articles = ref([
  {
    title: '情绪调节的五种方法',
    category: '情绪管理',
    readCount: 1560,
    summary: '详细介绍深呼吸、正念冥想、运动疗法等实用情绪调节技巧...',
    content: '## 深呼吸技巧\n\n1. 腹式呼吸法...\n## 正念冥想\n\n每天10分钟练习...',
  },
])

const previewVisible = ref(false)
const currentArticle = ref(null)

const filteredArticles = computed(() => {
  return articles.value
    .filter(
      (article) => currentCategory.value === 'all' || article.category === currentCategory.value,
    )
    .sort((a, b) => b.readCount - a.readCount)
})

const getCategoryColor = (category) => {
  const colors = {
    情绪管理: 'green',
    压力应对: 'orange',
    人际关系: 'blue',
  }
  return colors[category] || 'default'
}

const showDetail = (article) => {
  article.readCount++
  currentArticle.value = article
  previewVisible.value = true
}
</script>

<style scoped>
.article-container {
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

.article-list {
  margin-top: 24px;
}

.article-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.article-card {
  transition: transform 0.3s;
}

.article-card:hover {
  transform: translateY(-4px);
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.summary {
  color: #666;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
