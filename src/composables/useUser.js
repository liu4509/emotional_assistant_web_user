import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

export function useUser() {
  const store = useUserStore()
  const { userInfo, accessToken } = storeToRefs(store)

  return {
    // 响应式状态
    userInfo,
    accessToken,

    // 方法
    login: store.login,
    logout: store.logout,
    isLoggedIn: store.isLoggedIn,
    initUserInfo: store.initUserInfo
  }
}
