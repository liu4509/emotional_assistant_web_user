<template>
  <a-layout class="login-layout">
    <a-layout-content>
      <div class="login-container">
        <div class="login-background-shapes">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
          <div class="circle circle-4"></div>
        </div>
        <a-card class="login-card">
          <div class="app-logo">
            <div class="app-icon">
              <span class="emoji">❤</span>
            </div>
            <h1 class="app-title">心情治愈网站</h1>
          </div>
          <a-tabs v-model:activeKey="activeKey" class="custom-tabs">
            <a-tab-pane key="1" tab="登录">
              <a-form :model="formState" name="basic" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }"
                autocomplete="off" @finish="onFinish" @finishFailed="onFinishFailed" class="custom-form">
                <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
                  <a-input v-model:value="formState.username" class="custom-input" placeholder="请输入您的用户名" />
                </a-form-item>

                <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码!' }]">
                  <a-input-password v-model:value="formState.password" class="custom-input" placeholder="请输入您的密码" />
                </a-form-item>

                <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                  <a-button type="primary" html-type="submit" :loading="loginLoading"
                    class="submit-button">登录</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
            <a-tab-pane key="2" tab="注册">
              <a-form :model="registerFormState" name="register" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }"
                autocomplete="off" @finish="onRegisterFinish" @finishFailed="onRegisterFinishFailed"
                class="custom-form">
                <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
                  <a-input v-model:value="registerFormState.username" class="custom-input" placeholder="创建您的用户名" />
                </a-form-item>

                <a-form-item label="邮箱" name="email" :rules="[
                  {
                    required: true,
                    message: '请输入邮箱!',
                  },
                  {
                    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                    message: '邮箱格式不正确',
                  },
                ]">
                  <a-input v-model:value="registerFormState.email" class="custom-input" placeholder="输入您的邮箱" />
                </a-form-item>

                <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码!' }]">
                  <a-input-password v-model:value="registerFormState.password" class="custom-input"
                    placeholder="创建密码" />
                </a-form-item>

                <a-form-item label="确认密码" name="confirmPassword" :rules="[
                  { required: true, message: '请再次输入密码!' },
                  { validator: validateConfirmPassword }
                ]">
                  <a-input-password v-model:value="registerFormState.confirmPassword" class="custom-input"
                    placeholder="确认您的密码" />
                </a-form-item>

                <a-form-item label="验证码" name="captcha" :rules="[{ required: true, message: '请输入验证码!' }]">
                  <div class="captcha-container">
                    <a-input v-model:value="registerFormState.captcha" class="custom-input captcha-input"
                      placeholder="输入验证码" />
                    <a-button type="primary" :disabled="countdown > 0" @click="handleSendCaptcha"
                      :loading="captchaLoading" class="captcha-button">
                      {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
                    </a-button>
                  </div>
                </a-form-item>

                <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                  <a-button type="primary" html-type="submit" :loading="registerLoading"
                    class="submit-button">注册</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>
          <div class="login-footer">
            <p>登录即表示您同意我们的<a href="#">服务条款</a>和<a href="#">隐私政策</a></p>
          </div>
        </a-card>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { sendVerifyCodeAPI } from '@/api/user'
import { message } from 'ant-design-vue'

const router = useRouter()
const userStore = useUserStore()
const activeKey = ref('1')

// 登录相关
const formState = reactive({
  username: '',
  password: '',
})
const loginLoading = ref(false)

const onFinish = async (values) => {
  loginLoading.value = true
  try {
    const result = await userStore.login(values)
    if (result.success) {
      message.success('登录成功')
      // 登录成功后重定向到首页或者之前的页面
      router.push('/survey')
    } else {
      message.error(result.message || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    message.error('登录过程中出错')
  } finally {
    loginLoading.value = false
  }
}

const onFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo)
  message.error('请检查登录表单信息')
}

// 注册相关
const registerFormState = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
})
const registerLoading = ref(false)
const captchaLoading = ref(false)
const countdown = ref(0)
let timer = null

