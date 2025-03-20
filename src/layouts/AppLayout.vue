<template>
  <a-layout class="content">
    <a-layout-header class="header">
      <div class="header-container">
        <!-- 左侧菜单 -->
        <a-menu mode="horizontal" theme="dark" :selected-keys="[$route.path.replace('/', '')]"
          @select="handleMenuSelect" class="main-menu">
          <div style="display: flex">
            <a-menu-item key="diary"> 情绪日记 </a-menu-item>
            <a-menu-item key="media"> 音乐视频 </a-menu-item>
            <a-menu-item key="chat"> AI 助手 </a-menu-item>
          </div>
          <a-sub-menu key="1" title="旅游">
            <a-menu-item key="travel">旅游推荐</a-menu-item>
            <a-menu-item key="upload">打卡照片</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="2" title="心理">
            <a-menu-item key="articles">心理知识文章</a-menu-item>
            <a-menu-item key="videos">心理知识视频</a-menu-item>
            <a-menu-item key="games">游戏推荐</a-menu-item>
            <a-menu-item key="survey">心情测评问卷</a-menu-item>
            <a-menu-item key="training">情绪调节训练场景</a-menu-item>
          </a-sub-menu>
        </a-menu>

        <!-- 右侧用户头像和菜单 -->
        <div class="user-menu">
          <a-dropdown>
            <a class="ant-dropdown-link user-dropdown-link" @click.prevent>
              <a-avatar :src="userStore.userInfo?.avatar || defaultAvatar" :size="32" />
              <span class="username">{{ userStore.userInfo?.username }}</span>
              <down-outlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile" @click="handleMenuSelect({ key: 'profile' })">
                  <user-outlined />个人中心
                </a-menu-item>
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined />退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </a-layout-header>

    <a-layout-content class="content-container">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { DownOutlined, UserOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'

const handleMenuSelect = ({ key }) => {
  console.log('导航菜单点击:', key)
  router.push(`/${key}`)
}

const handleLogout = async () => {
  await userStore.logout(router)
}
</script>

<style scoped>
.header {
  position: fixed;
  z-index: 1000;
  width: 100vw;
  left: 0;
  top: 0;
  padding: 0 24px;
  background: #001529;
  height: 64px;
  line-height: 64px;
}

.content-container {
  margin-top: 50px;
  min-height: 100vh;
}

.ant-layout-content {
  width: 100%;
  padding: 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

.main-menu {
  flex-grow: 1;
}

.user-menu {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.ant-menu {
  display: flex;
  width: 100%;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  color: #fff;
  padding: 0 12px;
  transition: all 0.3s;
}

.user-dropdown-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  margin: 0 8px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
