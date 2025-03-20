import { useUser } from '@/composables/useUser'

export const userPlugin = {
  install: (app) => {
    // 添加全局属性
    app.config.globalProperties.$user = useUser()

    // 添加全局注入
    app.provide('user', useUser())
  }
}
