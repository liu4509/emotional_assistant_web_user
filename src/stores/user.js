import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, register as registerApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const accessToken = ref('')
  const isLoggedIn = ref(false)

  // 登录
  const login = async (loginData) => {
    try {
      const response = await loginApi(loginData)
      if (response.code === 201 && response.data) {
        userInfo.value = response.data.userInfo
        accessToken.value = response.data.accessToken
        isLoggedIn.value = true
        return { success: true, message: '登录成功' }
      } else {
        return { success: false, message: response.message || '登录失败' }
      }
    } catch (error) {
      console.error('登录错误:', error)
      return { success: false, message: error.message || '登录过程中出错' }
    }
  }

  // 注册
  const register = async (registerData) => {
    try {
      const response = await registerApi(registerData)
      if (response.code === 201) {
        return { success: true, message: response.data || '注册成功' }
      } else {
        return { success: false, message: response.message || '注册失败' }
      }
    } catch (error) {
      console.error('注册错误:', error)
      return { success: false, message: error.message || '注册过程中出错' }
    }
  }

  // 退出登录
  const logout = async (router) => {
    try {
      resetUserState()
      if (router) {
        router.push('/login')
      } else {
        window.location.href = '/login'
      }
      return { success: true, message: '退出成功' }
    } catch (error) {
      console.error('退出登录错误:', error)
      return { success: false, message: '退出失败' }
    }
  }

  // 重置用户状态
  const resetUserState = () => {
    userInfo.value = null
    accessToken.value = ''
    isLoggedIn.value = false
  }

  return {
    userInfo,
    accessToken,
    isLoggedIn,
    login,
    register,
    logout,
    resetUserState
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['userInfo', 'accessToken', 'isLoggedIn']
  }
})
