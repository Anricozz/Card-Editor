import { createApp } from 'vue'
import { addIcon } from '@iconify/vue'
import App from './App.vue'
import { registerIcons } from './constants/icons'
import './style.css'

// 圖示資料本地註冊，執行期不向 CDN 取圖
registerIcons(addIcon)

createApp(App).mount('#app')
