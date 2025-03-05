<template>
  <a-layout class="upload-container">
    <a-card title="打卡照片墙" :bordered="false">
      <div class="header-wrapper">
        <h2>打卡照片墙</h2>
        <a-button type="primary" @click="showUploadModal">
          <template #icon><upload-outlined /></template>
          上传照片
        </a-button>
      </div>

      <div class="photo-wall">
        <div 
          v-for="(photo, index) in photos"
          :key="index"
          class="photo-item"
          :style="{ 'aspect-ratio': photo.aspectRatio }"
        >
          <img 
            :src="photo.url" 
            alt="打卡照片"
            class="photo-image"
          />
        </div>
      </div>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue'
import { UploadOutlined } from '@ant-design/icons-vue'

const photos = ref([
  { url: 'https://picsum.photos/400/300?random=1', aspectRatio: '400/300' },
  { url: 'https://picsum.photos/500/400?random=2', aspectRatio: '500/400' },
  { url: 'https://picsum.photos/300/500?random=3', aspectRatio: '300/500' },
  { url: 'https://picsum.photos/450/300?random=4', aspectRatio: '450/300' },
  { url: 'https://picsum.photos/350/450?random=5', aspectRatio: '350/450' },
])

const showUploadModal = () => {
  // 上传逻辑
}
</script>

<style scoped>
.photo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.photo-item {
  break-inside: avoid;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
</style>