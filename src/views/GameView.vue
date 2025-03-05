<template>
  <a-layout class="game-container">
    <a-card title="游戏推荐" :bordered="false">
      <div class="filter-section">
        <a-select v-model:value="currentCategory" placeholder="选择情绪类型" style="width: 200px">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option value="positive">😊 积极情绪</a-select-option>
          <a-select-option value="negative">😟 非积极情绪</a-select-option>
        </a-select>
      </div>

      <a-empty
        v-if="filteredGames.length === 0"
        description="暂无相关游戏"
        style="margin-top: 20px"
      />
      <a-row v-else :gutter="[16, 16]" class="game-list">
        <a-col
          v-for="(item, index) in filteredGames"
          :key="index"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card hoverable class="game-card">
            <template #cover>
              <img :src="item.cover" class="game-cover" />
            </template>

            <a-card-meta :title="item.title">
              <template #description>
                <div class="game-meta">
                  <a-tag :color="getCategoryColor(item.category)">{{ item.category }}</a-tag>
                  <div class="game-description">{{ item.description }}</div>
                  <a-button 
                    type="primary" 
                    block
                    @click="handlePlay(item)"
                    class="play-button"
                  >
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
import { ref, computed } from 'vue';

const currentCategory = ref('all');

const gameList = ref([
  {
    title: '放松解压小游戏',
    category: 'positive',
    cover: 'https://picsum.photos/400/300?random=5',
    description: '通过简单操作缓解压力，适合焦虑时游玩',
    url: 'https://example.com/game1'
  },
  {
    title: '情绪宣泄挑战',
    category: 'negative',
    cover: 'https://picsum.photos/400/300?random=6',
    description: '帮助释放负面情绪的小游戏',
    url: 'https://example.com/game2'
  }
]);

const filteredGames = computed(() => {
  return gameList.value
    .filter(game => currentCategory.value === 'all' || game.category === currentCategory.value)
});

const handlePlay = (item) => {
  window.open(item.url, '_blank');
};

const getCategoryColor = (category) => {
  return category === 'positive' ? 'green' : 'volcano';
};
</script>

<style scoped>
.game-cover {
  height: 200px;
  object-fit: cover;
}

.game-meta {
  margin-top: 12px;
}

.game-description {
  margin: 8px 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-button {
  margin-top: 12px;
}

.filter-section {
  margin-bottom: 24px;
}
</style>