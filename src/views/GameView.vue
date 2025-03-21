<template>
  <a-layout class="game-container">
    <a-card title="游戏推荐" :bordered="false">
      <div class="filter-section">
        <a-select v-model:value="currentCategory" placeholder="选择情绪类型" style="width: 200px"
          @change="handleCategoryChange">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
            {{ category.label }}
          </a-select-option>
        </a-select>
        <a-spin :spinning="isLoading" style="margin-left: 12px" />
      </div>

      <a-empty v-if="games.length === 0 && !isLoading" description="暂无相关游戏" style="margin-top: 20px" />
      <a-row v-else :gutter="[16, 16]" class="game-list">
        <a-col v-for="item in games" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <a-card hoverable class="game-card">
            <template #cover>
              <div class="cover-container">
                <img :src="item.image" class="game-cover" />
              </div>
            </template>

            <a-card-meta :title="item.title">
              <template #description>
                <div class="game-meta">
                  <a-tag v-if="item.categorys && item.categorys.length > 0"
                    :color="getCategoryColor(item.categorys[0].value)">
                    {{ item.categorys[0].label }}
                  </a-tag>
                  <div class="game-description">{{ item.description }}</div>
                  <a-button type="primary" block @click="handlePlay(item)" class="play-button">
                    <template #icon><play-circle-outlined /></template>
                    立即体验
                  </a-button>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { PlayCircleOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getGameList, getGamesByCategory } from '@/api/game';
import { useRoute } from 'vue-router';

// 获取路由对象
const route = useRoute();

// 情绪状态与分类值的映射
const emotionCategoryMap = {
  'veryPositive': 'very_positive',
  'positive': 'positive',
  'neutral': 'neutral',
  'negative': 'negative',
  'veryNegative': 'very_negative'
};

// 状态变量
const currentCategory = ref('all');
const isLoading = ref(false);
const games = ref([]);
const categoryOptions = ref([]);

// 获取所有游戏
const fetchGameList = async () => {
  try {
    isLoading.value = true;
    const response = await getGameList();

    if (response.code === 200 && response.data) {
      games.value = response.data;

      // 提取分类选项
      categoryOptions.value = extractCategoryOptions(games.value);
    } else {
      message.error(response.message || '获取游戏列表失败');
    }
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    message.error('获取游戏列表失败');
  } finally {
    isLoading.value = false;
  }
};

// 按分类获取游戏
const fetchGamesByCategory = async (categoryValue) => {
  if (!categoryValue || categoryValue === 'all') {
    return fetchGameList();
  }

  try {
    isLoading.value = true;
    const response = await getGamesByCategory({ value: categoryValue });

    if (response.code === 200 && response.data) {
      games.value = response.data;
    } else {
      message.error(response.message || '获取分类游戏失败');
    }
  } catch (error) {
    console.error('获取分类游戏失败:', error);
    message.error('获取分类游戏失败');
  } finally {
    isLoading.value = false;
  }
};

// 获取所有唯一的分类选项
const extractCategoryOptions = (list) => {
  const categories = new Map();

  list.forEach(item => {
    if (item.categorys && item.categorys.length > 0) {
      item.categorys.forEach(category => {
        categories.set(category.value, {
          value: category.value,
          label: category.label
        });
      });
    }
  });

  return Array.from(categories.values());
};

// 根据分类获取颜色
const getCategoryColor = (categoryValue) => {
  const colorMap = {
    'very_positive': '#52c41a',  // 绿色
    'positive': '#1890ff',       // 蓝色
    'neutral': '#faad14',        // 黄色
    'negative': '#fa8c16',       // 橙色
    'very_negative': '#f5222d',  // 红色
  };
  return colorMap[categoryValue] || '#d9d9d9';
};

// 处理分类变化
const handleCategoryChange = (value) => {
  fetchGamesByCategory(value);
};

// 打开游戏
const handlePlay = (item) => {
  window.open(item.url, '_blank');
};

// 初始化
onMounted(() => {
  fetchGameList().then(() => {
    // 获取URL中的情绪参数并映射到对应的分类
    const emotionParam = route.query.emotion;
    if (emotionParam && emotionCategoryMap[emotionParam]) {
      // 获取映射后的分类值
      const categoryValue = emotionCategoryMap[emotionParam];

      // 检查该分类是否存在于选项中
      const categoryExists = categoryOptions.value.some(cat => cat.value === categoryValue);

      if (categoryExists) {
        // 设置当前分类并加载对应的游戏
        currentCategory.value = categoryValue;
        fetchGamesByCategory(categoryValue);
      }
    }
  });
});
</script>

<style scoped>
.game-container {
  padding: 24px;
  min-height: 80vh;
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.game-list {
  margin-top: 24px;
}

.game-card {
  transition: all 0.3s ease;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.game-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.cover-container {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.game-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  transition: all 0.4s ease;
}

.game-card:hover .game-cover {
  transform: scale(1.05);
}

.game-meta {
  margin-top: 12px;
}

.game-description {
  margin: 8px 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 1.5;
  height: 63px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.play-button {
  margin-top: 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.play-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
