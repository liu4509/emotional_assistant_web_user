<template>
  <a-layout>
    <a-layout-sider theme="light" :width="200">
      <a-menu mode="inline" :default-selected-keys="['1']" @select="handleMenuSelect">
        <a-menu-item key="1">
          <template #icon><user-outlined /></template>
          个人信息
        </a-menu-item>
        <a-menu-item key="2">
          <template #icon><book-outlined /></template>
          情绪日记
        </a-menu-item>
        <a-menu-item key="3">
          <template #icon><camera-outlined /></template>
          旅行打卡
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout-content class="content-area">
      <!-- 个人信息 -->
      <a-card v-if="activeKey === '1'">
        <template #title>
          <div class="card-header">
            <span>基本信息</span>
            <div>
              <a-button type="primary" @click="showPasswordModal" style="margin-right: 8px;">
                <template #icon><lock-outlined /></template>
                修改密码
              </a-button>
              <a-button type="primary" @click="toggleEditMode" v-if="!isEditing">
                <template #icon><edit-outlined /></template>
                编辑信息
              </a-button>
              <a-button type="primary" @click="saveUserInfo" v-else>
                <template #icon><save-outlined /></template>
                保存
              </a-button>
            </div>
          </div>
        </template>

        <div class="profile-section">
          <div class="avatar-section">
            <a-avatar :src="formState.avatar || defaultAvatar" :size="100" />
            <div class="avatar-upload" v-if="isEditing">
              <input type="file" ref="avatarInput" style="display: none;" accept="image/jpeg,image/png"
                @change="handleAvatarUpload" />
              <a-button type="primary" size="small" @click="$refs.avatarInput.click()">
                <template #icon><upload-outlined /></template>
                上传头像
              </a-button>
            </div>
          </div>

          <div class="profile-info">
            <a-form :model="formState" layout="vertical">
              <a-form-item label="用户名">
                <a-input v-model:value="formState.username" :disabled="true" />
              </a-form-item>
              <a-form-item label="电子邮箱">
                <a-input v-model:value="formState.email" :disabled="!isEditing" />
              </a-form-item>
            </a-form>
          </div>
        </div>
      </a-card>

      <!-- 情绪日记 -->
      <a-card v-else-if="activeKey === '2'" title="情绪日记">
        <a-empty v-if="diaries.length === 0" description="暂无情绪日记" />
        <a-list v-else item-layout="vertical" :data-source="diaries">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <div class="diary-header">
                    <span>{{ formatDate(item.createTime) }}</span>
                    <div class="diary-actions">
                      <a-button type="text" @click="openDiaryEditModal(item)" style="margin-right: 8px;">
                        <template #icon><edit-outlined /></template>
                        编辑
                      </a-button>
                      <a-button type="text" danger @click="confirmDeleteDiary(item.id)">
                        <template #icon><delete-outlined /></template>
                        删除
                      </a-button>
                    </div>
                  </div>
                </template>
                <template #description>
                  <div>
                    <a-space wrap>
                      <a-tag v-for="mood in item.moods" :key="mood.id" :color="getMoodColor(mood.value)">
                        {{ mood.label }}
                      </a-tag>
                    </a-space>
                  </div>
                </template>
              </a-list-item-meta>
              <div class="diary-content">{{ item.content }}</div>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <!-- 旅行打卡 -->
      <a-card v-else-if="activeKey === '3'" title="旅行打卡">
        <a-empty v-if="photos.length === 0" description="暂无旅行打卡" />
        <div v-else class="photos-grid">
          <div v-for="photo in photos" :key="photo.id" class="photo-card">
            <div class="photo-container">
              <img :src="photo.image" :alt="formatDate(photo.createTime)" />
              <div class="photo-overlay">
                <div class="photo-info">
                  <div>{{ formatDate(photo.createTime) }}</div>
                  <div class="photo-actions">
                    <a-button type="text" @click="previewImage(photo.image)">
                      <template #icon><eye-outlined /></template>
                    </a-button>
                    <a-button type="text" danger @click="confirmDeletePhoto(photo.id)">
                      <template #icon><delete-outlined /></template>
                    </a-button>
                  </div>
                </div>
                <div class="photo-categories">
                  <a-tag v-for="category in photo.categorys" :key="category.id" color="blue">
                    {{ category.label }}
                  </a-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </a-layout-content>
  </a-layout>

  <!-- 修改密码对话框 -->
  <a-modal v-model:visible="passwordModalVisible" title="修改密码" @ok="savePassword" :confirmLoading="passwordLoading">
    <a-form :model="passwordForm" layout="vertical">
      <a-form-item label="当前密码" name="currentPassword" :rules="[{ required: true, message: '请输入当前密码' }]">
        <a-input-password v-model:value="passwordForm.currentPassword" />
      </a-form-item>
      <a-form-item label="新密码" name="password" :rules="[{ required: true, message: '请输入新密码' }]">
        <a-input-password v-model:value="passwordForm.password" />
      </a-form-item>
      <a-form-item label="确认新密码" name="confirmPassword" :rules="[
        { required: true, message: '请确认新密码' },
        { validator: validateConfirmPassword }
      ]">
        <a-input-password v-model:value="passwordForm.confirmPassword" />
      </a-form-item>
      <a-form-item label="验证码" name="verifyCode" :rules="[{ required: true, message: '请输入验证码' }]">
        <div class="captcha-container">
          <a-input v-model:value="passwordForm.verifyCode" style="width: 70%" />
          <a-button type="primary" :disabled="countdown > 0" :loading="captchaLoading" @click="sendVerifyCode">
            {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
          </a-button>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 图片预览 -->
  <a-image :width="200" :style="{ display: 'none' }" :preview="{
    visible: previewVisible,
    onVisibleChange: (visible) => {
      previewVisible = visible;
    },
    src: previewImageSrc
  }" />

  <!-- 编辑日记对话框 -->
  <a-modal v-model:visible="diaryEditModalVisible" title="编辑日记" @ok="saveDiaryEdit" :confirmLoading="diaryEditLoading">
    <a-form :model="diaryEditForm" layout="vertical">
      <a-form-item label="日记内容" name="content" :rules="[{ required: true, message: '请输入日记内容' }]">
        <a-textarea v-model:value="diaryEditForm.content" :rows="4" placeholder="请输入日记内容" />
      </a-form-item>
      <a-form-item label="情绪标签" name="moodValues" :rules="[{ required: true, message: '请选择至少一种情绪' }]">
        <a-select v-model:value="diaryEditForm.moodValues" mode="multiple" placeholder="请选择情绪标签" style="width: 100%">
          <a-select-option v-for="mood in MOOD_CONFIG" :key="mood.value" :value="mood.value">
            {{ mood.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  UserOutlined,
  BookOutlined,
  CameraOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SaveOutlined,
  LockOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { getUserInfo, updateUserInfo, updateUserPassword, sendVerifyCodeAPI } from '@/api/user'
import { getMyDiaries, deleteDiarie, updateDiarie } from '@/api/diarie'
import { getMyClocks, deleteClock } from '@/api/clock'
import { formatDate, uploadImageUtil } from '@/utils/utils'
import { useUserStore } from '@/stores/user'

// 用户状态
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || {})
const activeKey = ref('1')
const isEditing = ref(false)
const defaultAvatar = 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'

// 菜单切换
const handleMenuSelect = ({ key }) => {
  activeKey.value = key
  if (key === '2') {
    loadDiaries()
  } else if (key === '3') {
    loadPhotos()
  }
}

// 表单数据
const formState = ref({
  username: userInfo.value.username || '',
  email: userInfo.value.email || '',
  avatar: userInfo.value.avatar || '',
})

// 密码修改
const passwordModalVisible = ref(false)
const passwordLoading = ref(false)
const captchaLoading = ref(false)
const countdown = ref(0)
let timer = null

const passwordForm = reactive({
  currentPassword: '',
  password: '',
  confirmPassword: '',
  verifyCode: ''
})

const validateConfirmPassword = async (rule, value) => {
  if (value === '') {
    return Promise.reject('请确认新密码')
  }
  if (value !== passwordForm.password) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const showPasswordModal = () => {
  passwordModalVisible.value = true
  // 重置表单
  passwordForm.currentPassword = ''
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  passwordForm.verifyCode = ''
}

const sendVerifyCode = async () => {
  if (!formState.value.email) {
    message.error('未找到邮箱信息')
    return
  }

  captchaLoading.value = true
  try {
    countdown.value = 60
    const result = await sendVerifyCodeAPI({ address: formState.value.email, ttl: countdown.value })

    if (result.code === 200 || result.code === 201) {
      message.success(result.data || '验证码发送成功')
      // 设置倒计时
      timer = setInterval(() => {
        countdown.value -= 1
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      message.error(result.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('验证码发送错误:', error)
    message.error('验证码发送过程中出错')
  } finally {
    captchaLoading.value = false
  }
}

const savePassword = async () => {
  if (!passwordForm.currentPassword || !passwordForm.password || !passwordForm.confirmPassword || !passwordForm.verifyCode) {
    message.error('请填写完整信息')
    return
  }

  passwordLoading.value = true
  try {
    const result = await updateUserPassword({
      currentPassword: passwordForm.currentPassword,
      password: passwordForm.password,
      verifyCode: passwordForm.verifyCode
    })

    if (result.code === 200 || result.code === 201) {
      message.success(result.data || '密码修改成功')
      passwordModalVisible.value = false
    } else {
      message.error(result.message || '密码修改失败')
    }
  } catch (error) {
    console.error('密码修改错误:', error)
    message.error('密码修改过程中出错')
  } finally {
    passwordLoading.value = false
  }
}

// 上传头像
const handleAvatarUpload = async (event) => {
  const avatarUrl = await uploadImageUtil(event)
  if (avatarUrl) {
    formState.value.avatar = avatarUrl
  }
}

// 切换编辑模式
const toggleEditMode = () => {
  isEditing.value = true
}

// 保存用户信息
const saveUserInfo = async () => {
  try {
    const result = await updateUserInfo({
      email: formState.value.email,
      avatar: formState.value.avatar
    })

    if (result.code === 200 || result.code === 201) {
      message.success(result.data || '用户信息修改成功')
      isEditing.value = false
      loadUserInfo() // 重新加载用户信息
    } else {
      message.error(result.message || '用户信息修改失败')
    }
  } catch (error) {
    console.error('更新用户信息错误:', error)
    message.error('更新用户信息过程中出错')
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const result = await getUserInfo()
    if ((result.code === 200 || result.code === 201) && result.data) {
      const userData = result.data.userInfo
      formState.value.username = userData.username || ''
      formState.value.email = userData.email || ''
      formState.value.avatar = userData.avatar || ''
    } else {
      message.error(result.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息错误:', error)
    message.error('获取用户信息过程中出错')
  }
}

// 情绪日记相关
const diaries = ref([])
const MOOD_CONFIG = [
  { value: 'happy', label: '😊 快乐', score: 4 },
  { value: 'bliss', label: '😇 幸福', score: 5 },
  { value: 'excited', label: '🤩 兴奋', score: 4 },
  { value: 'content', label: '😌 满足', score: 3 },
  { value: 'relaxed', label: '🛀 轻松', score: 3 },
  { value: 'calm', label: '🧘 平静', score: 1 },
  { value: 'tired', label: '😴 疲惫', score: -1 },
  { value: 'anxious', label: '😰 焦虑', score: -2 },
  { value: 'frustrated', label: '😞 沮丧', score: -2 },
  { value: 'sad', label: '😢 难过', score: -3 },
  { value: 'grief', label: '😭 悲伤', score: -5 },
  { value: 'angry', label: '😠 愤怒', score: -5 },
]

const getMoodColor = (moodValue) => {
  switch (moodValue) {
    case 'happy':
    case 'bliss':
    case 'excited':
      return 'green'
    case 'content':
    case 'relaxed':
    case 'calm':
      return 'blue'
    case 'tired':
      return 'orange'
    case 'anxious':
    case 'frustrated':
      return 'gold'
    case 'sad':
    case 'grief':
    case 'angry':
      return 'red'
    default:
      return 'default'
  }
}

const loadDiaries = async () => {
  try {
    const result = await getMyDiaries()
    if (result.code === 200 || result.code === 201) {
      diaries.value = result.data || []
    } else {
      message.error(result.message || '获取日记失败')
    }
  } catch (error) {
    console.error('获取日记错误:', error)
    message.error('获取日记过程中出错')
  }
}

const confirmDeleteDiary = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条日记吗？删除后将无法恢复。',
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      try {
        const result = await deleteDiarie(id)
        if (result.code === 200 || result.code === 201) {
          message.success(result.data || '日记删除成功')
          loadDiaries() // 重新加载日记
        } else {
          message.error(result.message || '日记删除失败')
        }
      } catch (error) {
        console.error('删除日记错误:', error)
        message.error('删除日记过程中出错')
      }
    },
  })
}

// 旅行打卡相关
const photos = ref([])
const previewVisible = ref(false)
const previewImageSrc = ref('')

const loadPhotos = async () => {
  try {
    const result = await getMyClocks()
    if (result.code === 200 || result.code === 201) {
      photos.value = result.data || []
    } else {
      message.error(result.message || '获取打卡失败')
    }
  } catch (error) {
    console.error('获取打卡错误:', error)
    message.error('获取打卡过程中出错')
  }
}

const previewImage = (imageSrc) => {
  previewImageSrc.value = imageSrc
  previewVisible.value = true
}

const confirmDeletePhoto = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这张打卡照片吗？删除后将无法恢复。',
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      try {
        const result = await deleteClock(id)
        if (result.code === 200 || result.code === 201) {
          message.success(result.data || '打卡删除成功')
          loadPhotos() // 重新加载照片
        } else {
          message.error(result.message || '打卡删除失败')
        }
      } catch (error) {
        console.error('删除打卡错误:', error)
        message.error('删除打卡过程中出错')
      }
    },
  })
}

