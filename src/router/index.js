import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import { useUser } from '@/composables/useUser'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('../views/LoginView.vue'),
      meta: {  title: '登录', noAuth: true  }
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: '个人信息'} },
        { path: 'diary', component: () => import('../views/DiaryView.vue'), },
        { path: 'travel', component: () => import('../views/TravelView.vue') },
        { path: 'upload', component: () => import('../views/UploadView.vue') },
        { path: 'media', component: () => import('../views/MediaView.vue') },
        { path: 'media-video', component: () => import('../views/MediaVideoView.vue') },
        { path: 'articles', component: () => import('../views/ArticleView.vue') },
        { path: 'videos', component: () => import('../views/VideoView.vue') },
        { path: 'games', component: () => import('../views/GameView.vue') },
        { path: 'survey', component: () => import('../views/SurveyView.vue') },
        { path: 'training', component: () => import('../views/TrainingView.vue') },
        {
          path: 'chat',
          component: () => import('../views/DeepseekChat.vue'),
        },
        {
          path: '',
          redirect: '/diary'
        }
      ]
    }
  ],
})
// TODO:添加导航守卫，实现权限控制
router.beforeEach((to, from, next) => {
  console.log('路由变化:', { from: from.path, to: to.path })
  const { accessToken } = useUser()
  // 获取登录状态
  const token = accessToken.value

  if (to.meta.noAuth) {
    // 不需要身份验证的页面
    if (token && to.path === '/login') {
      // 如果已登录且访问的是登录页，重定向到首页
      next('/')
    } else {
      next()
    }
  } else {
    // 需要身份验证的页面
    if (token) {
      next()
    } else {
      // 未登录，重定向到登录页
      next('/login')
    }
  }
})

router.onError((error) => {
  console.error('路由错误:', error)
})

export default router
