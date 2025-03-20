<template>
  <a-layout class="article-container">
    <a-card title="心理文章" :bordered="false">
      <div class="filter-section">
        <a-select v-model:value="currentCategory" placeholder="选择文章分类" style="width: 200px"
          @change="handleCategoryChange">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
            {{ category.label }}
          </a-select-option>
        </a-select>
        <a-spin :spinning="isLoading" style="margin-left: 12px" />
      </div>

      <a-empty v-if="articles.length === 0 && !isLoading" description="暂无相关文章" style="margin-top: 20px" />
      <a-row v-else :gutter="[16, 16]" class="article-list">
        <a-col v-for="item in articles" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <a-card hoverable class="article-card" @click="showDetail(item)">
            <template #cover>
              <img :src="item.cover || 'https://picsum.photos/400/300?random=3'" alt="文章封面" class="article-cover" />
            </template>

            <a-card-meta :title="item.title">
              <template #description>
                <div class="article-meta">
                  <a-tag v-if="item.categorys && item.categorys.length > 0"
                    :color="getCategoryColor(item.categorys[0].value)">
                    {{ item.categorys[0].label }}
                  </a-tag>
                  <span class="read-count"> <eye-outlined /> {{ item.readCount || 0 }} </span>
                </div>
                <div class="summary">{{ item.description }}</div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <a-modal v-model:visible="previewVisible" :title="currentArticle?.title" width="800px" :footer="null">
      <div class="article-content" v-html="currentArticle?.content"></div>
    </a-modal>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { EyeOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getArticleList, getArticlesByCategory } from '@/api/article'

// 状态变量
const currentCategory = ref('all')
const isLoading = ref(false)
const articles = ref([])
const categoryOptions = ref([])
const previewVisible = ref(false)
const currentArticle = ref(null)

// 获取所有文章
const fetchArticleList = async () => {
  try {
    isLoading.value = true
    const response = await getArticleList()

    if (response.code === 200 && response.data) {
      articles.value = response.data

      // 提取分类选项
      categoryOptions.value = extractCategoryOptions(articles.value)
    } else {
      message.error(response.message || '获取文章列表失败')
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    message.error('获取文章列表失败')
  } finally {
    isLoading.value = false
  }
}

// 按分类获取文章
const fetchArticlesByCategory = async (categoryValue) => {
  if (!categoryValue || categoryValue === 'all') {
    return fetchArticleList()
  }

  try {
    isLoading.value = true
    const response = await getArticlesByCategory({ value: categoryValue })

    if (response.code === 200 && response.data) {
      articles.value = response.data
    } else {
      message.error(response.message || '获取分类文章失败')
    }
  } catch (error) {
    console.error('获取分类文章失败:', error)
    message.error('获取分类文章失败')
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
  fetchArticlesByCategory(value)
}

// 显示文章详情
const showDetail = (article) => {
  if (!article.readCount) article.readCount = 0
  article.readCount++
  currentArticle.value = article
  previewVisible.value = true
}

// 初始化
onMounted(() => {
  fetchArticleList()
})
</script>

<style scoped>
.article-container {
  padding: 24px;
  min-height: 80vh;
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.article-content {
  padding: 20px;
  line-height: 1.8;
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
  height: 100%;
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
