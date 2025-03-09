<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleMenuSelect = ({ key }) => {
  console.log('导航菜单点击:', key)
  router.push(key)
}
</script>

<template>
  <a-layout class="content">
    <a-layout-header class="header">
      <a-menu mode="horizontal" theme="dark" :selected-keys="[$route.path]" @select="handleMenuSelect">
        <div style="display: flex">
          <a-menu-item key="/diary"> 情绪日记 </a-menu-item>
          <a-menu-item key="/media"> 音乐视频 </a-menu-item>
          <a-menu-item key="/chat"> AI 助手 </a-menu-item>
        </div>
        <a-sub-menu key="1" title="旅游">
          <a-menu-item key="/travel">旅游推荐</a-menu-item>
          <a-menu-item key="/upload">打卡照片</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="2" title="心理">
          <!-- <a-menu-item key="/trend">情绪趋势</a-menu-item> -->
          <a-menu-item key="/articles">心理知识文章</a-menu-item>
          <a-menu-item key="/videos">心理知识视频</a-menu-item>
          <a-menu-item key="/games">游戏推荐</a-menu-item>
          <a-menu-item key="/survey">心情测评问卷</a-menu-item>
          <a-menu-item key="/training">情绪调节训练场景</a-menu-item>
          <!-- <a-menu-item key="/qa">训练问题</a-menu-item> -->
        </a-sub-menu>
        <a-menu-item key="/profile" style="margin-left: auto"> 个人中心 </a-menu-item>
        <a-menu-item key="/login"> 登录注册 </a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout-content class="content-container">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

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
</style>
