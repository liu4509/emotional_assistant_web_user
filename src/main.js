import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'
import { userPlugin } from './plugins/user'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// 使用用户插件
app.use(userPlugin)

// 使用路由
app.use(router)

app.mount('#app')