// 日记编辑相关
const diaryEditModalVisible = ref(false)
const diaryEditLoading = ref(false)
const currentEditingDiaryId = ref(null)
const diaryEditForm = reactive({
  content: '',
  moodValues: [],
})

// 打开编辑日记对话框
const openDiaryEditModal = (diary) => {
  currentEditingDiaryId.value = diary.id
  diaryEditForm.content = diary.content
  diaryEditForm.moodValues = diary.moods.map(mood => mood.value)
  diaryEditModalVisible.value = true
}

// 保存日记编辑
const saveDiaryEdit = async () => {
  if (!diaryEditForm.content || !diaryEditForm.moodValues || diaryEditForm.moodValues.length === 0) {
    message.error('请填写完整信息')
    return
  }

  diaryEditLoading.value = true
  try {
    const result = await updateDiarie(currentEditingDiaryId.value, {
      content: diaryEditForm.content,
      moodValues: diaryEditForm.moodValues
    })

    if (result.code === 200 || result.code === 201) {
      message.success(result.data || '日记更新成功')
      diaryEditModalVisible.value = false
      loadDiaries() // 重新加载日记
    } else {
      message.error(result.message || '日记更新失败')
    }
  } catch (error) {
    console.error('更新日记错误:', error)
    message.error('更新日记过程中出错')
  } finally {
    diaryEditLoading.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  console.log('onMounted')
  loadUserInfo()
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.content-area {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.profile-section {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.profile-info {
  flex: 1;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diary-actions {
  display: flex;
}

.diary-content {
  margin-top: 10px;
  white-space: pre-wrap;
}

.captcha-container {
  display: flex;
  gap: 10px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.photo-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.photo-card:hover {
  transform: translateY(-5px);
}

.photo-container {
  position: relative;
  aspect-ratio: 4/3;
}

.photo-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-container:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.photo-actions {
  display: flex;
  gap: 8px;
}

.photo-actions button {
  color: white;
}

.photo-categories {
  margin-top: 8px;
}
</style>
