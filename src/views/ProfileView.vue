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
      <a-card title="基本信息" v-if="activeKey === '1'">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px">
          <a-avatar :src="avatarUrl" :size="64" />
          <a-button type="primary" @click="isEditingAvatar = true" v-if="!isEditingAvatar">
            <template #icon><edit-outlined /></template>
            更换头像
          </a-button>
        </div>

        <a-upload
          v-if="isEditingAvatar"
          v-model:file-list="avatarFile"
          list-type="picture-card"
          :show-upload-list="false"
          :before-upload="
            (file) => {
              avatarUrl.value = URL.createObjectURL(file)
              isEditingAvatar = false
              return false
            }
          "
        >
          <div>
            <plus-outlined />
            <div>上传新头像</div>
          </div>
        </a-upload>

        <a-form-item label="姓名">
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="电子邮箱">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <a-button type="primary">保存修改</a-button>
      </a-card>

      <div v-else-if="activeKey === '2'">
        <a-list item-layout="horizontal" :data-source="diaries">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.date" :description="item.content" />
            </a-list-item>
          </template>
        </a-list>
      </div>

      <div v-else-if="activeKey === '3'">
        <a-list item-layout="horizontal" :data-source="photos">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.date" :description="item.location" />
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue'
import {
  UserOutlined,
  BookOutlined,
  CameraOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'

const activeKey = ref('1')
const isEditingAvatar = ref(false)
const avatarUrl = ref('https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png')

const handleMenuSelect = ({ key }) => {
  activeKey.value = key
}
const formState = ref({
  name: '张三',
  email: 'zhangsan@example.com',
})
const avatarFile = ref([])
const photos = ref([
  { date: '2024-03-10', location: '上海迪士尼乐园' },
  { date: '2024-03-15', location: '杭州西湖' },
])

const diaries = ref([
  { date: '2024-03-01', content: '今天心情很好，完成了一个大项目' },
  { date: '2024-03-05', content: '遇到技术难题有些焦虑' },
])

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    // message.error('只能上传图片文件')
  }
  return isImage
}
</script>

<style scoped>
.content-area {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.ant-upload-select-picture-card {
  margin-bottom: 16px;
}
</style>
