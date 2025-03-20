import axios from 'axios'
import { message } from 'ant-design-vue'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 从环境变量获取API基础URL，默认为'/api'
  timeout: 150000, // 请求超时时间
  // headers: {
  //   'Content-Type': 'application/json'
  // }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const userStore = JSON.parse(localStorage.getItem('user-store'))
    if (userStore && userStore.accessToken) {
      // 设置请求头中的 Authorization
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }
    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 根据后端的响应结构处理数据
    if (res.code >= 200 && res.code < 300) {
      return res
    }

    // 处理业务级别的错误
    message.error(res.message || '请求失败')

    // 处理特定的错误码，例如token过期
    if (res.code === 401) {
      // Token过期，清除本地数据并重定向到登录页
      localStorage.removeItem('user-store')
      window.location.href = '/login'
    }

    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    console.error('响应错误：', error)

    // 根据错误状态码显示不同的错误信息
    const status = error.response?.status
    let errorMsg = '网络错误，请稍后重试'

    if (status === 401) {
      errorMsg = '未授权，请重新登录'
      // 清除本地数据并重定向到登录页
      localStorage.removeItem('user-store')
      window.location.href = '/login'
    } else if (status === 403) {
      errorMsg = '拒绝访问'
    } else if (status === 404) {
      errorMsg = '请求的资源不存在'
    } else if (status === 500) {
      errorMsg = '服务器错误，请稍后重试'
    }

    message.error(errorMsg)
    return Promise.reject(error)
  }
)

export default service
