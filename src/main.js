import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

//Cấu hình Google Login với Client ID
app.use(vue3GoogleLogin, {
    clientId: '1090844427851-g1hfpluc79irjnftmvn620m8g261rfct.apps.googleusercontent.com'
})

app.use(router)
app.use(Antd)

app.mount('#app')