<template>
  <a-layout class="upload-container">
    <a-card title="打卡照片墙" :bordered="false">
      <div class="header-wrapper">
        <div class="title-filter">
          <h2>打卡照片墙</h2>
          <!-- 分类选择器 -->
          <div class="filter-section">
            <a-select v-model:value="currentCategory" placeholder="选择情绪分类" style="width: 180px;"
              @change="handleCategoryChange">
              <a-select-option value="">全部分类</a-select-option>
              <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                {{ category.label }}
              </a-select-option>
            </a-select>
            <!-- 加载状态 -->
            <a-spin :spinning="isLoading" style="margin-left: 12px" />
          </div>
        </div>
        <a-button type="primary" @click="showUploadModal">
          <template #icon><upload-outlined /></template>
          上传照片
        </a-button>
      </div>

      <div class="photo-wall">
        <div v-for="photo in photos" :key="photo.id" class="photo-item" @click="previewImage(photo)">
          <img :src="photo.image" alt="打卡照片" class="photo-image" />
          <div class="photo-tags">
            <a-tag v-for="category in photo.categorys" :key="category.id" :color="getCategoryColor(category.value)">
              {{ category.label }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 空数据提示 -->
      <a-empty v-if="photos.length === 0 && !isLoading" description="没有找到符合条件的打卡记录" />

      <!-- 图片预览 -->
      <div v-if="previewVisible" class="preview-container" @click="closePreview">
        <div class="preview-wrapper">
          <img :src="currentPreview?.image" class="preview-image" alt="预览图片" />
        </div>
      </div>

      <!-- 上传模态框 -->
      <a-modal v-model:visible="uploadModalVisible" title="上传打卡照片" :footer="null" @cancel="handleCancel">
        <div class="upload-form">
          <a-form :model="uploadForm" layout="vertical">
            <a-form-item label="选择情绪分类" name="categoryValue" :rules="[{ required: true, message: '请选择情绪分类' }]">
              <a-select v-model:value="uploadForm.categoryValue" placeholder="选择情绪分类">
                <a-select-option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                  {{ category.label }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="上传图片" name="image" :rules="[{ required: true, message: '请上传图片' }]">
              <a-upload v-model:file-list="fileList" list-type="picture-card" :before-upload="beforeUpload"
                @preview="handleImagePreview" :remove="handleRemove" :maxCount="1">
                <div v-if="fileList.length < 1">
                  <plus-outlined />
                  <div style="margin-top: 8px">上传</div>
                </div>
              </a-upload>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" :loading="isSubmitting" @click="handleUpload" style="width: 100%">
                确认上传
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </a-modal>

      <!-- 上传图片预览 -->
      <a-modal v-model:visible="imagePreviewVisible" :footer="null" @cancel="imagePreviewVisible = false">
        <img alt="预览图片" style="width: 100%" :src="previewImageUrl" />
      </a-modal>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getClockList, getClocksByCategory, createClock } from '@/api/clock'
import { uploadImageUtil } from '@/utils/utils'  // 引入上传工具函数
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
const isSubmitting = ref(false)
const photos = ref([])
const categoryOptions = ref([])
const previewVisible = ref(false)
const currentPreview = ref(null)
const uploadModalVisible = ref(false)
const fileList = ref([])
const uploadForm = ref({
  categoryValue: '',  // 改为单个值而不是数组
  image: ''
})
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// 获取所有打卡
const fetchClockList = async () => {
  try {
    isLoading.value = true
    const response = await getClockList()

    if (response.code === 200 && response.data) {
      photos.value = response.data

      // 提取分类选项
      categoryOptions.value = extractCategoryOptions(photos.value)
    } else {
      message.error(response.message || '获取打卡列表失败')
    }
  } catch (error) {
    console.error('获取打卡列表失败:', error)
    message.error('获取打卡列表失败')
  } finally {
    isLoading.value = false
  }
}

// 按分类获取打卡
const fetchClocksByCategory = async (categoryValue) => {
  if (!categoryValue) {
    return fetchClockList()
  }

  try {
    isLoading.value = true
    const response = await getClocksByCategory({ value: categoryValue })

    if (response.code === 200 && response.data) {
      photos.value = response.data
    } else {
      message.error(response.message || '获取分类打卡失败')
    }
  } catch (error) {
    console.error('获取分类打卡失败:', error)
    message.error('获取分类打卡失败')
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
  fetchClocksByCategory(value)
}

// 预览图片
const previewImage = (photo) => {
  currentPreview.value = photo
  previewVisible.value = true

  // 防止滚动
  document.body.style.overflow = 'hidden'
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
  // 恢复滚动
  document.body.style.overflow = 'auto'
}

// 显示上传模态框
const showUploadModal = () => {
  uploadModalVisible.value = true
  uploadForm.value = {
    categoryValue: '',  // 重置为空字符串而不是空数组
    image: ''
  }
  fileList.value = []
}

// 上传前处理
const beforeUpload = async (file) => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件!')
    return false
  }

  // 验证文件大小（最大2MB）
  if (file.size / 1024 / 1024 > 2) {
    message.error('图片大小不能超过2MB')
    return false
  }

  try {
    // 创建FormData
    const formData = new FormData()
    formData.append('file', file)

    // 模拟事件对象以兼容uploadImageUtil
    const event = {
      target: {
        files: [file]
      }
    }

    // 使用工具函数上传图片
    const imageUrl = await uploadImageUtil(event)

    if (imageUrl) {
      // 更新表单中的图片URL
      uploadForm.value.image = imageUrl

      // 更新文件列表，用于显示预览
      fileList.value = [{
        uid: '-1',
        name: file.name,
        status: 'done',
        url: imageUrl
      }]
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    message.error('图片上传失败')
  }

  return false // 阻止组件默认上传行为
}

// 处理图片预览
const handleImagePreview = (file) => {
  previewImageUrl.value = file.url || file.thumbUrl
  imagePreviewVisible.value = true
}

// 处理移除图片
const handleRemove = () => {
  uploadForm.value.image = ''
  fileList.value = []
  return true
}

// 处理取消
const handleCancel = () => {
  uploadModalVisible.value = false
  uploadForm.value = {
    categoryValue: '',  // 重置为空字符串而不是空数组
    image: ''
  }
  fileList.value = []
}

// 处理上传
const handleUpload = async () => {
  // 表单验证
  if (!uploadForm.value.categoryValue) {
    return message.error('请选择情绪分类')
  }

  if (!uploadForm.value.image) {
    return message.error('请上传图片')
  }

  try {
    isSubmitting.value = true

    // 准备上传数据
    const uploadData = {
      image: uploadForm.value.image,
      categoryValues: [uploadForm.value.categoryValue]  // 将单个值包装为数组以兼容API
    }

    // 调用API上传
    const response = await createClock(uploadData)

    if (response.code === 201 && response.data) {
      message.success('打卡上传成功!')

      // 关闭模态框
      uploadModalVisible.value = false

      // 重新获取打卡列表
      fetchClockList()
    } else {
      message.error(response.message || '打卡上传失败')
    }
  } catch (error) {
    console.error('打卡上传失败:', error)
    message.error('打卡上传失败')
  } finally {
    isSubmitting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchClockList().then(() => {
    // 获取URL中的情绪参数并映射到对应的分类
    const emotionParam = route.query.emotion
    if (emotionParam && emotionCategoryMap[emotionParam]) {
      // 获取映射后的分类值
      const categoryValue = emotionCategoryMap[emotionParam]

      // 检查该分类是否存在于选项中
      const categoryExists = categoryOptions.value.some(cat => cat.value === categoryValue)

      if (categoryExists) {
        // 设置当前分类并加载对应的打卡
        currentCategory.value = categoryValue
        fetchClocksByCategory(categoryValue)
      }
    }
  })
})
</script>

<style scoped>
.upload-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-filter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.filter-section {
  display: flex;
  align-items: center;
}

.photo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  break-inside: avoid;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.photo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-tags {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  background: rgba(255, 255, 255, 0.8);
  padding: 6px;
  border-radius: 4px;
}

.preview-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-wrapper {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.upload-form {
  padding: 12px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .header-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .title-filter {
    width: 100%;
  }

  .photo-wall {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
