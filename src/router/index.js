import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false, standalone: true }
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: 'profile', component: () => import('../views/ProfileView.vue') },
        { path: 'diary', component: () => import('../views/DiaryView.vue') },
        { path: 'travel', component: () => import('../views/TravelView.vue') },
        { path: 'upload', component: () => import('../views/UploadView.vue') },
        { path: 'media', component: () => import('../views/MediaView.vue') },
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

export default router