const validateConfirmPassword = async (rule, value) => {
  if (value === '') {
    return Promise.reject('请确认密码')
  } else if (value !== registerFormState.password) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const onRegisterFinish = async (values) => {
  registerLoading.value = true
  try {
    const { confirmPassword, ...registerData } = values
    const result = await userStore.register(registerData)

    if (result.success) {
      message.success(result.message || '注册成功')
      // 切换到登录页
      activeKey.value = '1'
      // 清空注册表单
      Object.keys(registerFormState).forEach(key => {
        registerFormState[key] = ''
      })
    } else {
      message.error(result.message || '注册失败')
    }
  } catch (error) {
    console.error('注册错误:', error)
    message.error('注册过程中出错')
  } finally {
    registerLoading.value = false
  }
}

const onRegisterFinishFailed = (errorInfo) => {
  console.log('Register Failed:', errorInfo)
  message.error('请检查注册表单信息')
}

const handleSendCaptcha = async () => {
  if (!registerFormState.email) {
    message.error('请输入邮箱')
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!emailRegex.test(registerFormState.email)) {
    message.error('邮箱格式不正确')
    return
  }

  captchaLoading.value = true
  try {
    countdown.value = 60
    const response = await sendVerifyCodeAPI({ address: registerFormState.email, ttl: countdown.value })

    if (response.code === 200) {
      message.success(response.data || '验证码发送成功')
      // 设置倒计时
      timer = setInterval(() => {
        countdown.value -= 1
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      message.error(response.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('验证码发送错误:', error)
    message.error('验证码发送过程中出错')
  } finally {
    captchaLoading.value = false
  }
}

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
/* 基础样式 */
.login-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  position: relative;
  z-index: 1;
}

/* 背景动态效果 */
.login-background-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 15s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -50px;
  background: linear-gradient(135deg, rgba(255, 138, 0, 0.15) 0%, rgba(255, 223, 186, 0.15) 100%);
  animation-delay: 0s;
}

.circle-2 {
  width: 400px;
  height: 400px;
  bottom: -150px;
  left: -100px;
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(37, 117, 252, 0.1) 100%);
  animation-delay: -5s;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 30%;
  left: 5%;
  background: linear-gradient(135deg, rgba(76, 217, 105, 0.15) 0%, rgba(200, 255, 194, 0.15) 100%);
  animation-delay: -2s;
}

.circle-4 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  background: linear-gradient(135deg, rgba(0, 206, 209, 0.15) 0%, rgba(173, 216, 230, 0.15) 100%);
  animation-delay: -8s;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-20px) rotate(3deg);
  }

  50% {
    transform: translateY(0) rotate(0deg);
  }

  75% {
    transform: translateY(20px) rotate(-3deg);
  }

  100% {
    transform: translateY(0) rotate(0deg);
  }
}

/* 登录卡片样式 */
.login-card {
  width: 450px;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  animation: card-appear 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

@keyframes card-appear {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 应用图标和标题 */
.app-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.app-icon {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2388fe 0%, #186df0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 10px 20px rgba(24, 109, 240, 0.3);
}

.emoji {
  font-size: 40px;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
  letter-spacing: 0.5px;
}

/* 自定义表单样式 */
.custom-form {
  margin-top: 20px;
}

.custom-input {
  height: 42px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
  background-color: rgba(249, 250, 251, 0.8);
  padding: 0 15px;
}

.custom-input:hover {
  border-color: #1890ff;
  background-color: rgba(249, 250, 251, 1);
}

.custom-input:focus {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  border-color: #1890ff;
  background-color: white;
}

/* 按钮样式 */
.submit-button {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #2388fe 0%, #186df0 100%);
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.5px;
  box-shadow: 0 5px 15px rgba(24, 144, 255, 0.2);
  transition: all 0.3s;
}

.submit-button:hover {
  background: linear-gradient(135deg, #1e78e0 0%, #1560d6 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(24, 144, 255, 0.3);
}

.submit-button:active {
  transform: translateY(0);
}

/* 验证码容器样式 */
.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-button {
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f88f46 0%, #f66d1f 100%);
  border: none;
  white-space: nowrap;
  min-width: 110px;
  box-shadow: 0 5px 15px rgba(246, 109, 31, 0.2);
  transition: all 0.3s;
}

.captcha-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #f67e2e 0%, #e55e10 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(246, 109, 31, 0.3);
}

.captcha-button:disabled {
  background: linear-gradient(135deg, #ffbb96 0%, #ffa67a 100%);
  color: white;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 标签页样式 */
.custom-tabs :deep(.ant-tabs-nav::before) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.custom-tabs :deep(.ant-tabs-tab) {
  padding: 10px 20px;
  font-size: 16px;
  transition: all 0.3s;
}

.custom-tabs :deep(.ant-tabs-tab-active) {
  font-weight: 600;
}

.custom-tabs :deep(.ant-tabs-ink-bar) {
  background: #1890ff;
  height: 3px;
  border-radius: 3px;
}

/* 页脚样式 */
.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #888;
}

.login-footer a {
  color: #1890ff;
  text-decoration: none;
  transition: all 0.3s;
}

.login-footer a:hover {
  color: #40a9ff;
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .login-card {
    width: 90%;
    max-width: 450px;
    padding: 20px;
  }

  .app-icon {
    width: 60px;
    height: 60px;
  }

  .emoji {
    font-size: 34px;
  }

  .app-title {
    font-size: 20px;
  }

  .captcha-button {
    min-width: auto;
    padding: 0 10px;
    font-size: 12px;
  }
}
</style>
