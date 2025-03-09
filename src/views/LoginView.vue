<template>
  <a-layout class="login-layout">
    <a-layout-content>
      <div class="login-container">
        <a-card class="login-card">
          <a-tabs v-model:activeKey="activeKey">
            <a-tab-pane key="1" tab="登录">
              <a-form
                :model="formState"
                name="basic"
                :label-col="{ span: 8 }"
                :wrapper-col="{ span: 16 }"
                autocomplete="off"
                @finish="onFinish"
                @finishFailed="onFinishFailed"
              >
                <a-form-item
                  label="用户名"
                  name="username"
                  :rules="[{ required: true, message: '请输入用户名!' }]"
                >
                  <a-input v-model:value="formState.username" />
                </a-form-item>

                <a-form-item
                  label="密码"
                  name="password"
                  :rules="[{ required: true, message: '请输入密码!' }]"
                >
                  <a-input-password v-model:value="formState.password" />
                </a-form-item>

                <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                  <a-button type="primary" html-type="submit">登录</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
            <a-tab-pane key="2" tab="注册">
              <a-form
                :model="registerFormState"
                name="register"
                :label-col="{ span: 8 }"
                :wrapper-col="{ span: 16 }"
                autocomplete="off"
                @finish="onRegisterFinish"
                @finishFailed="onRegisterFinishFailed"
              >
                <a-form-item
                  label="用户名"
                  name="username"
                  :rules="[{ required: true, message: '请输入用户名!' }]"
                >
                  <a-input v-model:value="registerFormState.username" />
                </a-form-item>

                <a-form-item
                  label="邮箱"
                  name="email"
                  :rules="[
                    {
                      required: true,
                      message: '请输入邮箱!',
                    },
                    {
                      pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                      message: '邮箱格式不正确',
                    },
                  ]"
                >
                  <a-input v-model:value="registerFormState.email" />
                </a-form-item>

                <a-form-item
                  label="密码"
                  name="password"
                  :rules="[{ required: true, message: '请输入密码!' }]"
                >
                  <a-input-password v-model:value="registerFormState.password" />
                </a-form-item>

                <a-form-item
                  label="确认密码"
                  name="confirmPassword"
                  :rules="[{ required: true, message: '请再次输入密码!' }]"
                >
                  <a-input-password v-model:value="registerFormState.confirmPassword" />
                </a-form-item>

                <a-form-item
                  label="验证码"
                  name="captcha"
                  :rules="[{ required: true, message: '请输入验证码!' }]"
                >
                  <div class="captcha-container">
                    <a-input
                      v-model:value="registerFormState.captcha"
                      style="width: 150px; margin-right: 10px"
                      placeholder="请输入验证码"
                    />
                    <a-button type="primary" :disabled="countdown > 0" @click="handleSendCaptcha">
                      {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
                    </a-button>
                  </div>
                </a-form-item>

                <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                  <a-button type="primary" html-type="submit">注册</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { reactive, ref } from 'vue'

const activeKey = ref('1')

const formState = reactive({
  username: '',
  password: '',
})

const registerFormState = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
})

const onFinish = (values) => {
  console.log('Success:', values)
}

const onFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo)
}

const onRegisterFinish = (values) => {
  console.log('Register Success:', values)
}

const onRegisterFinishFailed = (errorInfo) => {
  console.log('Register Failed:', errorInfo)
}

const countdown = ref(0)
let timer = null

const handleSendCaptcha = () => {
  if (!registerFormState.username) {
    // message.error('请输入用户名')
    return
  }

  if (!registerFormState.email) {
    // message.error('请输入邮箱')
    return
  }

  // 这里应该调用发送验证码的API
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}
</script>

<style scoped>
.login-layout {
  min-height: 100vh;
  background: url('@/assets/login-bg.jpg') no-repeat center center fixed;
  background-size: cover;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-card {
  width: 400px;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.captcha-container {
  display: flex;
  align-items: center;
}
</style>
