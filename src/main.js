import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(pinia)

const authStore = useAuthStore(pinia)
authStore.restoreSession()

app.use(router)
app.use(Antd)

app.mount('#app')
