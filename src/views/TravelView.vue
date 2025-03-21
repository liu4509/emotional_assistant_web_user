<template>
  <a-layout class="travel-container">
    <a-card title="推荐景点" :bordered="false">
      <!-- 分类选择器 -->
      <div class="filter-section">
        <div class="selectors">
          <a-select v-model:value="currentCategory" placeholder="选择景点分类" style="width: 200px; margin-right: 16px;"
            @change="handleCategoryChange">
            <a-select-option value="">全部分类</a-select-option>
            <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
              {{ category.label }}
            </a-select-option>
          </a-select>
        </div>

        <!-- 加载状态 -->
        <a-spin :spinning="isLoading" />
      </div>

      <!-- 景点列表 -->
      <a-list :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }" :data-source="sortedAttractions" :loading="isLoading">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card hoverable>
              <template #cover>
                <img :src="item.image" :alt="item.title" style="width: 100%; height: 200px; object-fit: cover" />
              </template>
              <a-card-meta :title="item.title">
                <template #description>
                  <div class="attraction-info">
                    <div class="description">{{ item.details }}</div>
                    <div class="tags">
                      <a-tag v-for="category in item.categorys" :key="category.id"
                        :color="getCategoryColor(category.value)">
                        {{ category.label }}
                      </a-tag>
                    </div>
                  </div>
                </template>
              </a-card-meta>
            </a-card>
          </a-list-item>
        </template>
      </a-list>

      <!-- 空数据提示 -->
      <a-empty v-if="sortedAttractions.length === 0 && !isLoading" description="没有找到符合条件的景点" />
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LoadingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getAttractionList, getAttractionsByCategory } from '@/api/attraction'
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
const currentCategory = ref('')
const isLoading = ref(false)

// 景点数据
const attractions = ref([])
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

// 排序逻辑
const sortedAttractions = computed(() => {
  return [...attractions.value].sort((a, b) => {
    // 按分类、id逆序排列（较新的排前面）
    if (currentCategory.value) {
      const aHasCategory = a.categorys && a.categorys.some(c => c.value === currentCategory.value)
      const bHasCategory = b.categorys && b.categorys.some(c => c.value === currentCategory.value)

      if (aHasCategory && !bHasCategory) return -1
      if (!aHasCategory && bHasCategory) return 1
    }

    // ID逆序（新内容优先）
    return b.id - a.id
  })
})

// 获取所有景点数据
const fetchAttractionList = async () => {
  try {
    isLoading.value = true
    const response = await getAttractionList()

    if (response.code === 200 && response.data) {
      attractions.value = response.data

      // 提取分类选项
      categoryOptions.value = extractCategoryOptions(attractions.value)
    } else {
      message.error(response.message || '获取景点列表失败')
    }
  } catch (error) {
    console.error('获取景点列表失败:', error)
    message.error('获取景点列表失败')
  } finally {
    isLoading.value = false
  }
}

// 按分类获取景点
const fetchAttractionsByCategory = async (categoryValue) => {
  if (!categoryValue) {
    return fetchAttractionList()
  }

  try {
    isLoading.value = true
    const response = await getAttractionsByCategory({ value: categoryValue })

    if (response.code === 200 && response.data) {
      attractions.value = response.data
    } else {
      message.error(response.message || '获取分类景点失败')
    }
  } catch (error) {
    console.error('获取分类景点失败:', error)
    message.error('获取分类景点失败')
  } finally {
    isLoading.value = false
  }
}

// 处理分类变化
const handleCategoryChange = (value) => {
  fetchAttractionsByCategory(value)
}

// 在组件挂载时获取数据
onMounted(() => {
  fetchAttractionList().then(() => {
    // 获取URL中的情绪参数并映射到对应的分类
    const emotionParam = route.query.emotion
    if (emotionParam && emotionCategoryMap[emotionParam]) {
      // 获取映射后的分类值
      const categoryValue = emotionCategoryMap[emotionParam]

      // 检查该分类是否存在于选项中
      const categoryExists = categoryOptions.value.some(cat => cat.value === categoryValue)

      if (categoryExists) {
        // 设置当前分类并加载对应的景点
        currentCategory.value = categoryValue
        fetchAttractionsByCategory(categoryValue)
      }
    }
  })
})
</script>

<style scoped>
.travel-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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

.ant-card {
  margin-bottom: 16px;
  width: 100%;
}

.ant-list-item {
  display: flex;
  justify-content: center;
}

.ant-list-item .ant-card {
  width: 250px;
  max-width: 100%;
}

.ant-card-cover img {
  height: 160px !important;
  object-fit: cover;
}

.attraction-info {
  max-height: 100px;
  padding: 8px 0;
}

.tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.description {
  color: #666;
  font-size: 13px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
